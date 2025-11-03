from django.db import transaction
from .base import BasePaymentService
from ..models import Transaction, Merchant, Payment
from ..services import PaymentProcessor
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class BillingService(BasePaymentService):
    """
    Handles bill payments including:
    - Utility bills
    - Invoice payments
    - Scheduled payments
    """
    
    def __init__(self):
        self.payment_processor = PaymentProcessor()
    
    @transaction.atomic
    def process_bill_payment(self, customer, biller, amount, currency, payment_method, bill_reference=None, bill_due_date=None, bill_type=None):
        """
        Process a bill payment with bill-specific fields
        """
        if not biller.is_biller:
            raise ValueError("Merchant must be registered as a biller")
            
        payment = Payment.objects.create(
            customer=customer,
            merchant=biller,
            amount=amount,
            currency=currency,
            payment_method=payment_method,
            payment_type=Payment.BILL,
            bill_reference=bill_reference,
            bill_due_date=bill_due_date,
            bill_type=bill_type
        )
        
        try:
            result = self.payment_processor.process(payment)
            payment.status = Payment.COMPLETED if result.success else Payment.FAILED
            payment.save()
            return payment
        except Exception as e:
            payment.status = Payment.FAILED
            payment.save()
            raise
    
    def generate_invoice(self, biller, customer, items, due_date):
        """Generate an invoice for payment"""
        # Implementation would vary based on requirements
        pass
