from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from users.models import User, Customer, Merchant
from django.core.validators import MinValueValidator
from django.utils import timezone
import croniter
import datetime

class Merchant(models.Model):
    user = models.OneToOneField(User, on_delete=models.PROTECT)
    business_name = models.CharField(max_length=255)
    bank_account_number = models.CharField(max_length=50, blank=True)
    
    # Specialization fields
    is_biller = models.BooleanField(default=False)
    is_subscription_provider = models.BooleanField(default=False)
    is_remittance_agent = models.BooleanField(default=False)
    
    # Biller specific fields
    biller_code = models.CharField(max_length=50, blank=True)
    biller_category = models.CharField(max_length=50, blank=True)
    
    # Subscription provider fields
    subscription_terms = models.TextField(blank=True)
    
    # Remittance agent fields
    remittance_license = models.CharField(max_length=100, blank=True)
    supported_countries = models.JSONField(default=list)
    
    def __str__(self):
        return self.business_name

class PaymentMethod(models.Model):
    CREDIT_CARD = 'credit_card'
    BANK_TRANSFER = 'bank_transfer'
    MOBILE_MONEY = 'mobile_money'
    CRYPTO = 'cryptocurrency'
    QR = 'qr_payment'
    APPLE_PAY = 'apple_pay'
    GOOGLE_PAY = 'google_pay'
    
    METHOD_CHOICES = [
        (CREDIT_CARD, 'Credit Card'),
        (BANK_TRANSFER, 'Bank Transfer'),
        (MOBILE_MONEY, 'Mobile Money'),
        (CRYPTO, 'Cryptocurrency'),
        (QR, 'QR Payment'),
        (APPLE_PAY, 'Apple Pay'),
        (GOOGLE_PAY, 'Google Pay')
    ]
    
    MOBILE_PROVIDERS = [
        ('mtn', 'MTN Mobile Money'),
        ('telecel', 'Telecel Cash'),
        ('airtel_tigo', 'AirtelTigo Money')
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    method_type = models.CharField(max_length=13, choices=METHOD_CHOICES)
    details = models.JSONField()
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_method_type_display()} - {self.user.email}"

    def clean(self):
        """Validate payment method details based on type"""
        if self.method_type == self.MOBILE_MONEY:
            if 'provider' not in self.details:
                raise ValidationError("Mobile money requires provider in details")
            if 'phone_number' not in self.details:
                raise ValidationError("Mobile money requires phone number")
            if self.details['provider'] not in [p[0] for p in self.MOBILE_PROVIDERS]:
                raise ValidationError("Invalid mobile money provider")
        elif self.method_type == self.CREDIT_CARD:
            required = ['last4', 'exp_month', 'exp_year', 'brand']
            if not all(k in self.details for k in required):
                raise ValidationError(f"Card requires: {', '.join(required)}")
        elif self.method_type == self.BANK_TRANSFER:
            if not all(k in self.details for k in ['account_number', 'bank_name']):
                raise ValidationError("Bank transfer requires account details")
        elif self.method_type == self.CRYPTO:
            if 'wallet_address' not in self.details:
                raise ValidationError("Crypto requires wallet address")

class ReportDashboard(models.Model):
    """
    Model for storing reporting dashboard configurations
    """
    name = models.CharField(max_length=100)
    config = models.JSONField(default=dict)
    
    def __str__(self):
        return self.name

