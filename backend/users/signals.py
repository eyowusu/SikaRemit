from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, Merchant, Customer
from compliance.reporter import ComplianceReporter

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        if instance.user_type == 2:  # merchant
            Merchant.objects.create(user=instance)
        elif instance.user_type == 3:  # customer
            Customer.objects.create(user=instance)

@receiver(post_save, sender=User)
def sync_admin_user_type(sender, instance, **kwargs):
    """Ensure user_type is set to admin (1) when is_staff or is_superuser is True"""
    if (instance.is_staff or instance.is_superuser) and instance.user_type != 1:
        instance.user_type = 1
        # Use update to avoid triggering signals again
        User.objects.filter(pk=instance.pk).update(user_type=1)

@receiver(post_save, sender=Merchant)
def sync_merchant_user_type(sender, instance, created, **kwargs):
    """Ensure user_type is set to merchant (2) when Merchant profile is created"""
    if instance.user and instance.user.user_type != 2:
        instance.user.user_type = 2
        instance.user.save(update_fields=['user_type'])

@receiver(post_save, sender=Customer)
def sync_customer_user_type(sender, instance, created, **kwargs):
    """Ensure user_type is set to customer (3) when Customer profile is created"""
    if instance.user and instance.user.user_type != 3:
        instance.user.user_type = 3
        instance.user.save(update_fields=['user_type'])

@receiver(post_save, sender=User)
def trigger_compliance_check(sender, instance, created, **kwargs):
    if instance.verification_level >= 3:  # Fully verified
        ComplianceReporter.submit_to_regulator(instance.id)
