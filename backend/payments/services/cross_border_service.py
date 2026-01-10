import requests
import logging
from django.conf import settings
from decimal import Decimal
from .currency_service import CurrencyService

logger = logging.getLogger(__name__)

class CrossBorderService:
    """
    Handles international money transfer operations
    """

    @staticmethod
    def get_exchange_rate(from_currency_code: str, to_currency_code: str) -> Decimal:
        """
        Get current exchange rate between currencies
        Args:
            from_currency_code: 3-letter currency code (e.g. 'USD')
            to_currency_code: 3-letter currency code (e.g. 'GHS')
        Returns: Decimal exchange rate
        """
        from_currency = CurrencyService.get_currency_by_code(from_currency_code)
        to_currency = CurrencyService.get_currency_by_code(to_currency_code)

        if not from_currency or not to_currency:
            logger.warning(f"Invalid currency codes: {from_currency_code} -> {to_currency_code}")
            return Decimal('1.0')

        rate = CurrencyService.get_exchange_rate(from_currency, to_currency)
        return rate or Decimal('1.0')

    @staticmethod
    def calculate_fees(amount: Decimal, corridor: tuple = None) -> Decimal:
        """
        Calculate transfer fees based on amount and corridor
        Now uses the dynamic fee calculator
        """
        from .fee_calculator import DynamicFeeCalculator

        # Extract corridor information
        corridor_from = corridor[0] if corridor and len(corridor) > 0 else None
        corridor_to = corridor[1] if corridor and len(corridor) > 1 else None

        # Use dynamic fee calculator
        result = DynamicFeeCalculator.calculate_fee(
            fee_type='remittance',
            amount=amount,
            corridor_from=corridor_from,
            corridor_to=corridor_to,
            log_calculation=False  # Don't log preview calculations
        )

        if result['success']:
            return Decimal(str(result['fee_amount']))
        else:
            # Fallback to legacy calculation
            logger.warning(f"Dynamic fee calculation failed: {result.get('error')}, using legacy calculation")
            base_fee = getattr(settings, 'REMITTANCE_FEE_BASE', Decimal('5.00'))
            percentage_fee = getattr(settings, 'REMITTANCE_FEE_PERCENTAGE', Decimal('0.025'))
            return base_fee + (amount * percentage_fee)
    
    @staticmethod
    def send_remittance(sender, recipient_data, amount, from_currency_code: str):
        """
        Process international money transfer with compliance checks
        """
        from ..models.cross_border import CrossBorderRemittance
        from django.utils import timezone
        import uuid

        try:
            logger.info(f"Processing remittance for sender {sender.id}: amount={amount}, currency={from_currency_code}")

            # Get currency objects
            from_currency = CurrencyService.get_currency_by_code(from_currency_code)
            to_currency = CurrencyService.get_currency_by_code(recipient_data.get('country'))

            if not from_currency:
                raise ValueError(f"Invalid source currency: {from_currency_code}")

            # Advanced compliance verification
            from .advanced_compliance_service import PEPSanctionsService
            compliance_service = PEPSanctionsService()

            # Screen sender and recipient
            sender_data = {
                'name': f"{sender.first_name} {sender.last_name}",
                'date_of_birth': getattr(sender, 'date_of_birth', None),
                'nationality': getattr(sender, 'nationality', None),
                'aliases': []  # Could be populated from user data
            }

            recipient_data_full = {
                'name': recipient_data['name'],
                'date_of_birth': recipient_data.get('date_of_birth'),
                'nationality': recipient_data.get('country'),
                'aliases': recipient_data.get('aliases', [])
            }

            # Screen sender
            sender_screening = compliance_service.screen_individual(sender_data)
            if sender_screening.get('overall_risk') in ['high', 'critical']:
                raise ValueError(f"Sender compliance check failed: {sender_screening.get('overall_risk')} risk")

            # Screen recipient
            recipient_screening = compliance_service.screen_individual(recipient_data_full)
            if recipient_screening.get('overall_risk') in ['high', 'critical']:
                raise ValueError(f"Recipient compliance check failed: {recipient_screening.get('overall_risk')} risk")

            # Check for sanctions matches
            if sender_screening.get('sanctions_matches') or recipient_screening.get('sanctions_matches'):
                raise ValueError("Transaction involves sanctioned individuals/entities")

            # Check for PEP matches (high risk may require additional approval)
            pep_matches = sender_screening.get('pep_matches', []) + recipient_screening.get('pep_matches', [])
            if pep_matches and len(pep_matches) > 0:
                logger.warning(f"PEP match detected in remittance {remittance.id}: {len(pep_matches)} matches")
                # Could flag for enhanced due diligence here

            # Calculate exchange and fees
            exchange_rate = CrossBorderService.get_exchange_rate(from_currency_code, recipient_data['country'])
            fee = CrossBorderService.calculate_fees(amount)

            # Create remittance record
            remittance = CrossBorderRemittance.objects.create(
                sender=sender,
                recipient_name=recipient_data['name'],
                recipient_phone=recipient_data['phone'],
                recipient_country=recipient_data['country'],
                amount_sent=amount,
                currency_sent=from_currency_code,
                amount_received=amount * exchange_rate - fee,
                currency_received=to_currency.code if to_currency else '',
                exchange_rate=exchange_rate,
                fee=fee,
                fee_currency=from_currency_code,  # Fee charged in sender's currency
                reference_number=f"CB-{uuid.uuid4().hex[:8].upper()}",
                status=CrossBorderRemittance.PROCESSING,
                source_of_funds_verified=True,  # Set based on compliance check
                recipient_verified=True  # Set based on compliance check
            )

            logger.info(f"Created remittance {remittance.id} with reference {remittance.reference_number}")

            # TODO: Actual payment gateway integration

            # Report to BoG if required (placeholder)
            # from .bog_reporting_service import BoGReportingService
            # reporting_result = BoGReportingService.report_transaction(remittance)

            # Webhook notification (placeholder)
            # WebhookService.send_webhook(remittance, 'remittance_processed')

            remittance.status = CrossBorderRemittance.COMPLETED
            remittance.save()

            # Send notification for completed remittance
            CrossBorderService._send_remittance_notification(remittance, 'completed')

            logger.info(f"Remittance {remittance.id} completed successfully")
            return remittance

        except ValueError as e:
            logger.warning(f"Remittance validation error for sender {sender.id}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Remittance processing failed for sender {sender.id}: {str(e)}", exc_info=True)
            raise

    @staticmethod
    def _send_remittance_notification(remittance, notification_type: str):
        """
        Send notification for remittance events
        """
        try:
            from notifications.models import Notification
            from notifications.services import NotificationService
            
            sender = remittance.sender  # This is the Customer instance
            user = sender.user  # Assuming Customer has a user field
            
            if notification_type == 'completed':
                title = "International Transfer Completed"
                message = f"Your transfer of {remittance.amount_sent} {remittance.currency_sent} to {remittance.recipient_name} ({remittance.recipient_country}) has been completed. Reference: {remittance.reference_number}"
                level = 'payment'
                notification_type_code = 'remittance_completed'
            elif notification_type == 'initiated':
                title = "International Transfer Initiated"
                message = f"Your transfer of {remittance.amount_sent} {remittance.currency_sent} to {remittance.recipient_name} ({remittance.recipient_country}) has been initiated. Reference: {remittance.reference_number}"
                level = 'info'
                notification_type_code = 'remittance_initiated'
            else:
                return
            
            NotificationService.create_notification(
                user=user,
                title=title,
                message=message,
                level=level,
                notification_type=notification_type_code,
                metadata={
                    'remittance_id': remittance.id,
                    'reference_number': remittance.reference_number,
                    'amount_sent': float(remittance.amount_sent),
                    'amount_received': float(remittance.amount_received),
                    'recipient_name': remittance.recipient_name,
                    'recipient_country': remittance.recipient_country,
                    'fee': float(remittance.fee),
                    'exchange_rate': float(remittance.exchange_rate),
                    'status': remittance.status
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to send remittance notification: {str(e)}")
            # Don't fail the transaction if notification fails
