from django.db import models
from users.models import Merchant

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
        return f"{self.merchant.business_name} - {self.get_status_display()}"
    
    def save(self, *args, **kwargs):
        """Update verification status when reaching final step"""
        if self.status == self.COMPLETED:
            self.is_verified = True
        super().save(*args, **kwargs)