class Payment(models.Model):
    """
    Enhanced Payment model with additional functionality
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('partially_refunded', 'Partially Refunded'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('card', 'Credit/Debit Card'),
        ('bank', 'Bank Transfer'),
        ('mobile', 'Mobile Money'),
        ('wallet', 'Digital Wallet'),
    ]
    
    REGULAR = 'regular'
    BILL = 'bill'
    REMITTANCE = 'remittance'
    PAYMENT_TYPE_CHOICES = [
        (REGULAR, 'Regular Payment'),
        (BILL, 'Bill Payment'), 
        (REMITTANCE, 'Remittance')
    ]
    
    BILL_TYPES = [
        ('utility', 'Utility Bill'),
        ('tax', 'Tax Payment'),
        ('loan', 'Loan Payment'),
        ('other', 'Other')
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='payments')
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHOD_CHOICES)
    transaction_id = models.CharField(max_length=100, blank=True, unique=True)
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    payment_type = models.CharField(
        max_length=10,
        choices=PAYMENT_TYPE_CHOICES,
        default=REGULAR,
        help_text="Determines payment processing rules and fields"
    )
    
    # Bill payment specific fields (nullable)
    bill_reference = models.CharField(max_length=100, blank=True, help_text="Biller's reference number or invoice ID")
    bill_due_date = models.DateField(null=True, blank=True, help_text="Due date for bill payment")
    bill_type = models.CharField(max_length=10, choices=BILL_TYPES, blank=True, help_text="Type of bill (utility, tax, etc.)")
    is_remitted = models.BooleanField(default=False)
    remittance_date = models.DateTimeField(blank=True, null=True)
    remittance_reference = models.CharField(max_length=100, blank=True, help_text="Remittance tracking reference")
    recipient_country = models.CharField(max_length=3, blank=True, help_text="ISO country code of recipient")
    recipient_name = models.CharField(max_length=255, blank=True, help_text="Full name of remittance recipient")
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True, help_text="FX rate applied at time of remittance")
    
    # Additional bill payment fields
    due_date = models.DateField(blank=True, null=True)
    late_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    billing_period = models.CharField(max_length=20, blank=True, null=True)
    bill_issuer = models.CharField(max_length=100, blank=True, null=True)
    bill_issuer_code = models.CharField(max_length=20, blank=True, null=True)
    
    # Remittance tracking
    remittance_batch = models.CharField(max_length=50, blank=True, null=True)
    remittance_processed_by = models.ForeignKey(
        'auth.User', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='remitted_payments'
    )
    
    # Accounting integration fields
    ACCOUNTING_SYNC_CHOICES = [
        ('pending', 'Pending Sync'),
        ('synced', 'Synced'),
        ('failed', 'Sync Failed'),
    ]
    accounting_sync_status = models.CharField(
        max_length=20,
        choices=ACCOUNTING_SYNC_CHOICES,
        default='pending'
    )
    accounting_ref = models.CharField(max_length=100, blank=True)
    last_sync_attempt = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['transaction_id']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.amount} {self.currency} - {self.get_status_display()} (Bill: {self.bill_reference})"
    
    def get_bill_display(self):
        return f"{self.get_bill_type_display()} - {self.bill_reference}"
    
    def get_remittance_display(self):
        if not self.is_remitted:
            return "Pending"
        return f"Remitted on {self.remittance_date.strftime('%Y-%m-%d')} (Ref: {self.remittance_reference})"
    
    def mark_as_completed(self, transaction_id=None):
        """Mark payment as completed"""
        self.status = 'completed'
        if transaction_id:
            self.transaction_id = transaction_id
        self.save()
    
    def mark_as_failed(self, reason=None):
        """Mark payment as failed with optional reason"""
        self.status = 'failed'
        if reason:
            self.metadata['failure_reason'] = reason
        self.save()
    
    def can_refund(self):
        """Check if payment can be refunded"""
        return self.status in ['completed', 'partially_refunded']
    
    def get_absolute_url(self):
        """Get admin URL for this payment"""
        from django.urls import reverse
        return reverse('admin:payments_payment_change', args=[str(self.id)])
    
    def sync_to_accounting(self):
        """Sync this payment to accounting system"""
        from .accounting_integration import AccountingSystem
        accounting = AccountingSystem()
        result = accounting.sync_payment(self)
        self.last_sync_attempt = timezone.now()
        self.save()
        return result
    
    def get_dirty_fields(self):
        """
        Track changed fields for webhook notifications
        """
        dirty_fields = {}
        if self.pk:
            old_instance = Payment.objects.get(pk=self.pk)
            for field in self._meta.fields:
                if getattr(self, field.name) != getattr(old_instance, field.name):
                    dirty_fields[field.name] = getattr(old_instance, field.name)
        return dirty_fields

class CrossBorderRemittance(models.Model):
    """Model for international money transfers"""
    PENDING = 'pending'
    PROCESSING = 'processing'
    COMPLETED = 'completed'
    FAILED = 'failed'
    
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (PROCESSING, 'Processing'),
        (COMPLETED, 'Completed'),
        (FAILED, 'Failed'),
    ]
    
    sender = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='sent_remittances')
    recipient_name = models.CharField(max_length=100)
    recipient_phone = models.CharField(max_length=20)
    recipient_country = models.CharField(max_length=3)  # ISO code
    amount_sent = models.DecimalField(max_digits=12, decimal_places=2)
    amount_received = models.DecimalField(max_digits=12, decimal_places=2)
    exchange_rate = models.DecimalField(max_digits=8, decimal_places=4)
    fee = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    reference_number = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.reference_number}: {self.amount_sent}→{self.recipient_country}"
    
    class Meta:
        verbose_name = 'Cross-Border Remittance'
        verbose_name_plural = 'Cross-Border Remittances'

class ScheduledPayout(models.Model):
    PENDING = 'pending'
    ACTIVE = 'active'
    PAUSED = 'paused'
    COMPLETED = 'completed'
    
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (ACTIVE, 'Active'),
        (PAUSED, 'Paused'),
        (COMPLETED, 'Completed'),
    ]
    
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    schedule = models.CharField(max_length=100)  # cron expression
    next_execution = models.DateTimeField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def calculate_next_execution(self):
        """Calculate next execution time based on cron schedule"""
        base = datetime.datetime.now()
        iter = croniter.croniter(self.schedule, base)
        self.next_execution = iter.get_next(datetime.datetime)
        
    def __str__(self):
        return f"{self.merchant.business_name} - {self.amount} - {self.schedule}"

class USSDTransaction(models.Model):
    """Track USSD payment sessions and state"""
    NEW = 'new'
    AMOUNT_ENTERED = 'amount_entered'
    CONFIRMED = 'confirmed'
    COMPLETED = 'completed'
    FAILED = 'failed'
    
    STATUS_CHOICES = [
        (NEW, 'New Session'),
        (AMOUNT_ENTERED, 'Amount Entered'),
        (CONFIRMED, 'Confirmed'),
        (COMPLETED, 'Completed'),
        (FAILED, 'Failed')
    ]
    
    session_id = models.CharField(max_length=100, unique=True)
    phone_number = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=NEW)
    transaction = models.ForeignKey('Payment', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"USSD Session {self.session_id} - {self.status}"

    def get_next_menu(self):
        """Determine next USSD menu based on current state"""
        if self.status == self.NEW:
            return "Enter amount"
        elif self.status == self.AMOUNT_ENTERED:
            return f"Confirm payment of {self.amount}? 1. Yes 2. No"
        return None
