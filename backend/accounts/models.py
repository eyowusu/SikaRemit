from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth import get_user_model
from django.conf import settings
from django.db.models import JSONField

User = get_user_model()

class AccountUser(AbstractUser):
    ROLES = (
        ('user', 'Regular User'),
        ('merchant', 'Merchant'),
        ('admin', 'Admin'),
    )
    
    role = models.CharField(max_length=20, choices=ROLES, default='user')
    is_verified = models.BooleanField(default=False)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    
    # Override the groups and user_permissions fields to avoid clashes
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name='accounts_user_set',
        related_query_name='accounts_user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='accounts_user_set',
        related_query_name='accounts_user',
    )
    
    @property
    def is_admin(self):
        return self.role == 'admin' or self.is_superuser
    
    def save(self, *args, **kwargs):
        # Ensure superusers have admin role
        if self.is_superuser and self.role != 'admin':
            self.role = 'admin'
        super().save(*args, **kwargs)

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=32, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Reset token for {self.user.email}"

class AdminActivity(models.Model):
    ACTION_TYPES = [
        ('USER_MOD', 'User Modification'),
        ('PAYMENT_OVERRIDE', 'Payment Override'),
        ('SETTINGS_CHANGE', 'System Settings Change'),
        ('ACCESS_CONTROL', 'Access Control Change'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('PROFILE_UPDATE', 'Profile Update'),
        ('PASSWORD_CHANGE', 'Password Change'),
        ('TRANSACTION', 'Transaction'),
        ('VERIFICATION', 'Verification Submitted'),
    ]
    
    admin = models.ForeignKey(User, on_delete=models.PROTECT)
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True)
    user_agent = models.TextField(null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['admin', 'timestamp']),
            models.Index(fields=['action_type', 'timestamp'])
        ]
        
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

class AuthLog(models.Model):
    """Tracks all authentication attempts"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    ip_address = models.GenericIPAddressField()
    device_id = models.CharField(max_length=32)  # Device fingerprint
    success = models.BooleanField(default=False)
    reason = models.CharField(max_length=255, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['device_id']),
            models.Index(fields=['ip_address']),
            models.Index(fields=['user']),
        ]
        ordering = ['-timestamp']

class BackupVerification(models.Model):
    VERIFICATION_TYPES = [
        ('DB', 'Database'),
        ('MEDIA', 'Media Files'),
        ('LOGS', 'Log Files'),
        ('FULL', 'Full Backup')
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('RUNNING', 'Running'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed')
    ]
    
    verification_type = models.CharField(max_length=10, choices=VERIFICATION_TYPES)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    checksum = models.CharField(max_length=64, null=True, blank=True)
    file_size = models.BigIntegerField(null=True, blank=True)
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    notes = models.TextField(null=True, blank=True)
    
    class Meta:
        ordering = ['-started_at']
        
    def __str__(self):
        return f"{self.get_verification_type_display()} - {self.status}"

class Customer(models.Model):
    """
    Extended user model for customers with loyalty tracking
    Fields:
    - loyalty_points: Accumulated rewards points
    - loyalty_tier: Current rewards tier (basic/silver/gold/platinum)
    - payment_history: JSON store of recent payments for fraud detection
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='accounts_customer_profile')
    loyalty_points = models.PositiveIntegerField(default=0)
    loyalty_tier = models.CharField(
        max_length=20, 
        default='basic',
        choices=[
            ('basic', 'Basic'),
            ('silver', 'Silver'), 
            ('gold', 'Gold'),
            ('platinum', 'Platinum')
        ]
    )
    payment_history = models.JSONField(
        default=list,
        help_text='Last 10 payments for fraud analysis'
    )
    
    def update_tier(self):
        """Automatically upgrade/downgrade tier based on points"""
        tiers = {
            100: 'silver',
            500: 'gold',
            1000: 'platinum'
        }
        new_tier = 'basic'
        for threshold, tier in tiers.items():
            if self.loyalty_points >= threshold:
                new_tier = tier
        self.loyalty_tier = new_tier
        self.save()

