from django.db import migrations

def set_payment_types(apps, schema_editor):
    """Migrate existing payments based on specific fields"""
    Payment = apps.get_model('payments', 'Payment')
    
    # Update bill payments
    Payment.objects.filter(bill_reference__isnull=False).update(payment_type='bill')
    
    # Update remittances
    Payment.objects.filter(remittance_reference__isnull=False).update(payment_type='remittance')

class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0004_payment_type_fields'),
    ]

    operations = [
        migrations.RunPython(set_payment_types, reverse_code=migrations.RunPython.noop),
    ]
