from django.contrib import admin
from django.db.models import Q, Sum, Count, Avg, Max
from django.db.models.functions import TruncDay, TruncMonth
from .models.payment import Payment
from .models.payment_method import PaymentMethod
from .models.transaction import Transaction
from .models.merchant import Merchant as PaymentsMerchant
from .models.payment_log import PaymentLog as PaymentsPaymentLog
from .models.subscription import Subscription
from .models.ussd_transaction import USSDTransaction
from .models.scheduled_payout import ScheduledPayout
# from .models import ReportDashboard  # TODO: Check if this model exists
from .models.cross_border import CrossBorderRemittance
# from .models import VerificationConfig  # TODO: Check if this model exists
# from .models import VerificationDashboard  # TODO: Check if this model exists
from .models.verification import VerificationLog, ProviderHealth
from django.utils.html import format_html
from django.urls import reverse, path
from django.http import HttpResponse, JsonResponse
import csv
import json
import logging
from django.utils import timezone
from django.contrib import messages
from datetime import timedelta

logger = logging.getLogger(__name__)

# Import all payment models
# from .models import (
#     Payment, PaymentMethod, Transaction, Merchant as PaymentsMerchant,
#     PaymentLog as PaymentsPaymentLog, Subscription, USSDTransaction, ScheduledPayout, ReportDashboard, CrossBorderRemittance, VerificationConfig, VerificationDashboard, VerificationLog, ProviderHealth
# )

@admin.action(description='Mark selected payments as completed')
def mark_completed(modeladmin, request, queryset):
    queryset.update(status='completed')

@admin.action(description='Mark selected payments as failed')
def mark_failed(modeladmin, request, queryset):
    queryset.update(status='failed')

@admin.action(description='Export selected payments to CSV')
def export_csv(modeladmin, request, queryset):
    import csv
    from django.http import HttpResponse
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="payments.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['ID', 'Customer', 'Merchant', 'Amount', 'Currency', 'Status', 'Created At'])
    
    for payment in queryset:
        writer.writerow([
            payment.id,
            payment.customer.user.email,
            payment.merchant.business_name,
            payment.amount,
            payment.currency,
            payment.get_status_display(),
            payment.created_at
        ])
    
    return response

class StatusFilter(admin.SimpleListFilter):
    title = 'payment status'
    parameter_name = 'status'
    
    def lookups(self, request, model_admin):
        return (
            ('completed', 'Completed'),
            ('pending', 'Pending'),
            ('failed', 'Failed'),
            ('refunded', 'Refunded'),
        )
    
    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(status=self.value())
        return queryset

class PaymentTypeFilter(admin.SimpleListFilter):
    title = 'payment type'
    parameter_name = 'payment_type'
    
    def lookups(self, request, model_admin):
        return Payment.PAYMENT_TYPE_CHOICES
    
    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(payment_type=self.value())
        return queryset

class BillerFilter(admin.SimpleListFilter):
    title = 'is biller'
    parameter_name = 'is_biller'
    
    def lookups(self, request, model_admin):
        return (
            ('1', 'Yes'),
            ('0', 'No'),
        )
    
    def queryset(self, request, queryset):
        if self.value() == '1':
            return queryset.filter(merchant__is_biller=True)
        if self.value() == '0':
            return queryset.filter(merchant__is_biller=False)

class RemittanceAgentFilter(admin.SimpleListFilter):
    title = 'is remittance agent'
    parameter_name = 'is_remittance_agent'
    
    def lookups(self, request, model_admin):
        return (
            ('1', 'Yes'),
            ('0', 'No'),
        )
    
    def queryset(self, request, queryset):
        if self.value() == '1':
            return queryset.filter(merchant__is_remittance_agent=True)
        if self.value() == '0':
            return queryset.filter(merchant__is_remittance_agent=False)

