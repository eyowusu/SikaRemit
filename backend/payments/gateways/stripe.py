from .base import PaymentGateway
import stripe
from django.conf import settings

class StripeGateway(PaymentGateway):
    """Stripe payment gateway implementation for card payments"""
    
    def __init__(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY
    
    def process_payment(self, amount, currency, payment_method, customer, merchant, metadata=None):
        try:
            # Convert amount to cents/stripe's smallest currency unit
            amount_in_cents = int(amount * 100)
            
            # Create payment intent
            intent = stripe.PaymentIntent.create(
                amount=amount_in_cents,
                currency=currency.lower(),
                payment_method=payment_method.details.get('payment_method_id'),
                customer=customer.stripe_customer_id,
                confirm=True,
                metadata=metadata or {}
            )
            
            return {
                'success': intent.status == 'succeeded',
                'transaction_id': intent.id,
                'raw_response': intent
            }
            
        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e),
                'raw_response': e.json_body if hasattr(e, 'json_body') else None
            }
    
    def refund_payment(self, transaction_id, amount=None):
        try:
            refund = stripe.Refund.create(
                payment_intent=transaction_id,
                amount=int(amount * 100) if amount else None
            )
            
            return {
                'success': refund.status == 'succeeded',
                'transaction_id': refund.id,
                'raw_response': refund
            }
            
        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e),
                'raw_response': e.json_body if hasattr(e, 'json_body') else None
            }
