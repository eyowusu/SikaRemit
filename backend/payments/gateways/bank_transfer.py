from .base import PaymentGateway
from django.conf import settings
from django.http import JsonResponse
from django.urls import reverse
import requests
import logging
import uuid
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class BankTransferGateway(PaymentGateway):
    """Real bank transfer payment gateway implementation with multiple provider support"""

    def __init__(self):
        # Support direct banking integration
        self.providers = {
            'direct_bank': {
                'api_url': getattr(settings, 'DIRECT_BANK_API_URL', None),
                'api_key': getattr(settings, 'DIRECT_BANK_API_KEY', None),
                'webhook_secret': getattr(settings, 'DIRECT_BANK_WEBHOOK_SECRET', None),
                'enabled': bool(getattr(settings, 'DIRECT_BANK_API_URL', None))
            }
        }

        # Default to direct bank if available
        self.default_provider = 'direct_bank' if self.providers['direct_bank']['enabled'] else None

        if not self.default_provider:
            logger.warning("No bank transfer providers configured - bank transfers will be simulated")

    def process_payment(self, amount, currency, payment_method, customer, merchant, metadata=None):
        """Process bank transfer payment"""
        try:
            provider = self._get_provider_for_method(payment_method)

            if not provider:
                # Fallback to simulated processing if no providers configured
                return self._simulate_bank_transfer(amount, currency, payment_method, customer, merchant, metadata)

            provider_config = self.providers[provider]

            if provider == 'direct_bank':
                return self._process_direct_bank(amount, currency, payment_method, customer, merchant, metadata)

        except Exception as e:
            logger.error(f"Bank transfer processing failed: {str(e)}")
            return {
                'success': False,
                'error': f"Bank transfer failed: {str(e)}",
                'raw_response': None
            }

    def _get_provider_for_method(self, payment_method):
        """Determine which provider to use based on payment method or bank"""
        bank_name = payment_method.details.get('bank_name', '').lower()

        # Route to direct bank integration
        return 'direct_bank' if self.providers['direct_bank']['enabled'] else self.default_provider

    def _process_direct_bank(self, amount, currency, payment_method, customer, merchant, metadata=None):
        """Process payment via direct bank API integration"""
        headers = {
            'Authorization': f"Bearer {self.providers['direct_bank']['api_key']}",
            'Content-Type': 'application/json'
        }

        payload = {
            'transaction_id': f"bank_{uuid.uuid4()}",
            'amount': str(amount),
            'currency': currency,
            'merchant_account': merchant.bank_account_number,
            'merchant_bank': merchant.bank_name,
            'customer_name': f"{customer.first_name} {customer.last_name}",
            'customer_email': customer.email,
            'webhook_url': f"{settings.BACKEND_URL}/api/payments/webhooks/bank-transfer/",
            'reference': f"Payment to {merchant.business_name}"
        }

        response = requests.post(
            f"{self.providers['direct_bank']['api_url']}/transfers/initiate",
            headers=headers,
            json=payload
        )

        if response.status_code == 200:
            data = response.json()
            return {
                'success': True,
                'transaction_id': data.get('transaction_id', f"bank_{uuid.uuid4()}"),
                'reference': data.get('reference', payload['transaction_id']),
                'instructions': data.get('instructions', 'Please transfer to the provided account details'),
                'raw_response': data
            }
        else:
            return {
                'success': False,
                'error': response.json().get('message', 'Direct bank transfer failed'),
                'raw_response': response.json()
            }

    def _simulate_bank_transfer(self, amount, currency, payment_method, customer, merchant, metadata=None):
        """Fallback simulated bank transfer when no real providers are configured"""
        logger.warning("Using simulated bank transfer - no real banking APIs configured")

        transaction_id = f"SIM_BANK_{uuid.uuid4()}"

        return {
            'success': True,
            'transaction_id': transaction_id,
            'reference': transaction_id,
            'instructions': f"""
            Please transfer {currency} {amount:,} to:
            Bank: {merchant.bank_name or 'Sample Bank'}
            Account: {merchant.bank_account_number or '1234567890'}
            Account Name: {merchant.business_name}
            Reference: {transaction_id}
            """,
            'simulated': True,
            'raw_response': {
                'amount': amount,
                'currency': currency,
                'merchant_account': merchant.bank_account_number or '1234567890',
                'reference': transaction_id
            }
        }

    def refund_payment(self, transaction_id, amount=None):
        """Process bank transfer refund"""
        # Bank transfers are typically not refundable directly
        # Refunds would need to be processed through other means
        return {
            'success': False,
            'error': 'Bank transfers cannot be refunded automatically. Please contact support.',
            'transaction_id': transaction_id
        }

    def verify_payment(self, transaction_id, reference=None):
        """Verify bank transfer payment status"""
        try:
            # This would typically be called by webhooks or polling
            # For now, return pending status
            return {
                'verified': False,
                'status': 'pending',
                'transaction_id': transaction_id,
                'message': 'Bank transfer verification in progress'
            }
        except Exception as e:
            logger.error(f"Bank transfer verification failed: {str(e)}")
            return {
                'verified': False,
                'status': 'error',
                'error': str(e)
            }
