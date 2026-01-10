#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.append(os.path.dirname(__file__))
django.setup()

from payments.models import Payment, PaymentMethod
from users.models import Customer

def create_test_payment():
    try:
        customer = Customer.objects.filter(user__email='customer@example.com').first()
        if not customer:
            print('Customer not found')
            return
        
        # Get or create payment method for the user
        method, _ = PaymentMethod.objects.get_or_create(
            user=customer.user,
            method_type='bank',  # Use 'bank' from choices
            defaults={'details': {}, 'is_default': True}
        )
        
        # Temporarily disconnect signals to avoid accounting integration
        from django.db.models.signals import post_save
        from payments.signals import auto_sync_to_accounting
        post_save.disconnect(auto_sync_to_accounting, sender=Payment)
        
        payment = Payment.objects.create(
            customer=customer,
            merchant=None,
            amount=50.00,
            currency='USD',
            status='completed',
            payment_method=method,
            payment_type='bill',
            bill_issuer='Test Utility Company',
            bill_reference='REF123456',
            due_date='2025-12-01'
        )
        
        # Reconnect signal
        post_save.connect(auto_sync_to_accounting, sender=Payment)
        
        print(f'Test bill payment created successfully!')
        print(f'ID: {payment.id}')
        print(f'Amount: ${payment.amount}')
        print(f'Status: {payment.status}')
        print(f'Bill Issuer: {payment.bill_issuer}')
        print(f'Reference: {payment.bill_reference}')
        
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    create_test_payment()