class PaymentAnalytics(admin.AdminSite):
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('analytics/', self.admin_view(self.payment_analytics), name='payment-analytics'),
            path('export-report/', self.admin_view(self.export_report), name='export-report'),
        ]
        return custom_urls + urls
    
    def payment_analytics(self, request):
        # Daily payment volume
        daily_data = Payment.objects.annotate(
            day=TruncDay('created_at')
        ).values('day').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('day')
        
        # Payment method distribution
        method_data = Payment.objects.values('payment_method').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        # Status distribution
        status_data = Payment.objects.values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        context = {
            'daily_data': list(daily_data),
            'method_data': list(method_data),
            'status_data': list(status_data),
        }
        return JsonResponse(context)
    
    def export_report(self, request):
        # Generate comprehensive report
        report = {
            'summary': {
                'total_payments': Payment.objects.count(),
                'total_amount': Payment.objects.aggregate(Sum('amount'))['amount__sum'],
                'avg_amount': Payment.objects.aggregate(Avg('amount'))['amount__avg'],
            },
            'monthly_trends': list(
                Payment.objects.annotate(
                    month=TruncMonth('created_at')
                ).values('month').annotate(
                    total=Sum('amount'),
                    count=Count('id')
                ).order_by('month')
            ),
            'top_customers': list(
                Payment.objects.values('customer__user__email').annotate(
                    total=Sum('amount'),
                    count=Count('id')
                ).order_by('-total')[:10]
            ),
            'top_merchants': list(
                Payment.objects.values('merchant__business_name').annotate(
                    total=Sum('amount'),
                    count=Count('id')
                ).order_by('-total')[:10]
            )
        }
        
        response = JsonResponse(report)
        response['Content-Disposition'] = 'attachment; filename="payment_report.json"'
        return response

class PaymentAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        base_list = ['id', 'payment_type_badge', 'customer_link', 'merchant_link', 
                   'amount_with_currency', 'status_badge']
        if request.path.endswith('billpayment/'):
            base_list.extend(['bill_reference', 'bill_type'])
        elif request.path.endswith('remittance/'):
            base_list.extend(['recipient_name', 'recipient_country'])
        return base_list

    def get_changelist(self, request, **kwargs):
        if request.path.endswith('billpayment/'):
            self.list_display_links = ('id', 'bill_reference')
        elif request.path.endswith('remittance/'):
            self.list_display_links = ('id', 'recipient_name')
        return super().get_changelist(request, **kwargs)

    list_filter = (StatusFilter, PaymentTypeFilter, BillerFilter, RemittanceAgentFilter, 'created_at')
    
    def get_payment_type_display(self, obj):
        return obj.get_payment_type_display()
    get_payment_type_display.short_description = 'Payment Type'
    
    def get_fieldsets(self, request, obj=None):
        base_fieldsets = [
            ('Basic Information', {'fields': ('customer', 'merchant', 'payment_type')}),
            ('Payment Details', {'fields': ('amount', 'currency', 'payment_method', 'status')}),
            ('Dates', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)})
        ]
        
        if obj and obj.payment_type == 'bill':
            base_fieldsets.insert(2, (
                'Bill Information', {
                    'fields': ('bill_reference', 'bill_due_date', 'bill_type'),
                    'classes': ('wide',)
                }
            ))
        elif obj and obj.payment_type == 'remittance':
            base_fieldsets.insert(2, (
                'Remittance Information', {
                    'fields': ('remittance_reference', 'recipient_country', 'recipient_name', 'exchange_rate'),
                    'classes': ('wide',)
                }
            ))
            
        return base_fieldsets
    
    def get_form(self, request, obj=None, **kwargs):
        # First check if payment_type exists in model AND database
        has_payment_type = hasattr(Payment, 'payment_type') \
            and any(f.name == 'payment_type' for f in Payment._meta.get_fields())
        
        # Explicitly declare fields to avoid any ambiguity
        if has_payment_type:
            self.fields = [
                'customer', 'merchant', 'payment_type',
                'amount', 'currency', 'payment_method', 'status'
            ]
        else:
            self.fields = [
                'customer', 'merchant',
                'amount', 'currency', 'payment_method', 'status'
            ]
            
        form = super().get_form(request, obj, **kwargs)
        
        # If field should exist but wasn't added automatically
        if has_payment_type and 'payment_type' not in form.base_fields:
            from django import forms
            form.base_fields['payment_type'] = forms.ChoiceField(
                choices=getattr(Payment, 'PAYMENT_TYPE_CHOICES', []),
                required=False
            )
            
        return form
    
    def customer_link(self, obj):
        url = reverse('admin:accounts_customer_change', args=[obj.customer.id])
        return format_html('<a href="{}">{}</a>', url, obj.customer.user.email)
    customer_link.short_description = 'Customer'
    
    def merchant_link(self, obj):
        url = reverse('admin:accounts_merchant_change', args=[obj.merchant.id])
        return format_html('<a href="{}">{}</a>', url, obj.merchant.business_name)
    merchant_link.short_description = 'Merchant'
    
    def amount_with_currency(self, obj):
        return f"{obj.amount} {obj.currency}"
    amount_with_currency.short_description = 'Amount'
    
    def status_badge(self, obj):
        colors = {
            'completed': 'green',
            'pending': 'orange',
            'failed': 'red',
            'refunded': 'blue'
        }
        return format_html(
            '<span style="color: white; background-color: {}; padding: 3px 8px; border-radius: 10px;">{}</span>',
            colors.get(obj.status, 'gray'),
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def payment_type_badge(self, obj):
        colors = {
            'regular': 'gray',
            'bill': 'blue',
            'remittance': 'purple'
        }
        return format_html(
            '<span style="color: white; background-color: {}; padding: 3px 8px; border-radius: 10px;">{}</span>',
            colors.get(obj.payment_type, 'gray'),
            obj.get_payment_type_display()
        )
    payment_type_badge.short_description = 'Type'

    def payment_details(self, obj):
        return format_html(
            '<strong>Method:</strong> {}<br><strong>Status:</strong> {}',
            obj.payment_method,
            obj.get_status_display()
        )
    payment_details.short_description = 'Details'
    
    def payment_actions(self, obj):
        return format_html(
            '<a class="button" href="{}?status=completed">Complete</a>',
            reverse('admin:payments_payment_change', args=[obj.id])
        )
    payment_actions.short_description = 'Actions'
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    change_list_template = 'admin/payments/payment/change_list.html'
    
    def changelist_view(self, request, extra_context=None):
        from .utils.alerts import AlertService
        
        extra_context = extra_context or {}
        extra_context['alerts'] = AlertService.get_recent_alerts()
        
        return super().changelist_view(request, extra_context=extra_context)

    @admin.action(description='Export selected bill payments to CSV')
    def export_bill_payments_csv(modeladmin, request, queryset):
        queryset = queryset.filter(payment_type='bill')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="bill_payments.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['ID', 'Customer', 'Biller', 'Amount', 'Bill Ref', 'Bill Type', 'Due Date', 'Status'])
        
        for payment in queryset:
            writer.writerow([
                payment.id,
                payment.customer.user.email,
                payment.merchant.business_name,
                payment.amount,
                payment.bill_reference,
                payment.bill_type,
                payment.bill_due_date,
                payment.get_status_display()
            ])
        
        return response

    @admin.action(description='Export selected remittances to CSV')
    def export_remittances_csv(modeladmin, request, queryset):
        queryset = queryset.filter(payment_type='remittance')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="remittances.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['ID', 'Sender', 'Agent', 'Amount', 'Recipient', 'Country', 'Exchange Rate', 'Status'])
        
        for payment in queryset:
            writer.writerow([
                payment.id,
                payment.customer.user.email,
                payment.merchant.business_name,
                payment.amount,
                payment.recipient_name,
                payment.recipient_country,
                payment.exchange_rate,
                payment.get_status_display()
            ])
        
        return response

    actions = [mark_completed, mark_failed, export_csv, export_bill_payments_csv, export_remittances_csv]

class BillPaymentAdmin(admin.ModelAdmin):
    list_display = ('bill_reference', 'customer', 'amount', 'bill_type', 'remittance_status', 'days_overdue', 'compliance_status', 'compliance_checks')
    list_filter = (PaymentTypeFilter, BillerFilter, 'bill_type', 'status', 'is_remitted', 'due_date')
    search_fields = ('bill_reference', 'customer__user__email', 'merchant__name')
    actions = ['generate_remittance_report', 'export_as_json', 'bulk_remit']
    readonly_fields = ('remittance_reference', 'remittance_date', 'compliance_checks')
    date_hierarchy = 'due_date'
    
    fieldsets = (
        (None, {
            'fields': ('customer', 'merchant', 'amount', 'currency', 'status')
        }),
        ('Bill Information', {
            'fields': ('bill_reference', 'bill_type', 'bill_issuer', 'due_date', 'late_fee')
        }),
        ('Remittance Details', {
            'fields': ('is_remitted', 'remittance_reference', 'remittance_date', 'compliance_checks'),
            'classes': ('collapse',)
        })
    )
    
    def remittance_status(self, obj):
        if obj.is_remitted:
            return format_html('<span class="badge badge-success">✓ Remitted</span>')
        elif obj.due_date and obj.due_date < timezone.now().date():
            return format_html('<span class="badge badge-danger">⚠ Overdue</span>')
        return format_html('<span class="badge badge-warning">Pending</span>')
    remittance_status.short_description = 'Status'
    
    def days_overdue(self, obj):
        if obj.due_date and not obj.is_remitted:
            delta = (timezone.now().date() - obj.due_date).days
            return max(0, delta)
        return 0
    days_overdue.short_description = 'Days Overdue'
    
    def compliance_status(self, obj):
        if obj.due_date and obj.due_date < timezone.now().date() and not obj.is_remitted:
            return format_html('<span class="badge badge-danger">Non-Compliant</span>')
        return format_html('<span class="badge badge-success">Compliant</span>')
    compliance_status.short_description = 'Compliance'
    
    def compliance_checks(self, obj):
        checks = []
        if obj.due_date:
            checks.append(f"Due Date: {obj.due_date}")
            checks.append(f"Remitted: {'Yes' if obj.is_remitted else 'No'}")
            if obj.is_remitted:
                checks.append(f"Remittance Date: {obj.remittance_date}")
                days_late = (obj.remittance_date.date() - obj.due_date).days
                checks.append(f"Days {'Early' if days_late < 0 else 'Late'}: {abs(days_late)}")
        return format_html("<br>".join(checks))
    compliance_checks.short_description = 'Compliance Details'
    
    def generate_remittance_report(self, request, queryset):
        """Enhanced report with additional metrics and visualization data"""
        from django.db.models import Count, Sum, Q, F, Avg, Max, Min
        from datetime import timedelta
        
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        # Calculate time-based metrics
        time_metrics = {
            'avg_processing_time': queryset.filter(
                is_remitted=True
            ).aggregate(
                avg_time=Avg(F('remittance_date') - F('due_date'))
            )['avg_time'],
            'min_processing_time': queryset.filter(
                is_remitted=True
            ).aggregate(
                min_time=Min(F('remittance_date') - F('due_date'))
            )['min_time'],
            'max_processing_time': queryset.filter(
                is_remitted=True
            ).aggregate(
                max_time=Max(F('remittance_date') - F('due_date'))
            )['max_time']
        }
        
        # Enhanced report structure
        report = {
            'meta': {
                'generated_at': timezone.now().isoformat(),
                'time_range': {
                    'start': thirty_days_ago.isoformat(),
                    'end': timezone.now().isoformat()
                },
                'record_count': queryset.count()
            },
            'summary': {
                'total_amount': queryset.aggregate(Sum('amount'))['amount__sum'] or 0,
                'avg_amount': queryset.aggregate(Avg('amount'))['amount__avg'] or 0,
                'max_amount': queryset.aggregate(Max('amount'))['amount__max'] or 0,
                'completion_rate': queryset.filter(is_remitted=True).count() / max(1, queryset.count()),
                'time_metrics': time_metrics
            },
            'trends': {
                'daily': list(queryset.filter(
                    created_at__gte=thirty_days_ago
                ).extra({'date': "date(created_at)"}).values(
                    'date'
                ).annotate(
                    count=Count('id'),
                    amount=Sum('amount'),
                    avg_amount=Avg('amount')
                ).order_by('date')),
                'bill_types': list(queryset.values(
                    'bill_type'
                ).annotate(
                    count=Count('id'),
                    amount=Sum('amount'),
                    avg_time=Avg(F('remittance_date') - F('due_date'))
                ).order_by('-amount'))
            },
            'compliance': {
                'on_time': queryset.filter(
                    Q(is_remitted=True) & 
                    Q(remittance_date__lte=F('due_date'))
                ).count(),
                'late': queryset.filter(
                    Q(is_remitted=True) & 
                    Q(remittance_date__gt=F('due_date'))
                ).count(),
                'overdue': queryset.filter(
                    Q(is_remitted=False) & 
                    Q(due_date__lt=timezone.now())
                ).count(),
                'compliance_rate': (
                    queryset.filter(
                        Q(is_remitted=True) & 
                        Q(remittance_date__lte=F('due_date'))
                    ).count() / 
                    max(1, queryset.filter(is_remitted=True).count())
                ) * 100
            }
        }
        return report
    generate_remittance_report.short_description = "Generate detailed remittance report"
    
    def export_as_json(self, request, queryset):
        """Export report as JSON download"""
        import json
        from django.http import HttpResponse
        
        data = self.generate_remittance_report(request, queryset)
        response = HttpResponse(
            json.dumps(data, indent=2), 
            content_type='application/json'
        )
        response['Content-Disposition'] = 'attachment; filename=remittance_report.json'
        return response
    export_as_json.short_description = "Export report as JSON"
    
    def bulk_remit(self, request, queryset):
        """Bulk mark selected bills as remitted"""
        from .services import RemittanceService
        
        updated = 0
        for bill in queryset.filter(is_remitted=False):
            try:
                RemittanceService.process_remittance(bill)
                updated += 1
            except Exception as e:
                self.message_user(request, f"Failed to remit bill {bill.id}: {str(e)}", level='error')
        
        self.message_user(request, f"Successfully remitted {updated} bills")
    bulk_remit.short_description = "Mark as remitted"
    
    def get_urls(self):
        """Add custom report URLs"""
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('remittance-dashboard/', self.admin_site.admin_view(self.remittance_dashboard),
                name='payments_billpayment_remittance_dashboard'),
            path('remittance-export/', self.admin_site.admin_view(self.export_remittance_data),
                name='payments_billpayment_remittance_export'),
        ]
        return custom_urls + urls
    
    def remittance_dashboard(self, request):
        """Interactive dashboard view"""
        from django.shortcuts import render
        
        # Get all bill payments for dashboard
        queryset = self.get_queryset(request)
        report = self.generate_remittance_report(request, queryset)
        
        context = {
            'report': report,
            'opts': self.model._meta,
            'title': 'Remittance Dashboard'
        }
        return render(request, 'admin/payments/remittance_dashboard.html', context)
    
    def export_remittance_data(self, request):
        """Export full remittance data"""
        from django.http import HttpResponse
        import csv
        
        queryset = self.get_queryset(request)
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="remittance_data.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Customer', 'Biller', 'Amount', 'Currency',
            'Bill Reference', 'Bill Type', 'Due Date', 'Remitted',
            'Remittance Date', 'Days Late'
        ])
        
        for bill in queryset:
            days_late = (bill.remittance_date.date() - bill.due_date).days if \
                bill.is_remitted and bill.due_date else None
            
            writer.writerow([
                bill.id,
                bill.customer.user.email,
                bill.merchant.business_name,
                bill.amount,
                bill.currency,
                bill.bill_reference,
                bill.bill_type,
                bill.due_date,
                'Yes' if bill.is_remitted else 'No',
                bill.remittance_date if bill.is_remitted else '',
                days_late if days_late else ''
            ])
        
        return response

