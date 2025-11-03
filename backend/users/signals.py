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
def trigger_compliance_check(sender, instance, created, **kwargs):
    if instance.verification_level >= 3:  # Fully verified
        ComplianceReporter.submit_to_regulator(instance.id)