class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('SEND', 'Send'),
        ('REQUEST', 'Request'),
        ('TRANSFER', 'Transfer')
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed')
    ]
    
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_transactions'
    )
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='received_transactions'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict)
    
    class Meta:
        indexes = [
            models.Index(fields=['sender']),
            models.Index(fields=['recipient']),
            models.Index(fields=['created_at']),
            models.Index(fields=['status']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.amount} from {self.sender.email} to {self.recipient.email}"

class PaymentLog(models.Model):
    PAYMENT_TYPES = [
        ('subscription', 'Subscription'),
        ('remittance', 'Remittance'),
        ('bill', 'Bill Payment'),
        ('other', 'Other')
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts_paymentlog_set')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES, default='other')
    plan = models.CharField(max_length=20, blank=True, null=True)
    stripe_charge_id = models.CharField(max_length=100, blank=True, null=True)
    stripe_payment_intent_id = models.CharField(max_length=100, blank=True, null=True)
    paypal_order_id = models.CharField(max_length=100, blank=True, null=True)
    qr_data = models.TextField(blank=True, null=True)
    
    # Remittance specific fields
    recipient_name = models.CharField(max_length=255, blank=True, null=True)
    recipient_account = models.CharField(max_length=255, blank=True, null=True)
    recipient_bank = models.CharField(max_length=255, blank=True, null=True)
    
    # Bill payment specific fields
    biller_name = models.CharField(max_length=255, blank=True, null=True)
    bill_reference = models.CharField(max_length=255, blank=True, null=True)
    bill_due_date = models.DateField(blank=True, null=True)
    
    # Mobile Money specific fields
    mobile_money_provider = models.CharField(max_length=50, blank=True, null=True)
    mobile_money_number = models.CharField(max_length=20, blank=True, null=True)
    provider_reference = models.CharField(max_length=100, blank=True, null=True)
    
    error = models.TextField(null=True, blank=True)
    metadata = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']

class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    store = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='products',
        limit_choices_to={'user_type': 2}
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.name} - {self.price}"

class Merchant(models.Model):
    """
    Merchant account model for business users
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='accounts_merchant')
    business_name = models.CharField(max_length=255)
    business_registration = models.CharField(max_length=100, blank=True)
    tax_id = models.CharField(max_length=100, blank=True)
    approved = models.BooleanField(default=False)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.business_name} ({self.user.email})"

class Session(models.Model):
    """Tracks user sessions for security and analytics"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sessions',
        null=True,
        blank=True
    )
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    device_id = models.CharField(max_length=32)  # Device fingerprint
    created_at = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['ip_address']),
            models.Index(fields=['device_id']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Session for {self.user.email if self.user else 'Anonymous'} from {self.ip_address}"

class UserActivity(models.Model):
    EVENT_TYPES = [
        ('LOGIN', 'User Login'),
        ('LOGOUT', 'User Logout'),
        ('PROFILE_UPDATE', 'Profile Update'),
        ('PASSWORD_CHANGE', 'Password Change'),
        ('TRANSACTION', 'Transaction'),
        ('VERIFICATION', 'Verification Submitted'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='activities'
    )
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = 'User Activities'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['event_type']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.get_event_type_display()} at {self.created_at}"

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('VERIFICATION', 'New Verification'),
        ('USER_SIGNUP', 'New User'),
        ('TRANSACTION', 'Large Transaction'),
        ('SYSTEM', 'System Alert'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=100)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.get_notification_type_display()} - {self.title}"
    
    def mark_as_read(self):
        self.is_read = True
        self.save()

class Payout(models.Model):
    merchant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payouts')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed')
    ], default='pending')
    method = models.CharField(max_length=50, choices=[
        ('bank', 'Bank Transfer'),
        ('mobile_money', 'Mobile Money')
    ])
    reference = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['merchant', 'status']),
            models.Index(fields=['created_at']),
        ]