# Update admin site registration
from django.contrib.admin.sites import NotRegistered

try:
    admin.site.unregister(Payment)
except NotRegistered:
    pass

# admin.site.register(Payment, BillPaymentAdmin)

class PaymentsAdminSite(admin.AdminSite):
    def get_app_list(self, request):
        app_list = super().get_app_list(request)
        
        # Reorganize payments app
        for app in app_list:
            if app['app_label'] == 'payments':
                # Create new groups
                bill_payments = {
                    'name': 'Bill Payments',
                    'models': []
                }
                remittances = {
                    'name': 'Remittances', 
                    'models': []
                }
                
                # Categorize models
                for model in app['models']:
                    if model['object_name'] == 'Payment' and 'BillPaymentAdmin' in str(type(model['model'])):
                        bill_payments['models'].append(model)
                    elif model['object_name'] == 'Payment' and 'RemittanceAdmin' in str(type(model['model'])):
                        remittances['models'].append(model)
                    else:
                        # Keep other models in main payments group
                        if 'models' not in app:
                            app['models'] = []
                        app['models'].append(model)
                
                # Add new groups if they have models
                if bill_payments['models']:
                    app['models'].append(bill_payments)
                if remittances['models']:
                    app['models'].append(remittances)
                
        return app_list

# Replace default admin site
payments_admin = PaymentsAdminSite(name='payments_admin')

