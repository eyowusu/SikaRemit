from django.db import models
from django.conf import settings
from users.models import Merchant
import uuid

class Store(models.Model):
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    sku = models.CharField(max_length=50, unique=True, blank=True, null=True)
    barcode = models.CharField(max_length=100, blank=True, null=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        """Auto-generate SKU if not provided"""
        if not self.sku:
            self.sku = f"{self.store.id}-{self.name[:3].upper()}-{self.id}"
        super().save(*args, **kwargs)
    
    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.low_stock_threshold

class MerchantApplication(models.Model):
    """Merchant applications submitted by uninvited merchants"""
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    BUSINESS_TYPES = [
        ('sole-proprietorship', 'Sole Proprietorship'),
        ('partnership', 'Partnership'),
        ('corporation', 'Corporation'),
        ('llc', 'LLC'),
        ('non-profit', 'Non-Profit'),
        ('other', 'Other'),
    ]

    INDUSTRIES = [
        ('retail', 'Retail/E-commerce'),
        ('restaurant', 'Restaurant/Food Service'),
        ('healthcare', 'Healthcare'),
        ('education', 'Education'),
        ('professional', 'Professional Services'),
        ('technology', 'Technology'),
        ('manufacturing', 'Manufacturing'),
        ('other', 'Other'),
    ]

    EMPLOYEE_RANGES = [
        ('1-5', '1-5 employees'),
        ('6-20', '6-20 employees'),
        ('21-50', '21-50 employees'),
        ('51-100', '51-100 employees'),
        ('100+', '100+ employees'),
    ]

    REVENUE_RANGES = [
        ('under-10k', 'Under $10,000'),
        ('10k-50k', '$10,000 - $50,000'),
        ('50k-100k', '$50,000 - $100,000'),
        ('100k-500k', '$100,000 - $500,000'),
        ('over-500k', 'Over $500,000'),
    ]

    # Business Information
    business_name = models.CharField(max_length=255)
    business_type = models.CharField(max_length=50, choices=BUSINESS_TYPES)
    business_description = models.TextField()
    business_address = models.TextField()
    business_phone = models.CharField(max_length=20)
    business_email = models.EmailField()

    # Optional Business Fields
    website = models.URLField(blank=True)
    tax_id = models.CharField(max_length=50, blank=True)
    registration_number = models.CharField(max_length=50, blank=True)

    # Contact Person
    contact_first_name = models.CharField(max_length=100)
    contact_last_name = models.CharField(max_length=100)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20)
    contact_position = models.CharField(max_length=100, blank=True)

    # Business Details
    industry = models.CharField(max_length=50, choices=INDUSTRIES)
    employee_count = models.CharField(max_length=20, choices=EMPLOYEE_RANGES, blank=True)
    monthly_revenue = models.CharField(max_length=20, choices=REVENUE_RANGES, blank=True)

    # Payment Methods (JSON array of selected methods)
    payment_methods = models.JSONField(default=list)

    # Additional Information
    hear_about_us = models.CharField(max_length=50, blank=True)
    special_requirements = models.TextField(blank=True)

    # Status and Review
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    review_notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.business_name} - {self.get_status_display()}"

