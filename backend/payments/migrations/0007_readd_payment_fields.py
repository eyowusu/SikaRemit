from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('payments', '0006_remove_payment_bill_due_date_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='payment',
            name='payment_type',
            field=models.CharField(
                max_length=10,
                choices=[
                    ('regular', 'Regular'),
                    ('bill', 'Bill Payment'),
                    ('remittance', 'Remittance')
                ],
                default='regular'
            ),
        ),
        migrations.AddField(
            model_name='payment',
            name='bill_reference',
            field=models.CharField(max_length=100, blank=True),
        ),
        migrations.AddField(
            model_name='payment',
            name='bill_due_date',
            field=models.DateField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='payment',
            name='bill_type',
            field=models.CharField(max_length=50, blank=True),
        ),
        migrations.AddField(
            model_name='payment',
            name='remittance_reference',
            field=models.CharField(max_length=100, blank=True),
        ),
        migrations.AddField(
            model_name='payment',
            name='recipient_country',
            field=models.CharField(max_length=3, blank=True),
        ),
        migrations.AddField(
            model_name='payment',
            name='recipient_name',
            field=models.CharField(max_length=255, blank=True),
        ),
        migrations.AddField(
            model_name='payment',
            name='exchange_rate',
            field=models.DecimalField(decimal_places=6, max_digits=10, null=True, blank=True),
        ),
    ]
