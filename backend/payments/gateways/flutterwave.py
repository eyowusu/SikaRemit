from .base import PaymentGateway
import requests
from django.conf import settings
import logging
from django.http import JsonResponse
import hashlib
import hmac
import time

logger = logging.getLogger(__name__)

class FlutterwaveGateway(PaymentGateway):
    """Flutterwave payment gateway implementation for African markets"""

    signature_header = 'verif-hash'

    def __init__(self):
        if not settings.FLUTTERWAVE_SECRET_KEY:
            raise ValueError("Flutterwave secret key not configured")
        if not settings.FLUTTERWAVE_PUBLIC_KEY:
            raise ValueError("Flutterwave public key not configured")

        self.base_url = "https://api.flutterwave.com/v3"
        self.secret_key = settings.FLUTTERWAVE_SECRET_KEY
        self.public_key = settings.FLUTTERWAVE_PUBLIC_KEY

        # Test connection
        try:
            response = requests.get(
                f"{self.base_url}/balances",
                headers={"Authorization": f"Bearer {self.secret_key}"}
            )
            if response.status_code != 200:
                logger.error("Flutterwave API connection failed")
                raise ValueError("Invalid Flutterwave API credentials")
        except Exception as e:
            logger.error(f"Flutterwave gateway initialization failed: {str(e)}")
            raise

    def get_webhook_secret(self):
        return settings.FLUTTERWAVE_WEBHOOK_SECRET

    def parse_webhook(self, request):
        """Parse Flutterwave webhook event"""
        return request.json()

    def process_webhook(self, event):
        event_type = event.get('event')

        if event_type == 'charge.completed':
            return self._handle_payment_success(event)
        elif event_type == 'transfer.completed':
            return self._handle_transfer_success(event)
        else:
            return JsonResponse({'status': 'ignored'})

    def process_payment(self, amount, currency, payment_method, customer, merchant, metadata=None):
        """
        Process payment using Flutterwave
        Supports card payments, mobile money, bank transfers
        """
        try:
            # Convert amount to smallest currency unit (kobo, pesewas, etc.)
            amount_in_minor = int(amount * 100)

            # Prepare payment data based on payment method type
            payment_data = {
                "tx_ref": f"SikaRemit-{metadata.get('transaction_id', 'unknown')}-{int(time.time())}",
                "amount": str(amount_in_minor),
                "currency": currency,
                "redirect_url": f"{settings.FRONTEND_URL}/payment/callback",
                "customer": {
                    "email": customer.email,
                    "phonenumber": getattr(customer, 'phone', ''),
                    "name": f"{customer.first_name} {customer.last_name}"
                },
                "customizations": {
                    "title": "SikaRemit Payment",
                    "description": "Secure payment processing"
                }
            }

            # Add payment method specific data
            if payment_method.method_type == 'card':
                payment_data.update({
                    "payment_options": "card",
                    "meta": {
                        "consumer_id": customer.id,
                        "merchant_id": merchant.id if merchant else None
                    }
                })
            elif payment_method.method_type in ['mtn_momo', 'telecel', 'airtel_tigo']:
                # Mobile money payment
                payment_data.update({
                    "payment_options": "mobilemoneyghana",  # or appropriate option
                    "meta": {
                        "consumer_id": customer.id,
                        "phone_number": payment_method.details.get('phone_number')
                    }
                })

            response = requests.post(
                f"{self.base_url}/payments",
                headers={
                    "Authorization": f"Bearer {self.secret_key}",
                    "Content-Type": "application/json"
                },
                json=payment_data
            )

            if response.status_code == 200:
                response_data = response.json()
                return {
                    'success': True,
                    'transaction_id': response_data['data']['id'],
                    'authorization_url': response_data['data']['link'],
                    'raw_response': response_data
                }
            else:
                return {
                    'success': False,
                    'error': response.json().get('message', 'Payment failed'),
                    'raw_response': response.json()
                }

        except Exception as e:
            logger.error(f"Flutterwave payment error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'raw_response': None
            }

    def refund_payment(self, transaction_id, amount=None):
        """
        Process refund using Flutterwave
        """
        try:
            refund_data = {
                "id": transaction_id
            }

            if amount:
                refund_data["amount"] = str(int(amount * 100))

            response = requests.post(
                f"{self.base_url}/transactions/{transaction_id}/refund",
                headers={
                    "Authorization": f"Bearer {self.secret_key}",
                    "Content-Type": "application/json"
                },
                json=refund_data
            )

            if response.status_code == 200:
                response_data = response.json()
                return {
                    'success': True,
                    'transaction_id': response_data['data']['id'],
                    'status': response_data['data']['status'],
                    'raw_response': response_data
                }
            else:
                return {
                    'success': False,
                    'error': response.json().get('message', 'Refund failed'),
                    'raw_response': response.json()
                }

        except Exception as e:
            logger.error(f"Flutterwave refund error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'raw_response': None
            }

    def verify_payment(self, transaction_id):
        """
        Verify payment status with Flutterwave
        """
        try:
            response = requests.get(
                f"{self.base_url}/transactions/{transaction_id}/verify",
                headers={"Authorization": f"Bearer {self.secret_key}"}
            )

            if response.status_code == 200:
                data = response.json()['data']
                return {
                    'verified': data['status'] == 'successful',
                    'status': data['status'],
                    'amount': data['amount'],
                    'currency': data['currency'],
                    'raw_response': response.json()
                }
            else:
                return {
                    'verified': False,
                    'error': 'Verification failed',
                    'raw_response': response.json()
                }

        except Exception as e:
            logger.error(f"Flutterwave verification error: {str(e)}")
            return {
                'verified': False,
                'error': str(e)
            }

    def _handle_payment_success(self, event):
        """Handle successful payment webhook"""
        # Update transaction status in database
        transaction_id = event['data']['tx_ref']
        # Implementation would update transaction status
        logger.info(f"Flutterwave payment successful: {transaction_id}")
        return JsonResponse({'status': 'success'})

    def _handle_transfer_success(self, event):
        """Handle successful transfer webhook"""
        # Handle transfer/payout success
        logger.info(f"Flutterwave transfer successful: {event['data']['id']}")
        return JsonResponse({'status': 'transfer_completed'})
