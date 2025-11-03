from django.db import models
from users.models import Customer, Merchant
from .merchant import Merchant as PaymentMerchant
from .payment_method import PaymentMethod
from django.utils import timezone

class Subscription(models.Model):
    ACTIVE = 'active'
    SUSPENDED = 'suspended'
    CANCELLED = 'cancelled'
    
    STATUS_CHOICES = [
        (ACTIVE, 'Active'),
        (SUSPENDED, 'Suspended'),
        (CANCELLED, 'Cancelled'),
    ]
    
    BASIC = 'basic'
    STANDARD = 'standard'
    PREMIUM = 'premium'
    
    TIER_CHOICES = [
        (BASIC, 'Basic'),
        (STANDARD, 'Standard'),
        (PREMIUM, 'Premium')
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    provider = models.ForeignKey(PaymentMerchant, on_delete=models.CASCADE)
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.CASCADE)
    plan = models.JSONField()  # Stores plan details like amount, frequency, etc.
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=ACTIVE)
    start_date = models.DateField()
    last_payment_date = models.DateField(null=True, blank=True)
    next_payment_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='merchant_subscription')
    tier = models.CharField(max_length=10, choices=TIER_CHOICES, default=BASIC)
    is_active = models.BooleanField(default=True)
    subscription_start_date = models.DateTimeField(default=timezone.now)
    subscription_end_date = models.DateTimeField()
    auto_renew = models.BooleanField(default=True)
    
    # Tier limits
    max_stores = models.PositiveIntegerField(default=1)
    max_products = models.PositiveIntegerField(default=50)
    analytics_access = models.BooleanField(default=False)
    priority_support = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.customer.user.email} - {self.provider.business_name} - {self.get_tier_display()}"
    
    @property
    def is_expired(self):
        return timezone.now() > self.subscription_end_date
    
    def save(self, *args, **kwargs):
        """Set tier-based features"""
        if self.tier == self.STANDARD:
            self.max_stores = 3
            self.max_products = 200
            self.analytics_access = True
        elif self.tier == self.PREMIUM:
            self.max_stores = 10
            self.max_products = 1000
            self.analytics_access = True
            self.priority_support = True
        super().save(*args, **kwargs)
