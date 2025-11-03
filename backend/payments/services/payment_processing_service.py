from django.db import transaction
from ..models.transaction import Transaction
from ..models.payment_method import PaymentMethod
from ..models.payment import Payment
from accounts.models import Customer, Merchant
import logging
import time

logger = logging.getLogger(__name__)

class PaymentService:
    """
    Service class for handling payment processing logic
    """
    @staticmethod
    def process_payment(user, amount, payment_method, payment_token=None):
        """
        Process a payment transaction
        """
        try:
            # Create and save transaction
            transaction = Transaction.objects.create(
                user=user,
                amount=amount,
                payment_method=payment_method,
                status='pending'
            )
            
            # Process payment based on method
            if payment_method == 'card':
                result = PaymentService._process_card_payment(payment_token, amount)
            elif payment_method == 'mobile_money':
                result = PaymentService._process_mobile_payment(user.phone_number, amount)
            elif payment_method == 'ussd':
                result = PaymentService._process_mobile_payment(user.phone_number, amount)
            else:
                raise ValueError(f"Unsupported payment method: {payment_method}")
            
            # Update transaction status
            transaction.status = 'completed' if result['success'] else 'failed'
            transaction.save()
            
            return {
                'success': True,
                'transaction_id': transaction.id,
                'status': transaction.status
            }
            
        except Exception as e:
            logger.error(f"Payment processing failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def verify_mobile_payment(transaction_id, provider):
        """
        Verify a mobile money payment
        """
        try:
            # Implementation would call provider's API
            # Mock verification for now
            return {'success': True, 'verified': True}
        except Exception as e:
            logger.error(f"Mobile payment verification failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def _process_card_payment(token, amount):
        """
        Process card payment through payment gateway
        """
        # Implementation would integrate with payment gateway
        # Mock processing for now
        return {'success': True}
    
    @staticmethod
    def _process_mobile_payment(phone_number, amount):
        """
        Process mobile money payment via USSD
        Args:
            phone_number: Customer phone number
            amount: Payment amount
        """
        try:
            # In a real implementation, this would integrate with mobile money APIs
            # For now we'll simulate a successful payment
            return {
                'success': True,
                'transaction_id': f"MM-{phone_number[-8:]}-{int(time.time())}"
            }
        except Exception as e:
            logger.error(f"Mobile payment processing failed: {str(e)}")
            return {'success': False, 'error': str(e)}

    @staticmethod
    def process_payout(merchant, amount):
        """
        Process a payout to a merchant
        Args:
            merchant: Merchant object
            amount: Payout amount
        Returns:
            dict: {'success': bool, 'transaction_id': str, 'error': str}
        """
        try:
            # Verify merchant has sufficient balance
            if merchant.balance < amount:
                return {
                    'success': False,
                    'error': 'Insufficient merchant balance'
                }
            
            # Create payout transaction
            txn = Transaction.objects.create(
                merchant=merchant,
                amount=amount,
                currency='USD',
                status=Transaction.PENDING,
                transaction_type=Transaction.PAYOUT
            )
            
            # Process payout via merchant's default payout method
            payout_method = merchant.default_payout_method
            if payout_method.method_type == PaymentMethod.BANK:
                result = PaymentService._process_bank_payout(merchant, amount)
            elif payout_method.method_type == PaymentMethod.MOBILE_MONEY:
                result = PaymentService._process_mobile_payout(merchant, amount)
            else:
                raise ValueError(f"Unsupported payout method: {payout_method.method_type}")
            
            # Update transaction status
            if result['success']:
                txn.status = Transaction.COMPLETED
                merchant.balance -= amount
                merchant.save()
            else:
                txn.status = Transaction.FAILED
                
            txn.save()
            
            return {
                'success': True,
                'transaction_id': txn.id,
                'status': txn.status
            }
            
        except Exception as e:
            logger.error(f"Payout processing failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def _process_bank_payout(merchant, amount):
        """Process bank transfer payout"""
        # Integration with bank API would go here
        return {'success': True}
    
    @staticmethod
    def _process_mobile_payout(merchant, amount):
        """Process mobile money payout"""
        # Integration with mobile money API would go here
        return {'success': True}

    @transaction.atomic
    def process_bill_payment(self, user, bill_data):
        """
        Process bill payment with additional validation
        Args:
            user: User making payment
            bill_data: Dict containing bill payment details
        Returns: Payment object
        """
        from ..models import Payment
        from accounts.models import Customer
        
        # Validate required bill fields
        required_fields = ['bill_reference', 'bill_type', 'amount']
        if not all(field in bill_data for field in required_fields):
            raise ValueError(f'Missing required bill fields: {required_fields}')
        
        customer = Customer.objects.get(user=user)
        
        # Create bill payment
        payment = Payment.objects.create(
            customer=customer,
            amount=bill_data['amount'],
            bill_reference=bill_data['bill_reference'],
            bill_type=bill_data['bill_type'],
            bill_issuer=bill_data.get('bill_issuer'),
            bill_issuer_code=bill_data.get('bill_issuer_code'),
            due_date=bill_data.get('due_date'),
            late_fee=bill_data.get('late_fee', 0),
            status=Payment.PENDING
        )
        
        # Process payment based on method
        # (Implementation would vary based on payment gateway)
        payment.status = Payment.COMPLETED
        payment.save()
        
        return payment

    @staticmethod
    def process_p2p_payment(sender, recipient, amount, payment_method, description=''):
        """
        Process peer-to-peer payment between customers
        Args:
            sender: Customer sending money
            recipient: Customer receiving money
            amount: Payment amount
            payment_method: PaymentMethod object
            description: Optional payment description
        Returns: dict with success status and transaction details
        """
        try:
            # For P2P payments, we treat it as a direct transfer
            # In a real implementation, this might involve wallet balances or bank transfers
            
            # Validate sender has sufficient funds (simplified check)
            # In a real app, you'd check wallet balance or account balance
            if hasattr(sender, 'balance') and sender.balance < amount:
                return {
                    'success': False,
                    'error': 'Insufficient funds'
                }
            
            # Process payment based on method type
            if payment_method.method_type == 'mobile_money':
                result = PaymentService._process_mobile_payment(sender.phone_number, amount)
            elif payment_method.method_type == 'credit_card':
                # For P2P, card payments might be handled differently
                result = PaymentService._process_card_payment(None, amount)
            elif payment_method.method_type == 'bank_transfer':
                result = {'success': True, 'transaction_id': f"BANK-{int(time.time())}"}
            else:
                return {
                    'success': False,
                    'error': f'Unsupported payment method for P2P: {payment_method.method_type}'
                }
            
            if result['success']:
                # Update balances (simplified - in real app, use proper transaction handling)
                if hasattr(sender, 'balance'):
                    sender.balance -= amount
                    sender.save()
                if hasattr(recipient, 'balance'):
                    recipient.balance += amount
                    recipient.save()
                
                return {
                    'success': True,
                    'transaction_id': result.get('transaction_id', f"P2P-{int(time.time())}"),
                    'message': f'Successfully sent ${amount} to {recipient.user.email}'
                }
            else:
                return result
                
        except Exception as e:
            logger.error(f"P2P payment processing failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
