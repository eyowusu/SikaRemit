from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0003_alter_merchant_user_alter_paymentlog_user'),
    ]

    operations = [
        migrations.AddField(
            model_name='payment',
            name='payment_type',
            field=models.CharField(
                choices=[('regular', 'Regular Payment'), ('bill', 'Bill Payment'), ('remittance', 'Remittance')],
                default='regular',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='payment',
            name='bill_reference',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='payment',
            name='bill_due_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='payment',
            name='bill_type',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='payment',
            name='remittance_reference',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='payment',
            name='recipient_country',
            field=models.CharField(blank=True, max_length=3),
        ),
        migrations.AddField(
            model_name='payment',
            name='recipient_name',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='payment',
            name='exchange_rate',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=10, null=True),
        ),
    ]
