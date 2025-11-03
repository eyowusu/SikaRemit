from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.core.validators import MaxValueValidator
import uuid

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        (1, 'admin'),
        (2, 'merchant'),
        (3, 'customer'),
    )
    
    user_type = models.PositiveSmallIntegerField(choices=USER_TYPE_CHOICES, default=3)
    phone = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False)
    verification_token = models.UUIDField(default=uuid.uuid4, editable=False)
    biometric_data = models.JSONField(default=dict)  # {face_match: {}, liveness: {}}
    verification_level = models.PositiveSmallIntegerField(
        default=0,
        validators=[MaxValueValidator(3)]  # 0=unverified, 3=fully verified
    )
    last_biometric_verify = models.DateTimeField(null=True)
    auth_provider = models.CharField(max_length=20, default='email')
    social_id = models.CharField(max_length=255, blank=True)
    mfa_secret = models.CharField(max_length=100, blank=True)
    mfa_enabled = models.BooleanField(default=False)
    mfa_backup_codes = models.JSONField(default=list)
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def __str__(self):
        return self.email

class KYCDocument(models.Model):
    DOCUMENT_TYPES = [
        ('PASSPORT', 'Passport'),
        ('ID_CARD', 'National ID'),
        ('DRIVERS_LICENSE', 'Driver\'s License'),
        ('UTILITY_BILL', 'Utility Bill'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='kyc_documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    front_image = models.ImageField(upload_to='kyc/')
    back_image = models.ImageField(upload_to='kyc/', blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    reviewed_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name='reviewed_kycs')
    reviewed_at = models.DateTimeField(null=True)
    rejection_reason = models.TextField(blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    is_expired = models.BooleanField(default=False)
    last_checked = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    risk_score = models.FloatField(default=0.0)
    scan_data = models.JSONField(default=dict)
    
    def __str__(self):
        return f"{self.get_document_type_display()} - {self.user.email}"

class Merchant(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='merchant_profile')
    business_name = models.CharField(max_length=255)
    tax_id = models.CharField(max_length=50)
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name='approved_merchants')
    approved_at = models.DateTimeField(null=True)
    
    def __str__(self):
        return self.business_name

class Customer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    date_of_birth = models.DateField(null=True, blank=True)
    kyc_verified = models.BooleanField(default=False)
    kyc_verified_at = models.DateTimeField(null=True)
    address = models.JSONField(default=dict)  # {street, city, country, postal_code}
    
    def __str__(self):
        return self.user.email
