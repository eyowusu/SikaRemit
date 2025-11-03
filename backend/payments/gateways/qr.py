from .base import PaymentGateway
from django.conf import settings
import qrcode
import io
import base64
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class QRPaymentGateway(PaymentGateway):
    """QR Code payment gateway implementation"""
    
    def __init__(self):
        self.expiry_minutes = settings.QR_PAYMENT_EXPIRY
        
    def process_payment(self, amount, currency, payment_method, customer, merchant, metadata=None):
        """Generate QR code for payment"""
        try:
            # Generate unique payment reference
            payment_ref = f"QR_{datetime.now().timestamp()}_{merchant.id}_{amount}"
            
            # Create payload for QR code
            payload = {
                'merchant_id': merchant.id,
                'amount': amount,
                'currency': currency,
                'reference': payment_ref,
                'expiry': self.expiry_minutes
            }
            
            # Generate QR code image
            qr = qrcode.QRCode()
            qr.add_data(payload)
            img = qr.make_image()
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer)
            qr_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            return {
                'success': True,
                'transaction_id': payment_ref,
                'qr_code': qr_base64,
                'expiry': self.expiry_minutes
            }
            
        except Exception as e:
            logger.error(f"QR generation failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def refund_payment(self, transaction_id, amount=None):
        """QR payments are instant - refunds go through original payment method"""
        return {
            'success': False,
            'error': 'Refunds must be processed through original payment method'
        }
