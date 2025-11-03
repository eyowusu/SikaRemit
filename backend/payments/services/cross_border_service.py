import requests
import logging
from django.conf import settings
from decimal import Decimal

logger = logging.getLogger(__name__)

class CrossBorderService:
    """
    Handles international money transfer operations
    """
    
    @staticmethod
    def get_exchange_rate(from_currency, to_currency):
        """
        Get current exchange rate from API
        Args:
            from_currency: 3-letter currency code (e.g. 'USD')
            to_currency: 3-letter currency code (e.g. 'GHS')
        Returns: Decimal exchange rate
        """
        from django.conf import settings
        try:
            if hasattr(settings, 'EXCHANGE_API_URL'):
                response = requests.get(
                    f"{settings.EXCHANGE_API_URL}/latest?"
                    f"base={from_currency}&symbols={to_currency}"
                )
                return Decimal(str(response.json()['rates'][to_currency]))
            
            # Fallback to development rates
            rates = {
                ('USD', 'GHS'): Decimal('11.5'),
                ('EUR', 'GHS'): Decimal('12.8'),
                ('GBP', 'GHS'): Decimal('14.2'),
            }
            return rates.get((from_currency, to_currency), Decimal('1.0'))
            
        except Exception as e:
            logger.error(f"Exchange rate lookup failed: {str(e)}")
            return Decimal('1.0')
    
    @staticmethod
    def calculate_fees(amount, corridor):
        """
        Calculate transfer fees based on amount and country corridor
        Args:
            amount: Decimal amount to send
            corridor: Tuple of (from_country, to_country)
        Returns: Decimal fee amount
        """
        from django.conf import settings
        return settings.REMITTANCE_FEE_BASE + (amount * settings.REMITTANCE_FEE_PERCENTAGE)
    
    @staticmethod
    def send_remittance(sender, recipient_data, amount, from_currency):
        """
        Process international money transfer with compliance checks
        """
        from ..models.cross_border import CrossBorderRemittance
        from .compliance_service import GhanaRemittanceCompliance
        from django.utils import timezone
        import uuid
        
        try:
            # Compliance verification
            compliant, message = GhanaRemittanceCompliance.full_compliance_check(
                sender,
                recipient_data,
                amount
            )
            if not compliant:
                raise ValueError(message)
            
            # Calculate exchange and fees
            exchange_rate = CrossBorderService.get_exchange_rate(
                from_currency,
                recipient_data['country']
            )
            fee = CrossBorderService.calculate_fees(
                amount,
                (settings.BASE_COUNTRY, recipient_data['country'])
            )
            
            # Create remittance record
            remittance = CrossBorderRemittance.objects.create(
                sender=sender,
                recipient_name=recipient_data['name'],
                recipient_phone=recipient_data['phone'],
                recipient_country=recipient_data['country'],
                amount_sent=amount,
                amount_received=amount * exchange_rate - fee,
                exchange_rate=exchange_rate,
                fee=fee,
                reference_number=f"CB-{uuid.uuid4().hex[:8].upper()}",
                status=CrossBorderRemittance.PROCESSING
            )
            
            # TODO: Actual payment gateway integration
            
            # Webhook notification
            WebhookService.send_webhook(
                remittance,
                'remittance_processed'
            )
            
            remittance.status = CrossBorderRemittance.COMPLETED
            remittance.save()
            
            return remittance
            
        except Exception as e:
            logger.error(f"Remittance failed: {str(e)}")
            raise