# Register additional payment models
@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('user', 'method_type', 'is_default', 'created_at')
    list_filter = ('method_type', 'is_default', 'created_at')
    search_fields = ('user__email',)

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'merchant', 'amount', 'status', 'created_at')
    list_filter = ('status', 'created_at', 'payment_method__method_type')
    search_fields = ('customer__user__email', 'merchant__business_name')
    actions = ['process_refunds', 'update_statuses', 'export_transactions']
    
    def process_refunds(self, request, queryset):
        """Admin action to process refunds for selected transactions"""
        from .services import PaymentProcessor
        processor = PaymentProcessor()
        
        for txn in queryset.filter(status='completed'):
            try:
                processor.refund_payment(txn)
                self.message_user(request, f"Refund processed for transaction {txn.id}")
            except Exception as e:
                self.message_user(request, f"Failed to refund {txn.id}: {str(e)}", level='error')
    process_refunds.short_description = "Process refunds for selected transactions"
    
    def update_statuses(self, request, queryset):
        """Admin action to bulk update transaction statuses"""
        status = request.POST.get('status')
        if status and status in dict(Transaction.STATUS_CHOICES):
            updated = queryset.update(status=status)
            self.message_user(request, f"Updated {updated} transactions to {status}")
        else:
            self.message_user(request, "Invalid status selected", level='error')
    update_statuses.short_description = "Update status of selected transactions"
    
    def export_transactions(self, request, queryset):
        """Export selected transactions to CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="transactions.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['ID', 'Customer', 'Merchant', 'Amount', 'Currency', 'Status', 'Date'])
        
        for txn in queryset:
            writer.writerow([
                txn.id,
                txn.customer.user.email,
                txn.merchant.business_name,
                txn.amount,
                txn.currency,
                txn.get_status_display(),
                txn.created_at
            ])
        
        return response
    export_transactions.short_description = "Export selected transactions to CSV"
    
    def changelist_view(self, request, extra_context=None):
        """Add summary stats to admin list view"""
        response = super().changelist_view(request, extra_context=extra_context)
        
        if hasattr(response, 'context_data') and 'cl' in response.context_data:
            queryset = response.context_data['cl'].queryset
            response.context_data['summary'] = {
                'total_count': queryset.count(),
                'total_amount': sum(t.amount for t in queryset if t.amount),
                'completed_count': queryset.filter(status='completed').count(),
                'failed_count': queryset.filter(status='failed').count()
            }
        
        return response

@admin.register(PaymentsMerchant)
class PaymentsMerchantAdmin(admin.ModelAdmin):
    list_display = ('user', 'business_name', 'is_biller', 'is_subscription_provider')
    list_filter = ('is_biller', 'is_subscription_provider', 'is_remittance_agent')
    search_fields = ('user__email', 'business_name')

@admin.register(PaymentsPaymentLog)
class PaymentsPaymentLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'payment_type', 'created_at')
    list_filter = ('payment_type', 'created_at')
    search_fields = ('user__email',)

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('customer', 'provider', 'tier', 'status', 'subscription_start_date', 'subscription_end_date')
    list_filter = ('status', 'tier', 'created_at')
    search_fields = ('customer__user__email', 'provider__business_name')

@admin.register(USSDTransaction)
class USSDTransactionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'phone_number', 'status', 'amount', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('session_id', 'phone_number')

@admin.register(ScheduledPayout)
class ScheduledPayoutAdmin(admin.ModelAdmin):
    list_display = ('merchant', 'amount', 'status', 'next_execution', 'created_at')
    list_filter = ('status', 'next_execution', 'created_at')
    search_fields = ('merchant__business_name',)

# @admin.register(ReportDashboard)
# class ReportDashboardAdmin(admin.ModelAdmin):
#     change_list_template = 'admin/payments/report_dashboard.html'
#     
#     def changelist_view(self, request, extra_context=None):
#         from .services.remittance_service import RemittanceService
#         
#         response = super().changelist_view(
#             request,
#             extra_context=extra_context or {},
#         )
#         
#         # Add visualization data to context
#         if not hasattr(response, 'context_data'):
#             response.context_data = {}
#             
#         response.context_data['visualization_data'] = (
#             RemittanceService.generate_visualization_data()
#         )
#         
#         return response
#     
#     def get_urls(self):
#         from django.urls import path
#         urls = super().get_urls()
#         custom_urls = [
#             path('visualization-data/', self.admin_site.admin_view(
#                 self.visualization_data_api),
#                 name='payment_visualization_data'),
#         ]
#         return custom_urls + urls
#     
#     def visualization_data_api(self, request):
#         """JSON API endpoint for visualization data"""
#         from django.http import JsonResponse
#         from .services.remittance_service import RemittanceService
#         
#         date_range = (
#             request.GET.get('start_date'),
#             request.GET.get('end_date')
#         ) if 'start_date' in request.GET else None
#         
#         data = RemittanceService.generate_visualization_data(date_range)
#         return JsonResponse(data)

# Register models with both the default admin and payment analytics admin
payment_analytics_admin = PaymentAnalytics(name='payment_admin')
payment_analytics_admin.register(Payment, PaymentAdmin)

# @admin.register(VerificationConfig)
# class VerificationConfigAdmin(admin.ModelAdmin):
#     list_display = ['provider', 'is_active']
#     actions = ['activate_provider']
#     
#     def activate_provider(self, request, queryset):
#         """Set selected provider as active"""
#         if queryset.count() != 1:
#             self.message_user(request, "Select exactly one provider", messages.ERROR)
#             return
#             
#         provider = queryset.first()
#         settings.PHONE_VERIFICATION_PROVIDER = provider.name
#         self.message_user(request, f"Activated {provider.name} provider")
#     activate_provider.short_description = "Activate selected provider"

@admin.register(CrossBorderRemittance)
class CrossBorderRemittanceAdmin(admin.ModelAdmin):
    change_form_template = 'admin/payments/crossborderremittance/change_form.html'
    list_display = [
        'reference_number', 
        'sender', 
        'recipient_country',
        'amount_sent', 
        'amount_received',
        'status',
        'created_at'
    ]
    list_filter = ['status', 'recipient_country', 'created_at']
    search_fields = ['reference_number', 'sender__user__email', 'recipient_phone']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Sender Information', {
            'fields': ('sender', 'amount_sent')
        }),
        ('Recipient Information', {
            'fields': (
                'recipient_name', 
                'recipient_phone',
                'recipient_country',
                'amount_received'
            )
        }),
        ('Transaction Details', {
            'fields': (
                'exchange_rate',
                'fee',
                'status',
                'reference_number'
            )
        })
    )
    
    readonly_fields = ['reference_number', 'amount_received', 'exchange_rate']
    
    actions = ['verify_recipients', 'verify_sources', 'approve_exemptions', 'reject_exemptions']
    
    def verify_recipients(self, request, queryset):
        """Bulk verify recipients"""
        from .services.verification import VerificationService
        
        for remittance in queryset:
            remittance.recipient_verified = VerificationService.verify_phone_number(
                remittance.recipient_phone
            )
            remittance.save()
        self.message_user(request, f"Verified {queryset.count()} recipients")
    verify_recipients.short_description = "Verify selected recipients"
    
    def verify_sources(self, request, queryset):
        """Bulk verify sources of funds"""
        from .services.verification import VerificationService
        
        for remittance in queryset:
            remittance.source_of_funds_verified = \
                VerificationService.verify_source_of_funds(remittance.sender)
            remittance.save()
        self.message_user(request, f"Verified {queryset.count()} sources")
    verify_sources.short_description = "Verify sources of funds"
    
    def approve_exemptions(self, request, queryset):
        """Admin action to approve exemptions"""
        for remittance in queryset.filter(exemption_status='pending'):
            remittance.exemption_status = 'approved'
            remittance.exemption_approver = request.user
            remittance.save()
        self.message_user(request, f"Approved {queryset.count()} exemptions")
    approve_exemptions.short_description = "Approve selected exemptions"
    
    def reject_exemptions(self, request, queryset):
        """Admin action to reject exemptions"""
        for remittance in queryset.filter(exemption_status='pending'):
            remittance.exemption_status = 'rejected'
            remittance.exemption_approver = request.user
            remittance.save()
        self.message_user(request, f"Rejected {queryset.count()} exemptions")
    reject_exemptions.short_description = "Reject selected exemptions"

# @admin.register(VerificationDashboard)
# class VerificationDashboardAdmin(admin.ModelAdmin):
#     change_list_template = 'admin/payments/verification_dashboard.html'
#     
#     def changelist_view(self, request, extra_context=None):
#         from .services.verification import VerificationService
#         from .models.verification import VerificationLog
#         
#         extra_context = extra_context or {}
#         extra_context.update({
#             'providers': VerificationService._provider_status,
#             'geo_stats': VerificationLog.geographic_stats()[:5],
#             'alerts': VerificationService.get_recent_alerts()
#         })
#         
#         return super().changelist_view(request, extra_context=extra_context)

@admin.register(VerificationLog)
class VerificationLogAdmin(admin.ModelAdmin):
    list_display = ['phone_number', 'provider', 'success', 'response_time', 'created_at']
    list_filter = ['provider', 'success', 'created_at']
    search_fields = ['phone_number']
    date_hierarchy = 'created_at'

@admin.register(ProviderHealth)
class ProviderHealthAdmin(admin.ModelAdmin):
    list_display = ['provider', 'is_healthy', 'last_checked', 'success_rate']
    list_filter = ['is_healthy', 'provider']
    readonly_fields = ['last_checked']
    ordering = ['-last_checked']

class RemittanceAdmin(PaymentAdmin):
    def get_queryset(self, request):
        return super().get_queryset(request).filter(payment_type='remittance')
    
    list_display = ('id', 'customer_link', 'merchant_link', 'amount_with_currency', 'recipient_name', 'recipient_country', 'status_badge')
