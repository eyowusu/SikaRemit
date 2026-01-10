from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from users.models import User, Customer, Merchant
from accounts.models import Recipient
from django.core.validators import MinValueValidator
from django.utils import timezone
import croniter
import datetime
from shared.constants import (
    PAYMENT_METHOD_CHOICES, MOBILE_MONEY_PROVIDERS, PAYMENT_STATUS_CHOICES,
    PAYMENT_TYPE_CHOICES, BILL_TYPE_CHOICES, PROCESSING_STATUS_CHOICES,
    FRAUD_ALERT_STATUS_CHOICES, STATUS_PENDING, STATUS_COMPLETED, STATUS_FAILED,
    METHOD_CREDIT_CARD, METHOD_BANK_TRANSFER, METHOD_MOBILE_MONEY,
    METHOD_QR_PAYMENT, METHOD_APPLE_PAY, METHOD_GOOGLE_PAY,
    PROVIDER_MTN, PROVIDER_TELECEL, PROVIDER_AIRTEL_TIGO,
)

class PaymentMethod(models.Model):
    # Constants for backwards compatibility
    CREDIT_CARD = METHOD_CREDIT_CARD
    BANK_TRANSFER = METHOD_BANK_TRANSFER
    MOBILE_MONEY = METHOD_MOBILE_MONEY
    QR = METHOD_QR_PAYMENT
    APPLE_PAY = METHOD_APPLE_PAY
    GOOGLE_PAY = METHOD_GOOGLE_PAY
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    method_type = models.CharField(max_length=13, choices=PAYMENT_METHOD_CHOICES)
    details = models.JSONField()
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_method_type_display()} - {self.user.email}"

    def clean(self):
        """Validate payment method details based on type"""
        if self.method_type == METHOD_MOBILE_MONEY:
            if 'provider' not in self.details:
                raise ValidationError("Mobile money requires provider in details")
            if 'phone_number' not in self.details:
                raise ValidationError("Mobile money requires phone number")
            if self.details['provider'] not in [p[0] for p in MOBILE_MONEY_PROVIDERS]:
                raise ValidationError("Invalid mobile money provider")
        elif self.method_type == METHOD_CREDIT_CARD:
            required = ['last4', 'exp_month', 'exp_year', 'brand']
            if not all(k in self.details for k in required):
                raise ValidationError(f"Card requires: {', '.join(required)}")
        elif self.method_type == METHOD_BANK_TRANSFER:
            if not all(k in self.details for k in ['account_number', 'bank_name']):
                raise ValidationError("Bank transfer requires account details")

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
            models.Index(fields=['customer', 'created_at']),  # For fraud detection queries
            models.Index(fields=['customer', 'status', 'created_at']),  # For fraud detection aggregations
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

