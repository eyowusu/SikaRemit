from django.db import models
from users.models import User

class Merchant(models.Model):
    user = models.OneToOneField(User, on_delete=models.PROTECT, related_name='payments_merchant')
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