class MerchantInvitation(models.Model):
    """Invitations sent to potential merchants"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]

    BUSINESS_TYPES = [
        ('restaurant', 'Restaurant/Food Service'),
        ('retail', 'Retail/Shop'),
        ('services', 'Professional Services'),
        ('ecommerce', 'E-commerce'),
        ('healthcare', 'Healthcare'),
        ('education', 'Education'),
        ('other', 'Other'),
    ]

    # Invitation Details
    email = models.EmailField()
    business_name = models.CharField(max_length=255)
    business_type = models.CharField(max_length=50, choices=BUSINESS_TYPES, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)

    # Invitation Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    invitation_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    invited_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    # Acceptance Details
    accepted_at = models.DateTimeField(null=True, blank=True)
    merchant_profile = models.OneToOneField(Merchant, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-invited_at']

    def __str__(self):
        return f"Invitation to {self.business_name} ({self.email})"

    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at and self.status == 'pending'

class MerchantOnboarding(models.Model):
    """Tracks merchant onboarding progress"""
    PENDING = 'pending'
    BUSINESS_INFO = 'business_info'
    BANK_DETAILS = 'bank_details'
    VERIFICATION = 'verification'
    COMPLETED = 'completed'
    
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (BUSINESS_INFO, 'Business Info'),
        (BANK_DETAILS, 'Bank Details'),
        (VERIFICATION, 'Verification'),
        (COMPLETED, 'Completed')
    ]
    
    merchant = models.OneToOneField('users.Merchant', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    current_step = models.PositiveSmallIntegerField(default=1)
    total_steps = models.PositiveSmallIntegerField(default=4)
    is_verified = models.BooleanField(default=False)
    data = models.JSONField(default=dict)  # Stores temporary onboarding data
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Onboarding for {self.merchant.business_name}"
    
    def save(self, *args, **kwargs):
        """Update verification status when reaching final step"""
        if self.status == self.COMPLETED:
            self.is_verified = True
        super().save(*args, **kwargs)

class MerchantVerificationDocument(models.Model):
    """Documents submitted for merchant verification"""
    DOCUMENT_TYPES = [
        ('business_registration', 'Business Registration'),
        ('tax_id', 'Tax ID Document'),
        ('bank_statement', 'Bank Statement'),
        ('identity_proof', 'Identity Proof'),
        ('address_proof', 'Address Proof'),
        ('financial_statement', 'Financial Statement'),
    ]
    
    STATUS_CHOICES = [
        ('pending_review', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]
    
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='verification_documents')
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    document_data = models.JSONField()
    submitted_at = models.DateTimeField()
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    rejection_reason = models.TextField(blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-submitted_at']
    
    def __str__(self):
        return f"{self.merchant.business_name} - {self.get_document_type_display()} - {self.get_status_display()}"
    
    def save(self, *args, **kwargs):
        """Update verification status when reaching final step"""
        if self.status == 'completed':
            self.is_verified = True
        super().save(*args, **kwargs)

class ReportTemplate(models.Model):
    """Pre-defined report templates for merchants"""
    REPORT_TYPES = [
        ('sales_summary', 'Sales Summary'),
        ('transaction_detail', 'Transaction Detail'),
        ('customer_analysis', 'Customer Analysis'),
        ('product_performance', 'Product Performance'),
        ('financial_overview', 'Financial Overview'),
        ('payout_history', 'Payout History'),
    ]

    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Report(models.Model):
    """Generated reports for merchants"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('generating', 'Generating'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('csv', 'CSV'),
        ('excel', 'Excel'),
        ('json', 'JSON'),
    ]

    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE)
    template = models.ForeignKey(ReportTemplate, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default='pdf')

    # Date range
    start_date = models.DateField()
    end_date = models.DateField()

    # Filters and parameters
    filters = models.JSONField(default=dict)  # Store filter parameters

    # File storage
    file_url = models.URLField(blank=True, null=True)
    file_size = models.PositiveIntegerField(blank=True, null=True)

    # Metadata
    record_count = models.PositiveIntegerField(default=0)
    processing_time = models.DurationField(blank=True, null=True)
    error_message = models.TextField(blank=True)

    # Scheduling
    is_scheduled = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.merchant.business_name} - {self.name}"

    @property
    def duration_days(self):
        """Calculate report duration in days"""
        return (self.end_date - self.start_date).days + 1

class MerchantSettings(models.Model):
    """Merchant business and operational settings"""
    merchant = models.OneToOneField('users.Merchant', on_delete=models.CASCADE)
    
    # Business Information
    business_name = models.CharField(max_length=255, blank=True)
    tax_id = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    # Address Information
    address_street = models.CharField(max_length=255, blank=True)
    address_city = models.CharField(max_length=100, blank=True)
    address_country = models.CharField(max_length=100, blank=True)
    address_postal_code = models.CharField(max_length=20, blank=True)
    
    # Operational Settings
    default_currency = models.CharField(max_length=3, default='USD')
    timezone = models.CharField(max_length=50, default='UTC')
    language = models.CharField(max_length=10, default='en')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Settings for {self.merchant.business_name}"
    
    class Meta:
        verbose_name = "Merchant Settings"
        verbose_name_plural = "Merchant Settings"