class DomesticTransfer(models.Model):
    """Model for domestic P2P money transfers"""
    PENDING = 'pending'
    PROCESSING = 'processing'
    COMPLETED = 'completed'
    FAILED = 'failed'
    CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (PROCESSING, 'Processing'),
        (COMPLETED, 'Completed'),
        (FAILED, 'Failed'),
        (CANCELLED, 'Cancelled'),
    ]

    sender = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='sent_domestic_transfers')
    recipient = models.ForeignKey(Recipient, on_delete=models.PROTECT, related_name='received_domestic_transfers')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='GHS')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    reference_number = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.PROTECT)
    fee = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Domestic Transfer {self.reference_number}: {self.amount} {self.currency}"

    class Meta:
        verbose_name = 'Domestic Transfer'
        verbose_name_plural = 'Domestic Transfers'
        ordering = ['-created_at']


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
    
    transaction_id = models.CharField(max_length=100, unique=True, default='')
    phone_number = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=NEW)
    transaction = models.ForeignKey('Payment', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"USSD Session {self.transaction_id} - {self.status}"

    def get_next_menu(self):
        """Determine next USSD menu based on current state"""
        if self.status == self.NEW:
            return "Enter amount"
        elif self.status == self.AMOUNT_ENTERED:
            return f"Confirm payment of {self.amount}? 1. Yes 2. No"
        return None


class ExchangeRate(models.Model):
    """Store exchange rates for currency conversion with admin control"""
    from_currency = models.CharField(max_length=3, db_index=True, help_text="Source currency code (e.g., GHS)")
    to_currency = models.CharField(max_length=3, db_index=True, help_text="Target currency code (e.g., USD)")
    rate = models.DecimalField(max_digits=18, decimal_places=8, help_text="Exchange rate (1 from_currency = X to_currency)")
    source = models.CharField(max_length=50, default='admin', help_text="Source of the rate (admin, api, etc.)")

    # Admin control fields
    is_active = models.BooleanField(default=True, help_text="Whether this rate is currently active")
    effective_from = models.DateTimeField(default=timezone.now, help_text="When this rate becomes effective")
    effective_until = models.DateTimeField(null=True, blank=True, help_text="When this rate expires (null = indefinite)")

    # Audit fields
    created_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, related_name='created_rates', help_text="Admin who created this rate")
    updated_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, related_name='updated_rates', help_text="Admin who last updated this rate")

    # Metadata
    notes = models.TextField(blank=True, help_text="Additional notes about this rate")
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['from_currency', 'to_currency', 'effective_from']
        indexes = [
            models.Index(fields=['from_currency', 'to_currency']),
            models.Index(fields=['updated_at']),
            models.Index(fields=['is_active']),
            models.Index(fields=['effective_from', 'effective_until']),
        ]
        ordering = ['-effective_from']

    def __str__(self):
        return f"1 {self.from_currency} = {self.rate} {self.to_currency}"

    @property
    def is_currently_effective(self):
        """Check if this rate is currently effective"""
        now = timezone.now()
        return (
            self.is_active and
            self.effective_from <= now and
            (self.effective_until is None or self.effective_until > now)
        )

    @classmethod
    def get_current_rate(cls, from_currency, to_currency):
        """Get the current active exchange rate for a currency pair"""
        return cls.objects.filter(
            from_currency=from_currency,
            to_currency=to_currency,
            is_active=True
        ).filter(
            models.Q(effective_until__isnull=True) | models.Q(effective_until__gt=timezone.now()),
            effective_from__lte=timezone.now()
        ).order_by('-effective_from').first()


class ExchangeRateHistory(models.Model):
    """
    Historical record of exchange rate changes for audit trails
    """
    rate = models.ForeignKey(ExchangeRate, on_delete=models.CASCADE, related_name='history')
    old_rate = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    new_rate = models.DecimalField(max_digits=18, decimal_places=8)

    # Who made the change
    changed_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    # Change details
    change_reason = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-changed_at']
        verbose_name = 'Exchange Rate History'
        verbose_name_plural = 'Exchange Rate History'

    def __str__(self):
        return f"Rate change: {self.rate} - {self.old_rate} → {self.new_rate}"


class ExchangeRateAlert(models.Model):
    """
    Alerts for exchange rate changes or thresholds
    """
    ALERT_TYPES = [
        ('threshold', 'Rate Threshold Alert'),
        ('change', 'Rate Change Alert'),
        ('stale', 'Stale Rate Alert'),
    ]

    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    from_currency = models.CharField(max_length=3)
    to_currency = models.CharField(max_length=3)

    # Alert conditions
    threshold_rate = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    change_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Percentage change that triggers alert")

    # Alert recipients
    notify_users = models.ManyToManyField('auth.User', blank=True, help_text="Users to notify")
    notify_emails = models.JSONField(default=list, blank=True, help_text="Additional email addresses to notify")

    # Alert status
    is_active = models.BooleanField(default=True)
    last_triggered = models.DateTimeField(null=True, blank=True)

    # Metadata
    created_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Exchange Rate Alert'
        verbose_name_plural = 'Exchange Rate Alerts'

    def __str__(self):
        return f"{self.alert_type}: {self.from_currency}/{self.to_currency}"