class MerchantNotificationSettings(models.Model):
    """Merchant notification preferences"""
    merchant = models.OneToOneField('users.Merchant', on_delete=models.CASCADE)
    
    # Email notifications
    email_enabled = models.BooleanField(default=True)
    
    # SMS notifications
    sms_enabled = models.BooleanField(default=False)
    sms_number = models.CharField(max_length=20, blank=True)
    
    # Push notifications
    push_enabled = models.BooleanField(default=True)
    
    # Alert types
    transaction_alerts = models.BooleanField(default=True)
    payout_alerts = models.BooleanField(default=True)
    security_alerts = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Notification settings for {self.merchant.business_name}"
    
    class Meta:
        verbose_name = "Merchant Notification Settings"
        verbose_name_plural = "Merchant Notification Settings"

class MerchantPayoutSettings(models.Model):
    """Merchant payout configuration"""
    PAYOUT_METHOD_CHOICES = [
        ('bank_transfer', 'Bank Transfer'),
        ('mobile_money', 'Mobile Money'),
    ]
    
    merchant = models.OneToOneField('users.Merchant', on_delete=models.CASCADE)
    
    # Payout method
    default_method = models.CharField(
        max_length=20, 
        choices=PAYOUT_METHOD_CHOICES, 
        default='bank_transfer'
    )
    
    # Payout automation
    auto_payout = models.BooleanField(default=False)
    minimum_payout = models.DecimalField(max_digits=10, decimal_places=2, default=100.00)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Payout settings for {self.merchant.business_name}"
    
    class Meta:
        verbose_name = "Merchant Payout Settings"
        verbose_name_plural = "Merchant Payout Settings"

class ScheduledReport(models.Model):
    """Scheduled reports for automated generation"""
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('expired', 'Expired'),
    ]

    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE)
    template = models.ForeignKey(ReportTemplate, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # Scheduling
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    next_run = models.DateTimeField()
    last_run = models.DateTimeField(blank=True, null=True)

    # Configuration
    format = models.CharField(max_length=10, choices=Report.FORMAT_CHOICES, default='pdf')
    filters = models.JSONField(default=dict)
    email_recipients = models.JSONField(default=list)  # List of email addresses

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_active = models.BooleanField(default=True)

    # Metadata
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['next_run']

    def __str__(self):
        return f"{self.merchant.business_name} - {self.name} ({self.frequency})"

# NOTE: MerchantCustomer model has been moved to users app (users.MerchantCustomer)
# This class is DEPRECATED - use users.MerchantCustomer instead
# Keeping for backwards compatibility with existing migrations
class MerchantCustomerLegacy(models.Model):
    """
    DEPRECATED: Use users.MerchantCustomer instead.
    This model is kept for migration compatibility only.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('inactive', 'Inactive'),
    ]

    KYC_STATUS_CHOICES = [
        ('not_required', 'Not Required'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='merchants_merchant_customers')
    customer_email = models.EmailField()
    customer_name = models.CharField(max_length=255, blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    kyc_status = models.CharField(max_length=20, choices=KYC_STATUS_CHOICES, default='not_required')
    kyc_required = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    onboarded_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['merchant', 'customer_email']
        ordering = ['-onboarded_at']
        db_table = 'merchants_merchantcustomer'  # Keep original table name

    def __str__(self):
        return f"{self.customer_email} - {self.merchant.business_name}"


class _ScheduledReportMixin:
    """Mixin for calculate_next_run - moved from MerchantCustomer"""
    def calculate_next_run(self):
        """Calculate the next run date based on frequency"""
        from datetime import timedelta
        from django.utils import timezone

        now = timezone.now()

        if self.frequency == 'daily':
            self.next_run = now + timedelta(days=1)
        elif self.frequency == 'weekly':
            # Next Monday
            days_ahead = (7 - now.weekday()) % 7
            if days_ahead == 0:
                days_ahead = 7
            self.next_run = now + timedelta(days=days_ahead)
        elif self.frequency == 'monthly':
            # First day of next month
            if now.month == 12:
                self.next_run = now.replace(year=now.year + 1, month=1, day=1, hour=9, minute=0, second=0)
            else:
                self.next_run = now.replace(month=now.month + 1, day=1, hour=9, minute=0, second=0)
        elif self.frequency == 'quarterly':
            # First day of next quarter
            current_quarter = ((now.month - 1) // 3) + 1
            if current_quarter == 4:
                next_quarter_month = 1
                next_year = now.year + 1
            else:
                next_quarter_month = (current_quarter * 3) + 1
                next_year = now.year
            self.next_run = now.replace(year=next_year, month=next_quarter_month, day=1, hour=9, minute=0, second=0)