# Signal to track rate changes
@receiver(post_save, sender=ExchangeRate)
def track_rate_changes(sender, instance, created, **kwargs):
    """Track changes to exchange rates for audit purposes"""
    if not created:
        # Get the previous version from history or database
        try:
            old_instance = ExchangeRate.objects.get(pk=instance.pk)
            if old_instance.rate != instance.rate:
                ExchangeRateHistory.objects.create(
                    rate=instance,
                    old_rate=old_instance.rate,
                    new_rate=instance.rate,
                    changed_by=instance.updated_by,
                    change_reason="Rate updated via admin"
                )
        except ExchangeRate.DoesNotExist:
            pass


class MultiCurrencyPayment(models.Model):
    """Track multi-currency payment transactions"""
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='multi_currency')
    original_amount = models.DecimalField(max_digits=12, decimal_places=2)
    original_currency = models.CharField(max_length=3)
    converted_amount = models.DecimalField(max_digits=12, decimal_places=2)
    converted_currency = models.CharField(max_length=3)
    exchange_rate = models.DecimalField(max_digits=18, decimal_places=8)
    conversion_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rate_source = models.CharField(max_length=50, default='api')
    converted_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.original_amount} {self.original_currency} → {self.converted_amount} {self.converted_currency}"
    
    class Meta:
        verbose_name = 'Multi-Currency Payment'
        verbose_name_plural = 'Multi-Currency Payments'


class FraudAlert(models.Model):
    """Fraud detection alerts"""
    PENDING = 'pending_review'
    APPROVED = 'approved'
    BLOCKED = 'blocked'
    FALSE_POSITIVE = 'false_positive'
    
    STATUS_CHOICES = [
        (PENDING, 'Pending Review'),
        (APPROVED, 'Approved'),
        (BLOCKED, 'Blocked'),
        (FALSE_POSITIVE, 'False Positive'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='fraud_alerts')
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, null=True, blank=True, related_name='fraud_alerts')
    transaction_id = models.CharField(max_length=100, db_index=True)
    risk_score = models.DecimalField(max_digits=5, decimal_places=3)
    risk_level = models.CharField(max_length=20)
    triggered_rules = models.JSONField(default=list)
    transaction_data = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    reviewed_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['risk_level']),
        ]
    
    def __str__(self):
        return f"Fraud Alert: {self.transaction_id} - {self.risk_level}"


class FraudBlacklist(models.Model):
    """Blacklist for fraudulent entities"""
    ENTITY_TYPES = [
        ('email', 'Email Address'),
        ('ip', 'IP Address'),
        ('bin', 'Card BIN'),
        ('device', 'Device Fingerprint'),
        ('phone', 'Phone Number'),
    ]
    
    entity_type = models.CharField(max_length=20, choices=ENTITY_TYPES)
    entity_value = models.CharField(max_length=255, db_index=True)
    reason = models.TextField()
    added_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['entity_type', 'entity_value']
        indexes = [
            models.Index(fields=['entity_type', 'entity_value']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.entity_type}: {self.entity_value}"


class BlacklistedBIN(models.Model):
    """Blacklisted card BINs"""
    bin = models.CharField(max_length=8, unique=True, db_index=True)
    reason = models.CharField(max_length=255)
    source = models.CharField(max_length=50, default='manual')
    added_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"BIN: {self.bin}"


class FraudReport(models.Model):
    """User-reported fraud"""
    transaction_id = models.CharField(max_length=100, db_index=True)
    reason = models.TextField()
    reported_by = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    reported_at = models.DateTimeField(auto_now_add=True)
    investigated = models.BooleanField(default=False)
    investigation_notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-reported_at']
    
    def __str__(self):
        return f"Fraud Report: {self.transaction_id}"
