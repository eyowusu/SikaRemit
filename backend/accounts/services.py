from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import ValidationError
from users.models import Customer, Merchant
import logging
from django.conf import settings
from .models import AdminActivity
from payments.models.transaction import Transaction as PaymentTransaction
from payments.models.payment_log import PaymentLog
import stripe
from django.utils import timezone
from .tasks import send_payment_receipt
from paypalrestsdk import payments as paypal
import time
import requests
from django.core.cache import cache

User = get_user_model()
logger = logging.getLogger(__name__)

class AuthService:
    @staticmethod
    def create_user(email, password, user_type, **extra_fields):
        """User registration with role-specific profile creation"""
        if User.objects.filter(email=email).exists():
            raise ValidationError('User with this email already exists')
            
        # Set username to email if not provided
        username = extra_fields.pop('username', None) or email
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            user_type=user_type,
            **extra_fields
        )
        
        # Create role-specific profile
        if user_type == 2:  # merchant
            Merchant.objects.create(user=user)
        elif user_type == 3:  # customer
            Customer.objects.create(user=user)
            
        return user

    @staticmethod
    def get_tokens_for_user(user):
        """Generate JWT tokens with custom claims"""
        refresh = RefreshToken.for_user(user)
        
        # Map user_type to role for frontend compatibility
        role_mapping = {
            1: 'admin',
            2: 'merchant', 
            3: 'customer'
        }
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user_id': user.id,
            'user_type': user.user_type,
            'role': role_mapping.get(user.user_type, 'customer'),
            'is_verified': user.is_verified,
            'expires_in': 900  # 15 minutes in seconds
        }

    @staticmethod
    def validate_login(email, password):
        user = User.objects.filter(email=email).first()
        
        if not user:
            raise ValidationError('Invalid credentials')
            
        if user.auth_provider != 'email':
            raise ValidationError(f'Please login using {user.auth_provider}')
            
        if not user.check_password(password):
            logger.warning(f"Failed login attempt for email: {email}")
            raise ValidationError('Invalid credentials')
            
        if user.mfa_enabled:
            raise ValidationError('mfa_required')
            
        return user

class PaymentService:
    @staticmethod
    def process_subscription_payment(user, plan, payment_token):
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        # Create customer if not exists
        if not user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                source=payment_token
            )
            user.stripe_customer_id = customer.id
            user.save()
        
        # Create subscription charge
        amount = 2900 if plan == 'standard' else 9900  # in cents
        charge = stripe.Charge.create(
            amount=amount,
            currency='usd',
            customer=user.stripe_customer_id,
            description=f'{plan} subscription'
        )
        
        # Log payment
        PaymentLog.objects.create(
            user=user,
            amount=amount/100,
            plan=plan,
            stripe_charge_id=charge.id
        )
        
        # Set subscription expiry (1 month from now)
        user.subscription_expires = timezone.now() + timezone.timedelta(days=30)
        user.save()
        
        # Log admin activity for merchant upgrades
        if user.user_type == 2:  # merchant
            AdminActivity.objects.create(
                admin=user,
                action_type='SUBSCRIPTION_UPGRADE',
                details=f'Upgraded to {plan} plan'
            )
        
        # Send receipt email async
        send_payment_receipt.delay(user.id, charge.id)
        
        return charge

    @staticmethod
    def process_remittance(payment):
        """Process remittance payment"""
        # Implement remittance processing logic
        # Could integrate with banking APIs or other remittance services
        payment.status = 'processing'
        payment.save()
        
        # In a real implementation, this would call external APIs
        # For now, we'll simulate successful processing
        payment.status = 'completed'
        payment.save()
        
        # Send notification
        send_payment_receipt.delay(
            payment.user.id, 
            f"REMITTANCE_{payment.id}"
        )
        
        return payment

    @staticmethod
    def process_bill_payment(payment):
        """Process bill payment"""
        # Implement bill payment processing logic
        payment.status = 'processing'
        payment.save()
        
        # Simulate API call to biller
        if payment.bill_due_date and payment.bill_due_date < timezone.now().date():
            payment.status = 'failed'
            payment.save()
            raise Exception('Bill payment is overdue')
            
        payment.status = 'completed'
        payment.save()
        
        # Send notification
        send_payment_receipt.delay(
            payment.user.id, 
            f"BILL_{payment.id}"
        )
        
        return payment

    @staticmethod
    def process_checkout(user, data):
        """Process checkout payment"""
        payment = PaymentLog.objects.create(
            user=user,
            amount=data['amount'],
            payment_type='checkout',
            status='pending'
        )
        
        # Process based on payment method
        if data['payment_method'] == 'CARD':
            return PaymentService._process_card_payment(payment, data)
        elif data['payment_method'] == 'BANK_TRANSFER':
            return PaymentService._process_bank_transfer(payment, data)
        elif data['payment_method'] == 'MOBILE_MONEY':
            return PaymentService._process_mobile_money(payment, data)
        elif data['payment_method'] == 'GOOGLE_PAY':
            return PaymentService._process_google_pay(payment, data)
        elif data['payment_method'] == 'APPLE_PAY':
            return PaymentService._process_apple_pay(payment, data)
        elif data['payment_method'] == 'QR_CODE':
            return PaymentService._process_qr_payment(payment, data)
        else:
            return PaymentService._process_wallet_payment(payment, data)
    
    @staticmethod
    def _validate_mobile_money(number, provider):
        """Strict validation for mobile money numbers"""
        import re
        patterns = {
            'mtn': r'^(0|256)[7-9][0-9]{8}$',
            'airtel': r'^(0|256)[7][0-9]{8}$', 
            'vodafone': r'^(0|256)[5][0-9]{8}$'
        }
        
        if provider.lower() not in patterns:
            raise ValueError(f'Unsupported provider: {provider}')
            
        if not re.match(patterns[provider.lower()], number):
            raise ValueError(f'Invalid {provider} number format')
        
        return True

    @staticmethod
    def convert_currency(amount, from_currency, to_currency):
        """Convert between currencies using exchange rates"""
        if from_currency == to_currency:
            return amount
            
        # Get latest rates (cache for 1 hour)
        rates = cache.get_or_set(
            'currency_rates', 
            lambda: requests.get(settings.EXCHANGE_RATE_API).json(),
            60 * 60
        )
        
        if from_currency not in rates or to_currency not in rates:
            raise ValueError('Unsupported currency')
            
        return amount * rates[to_currency] / rates[from_currency]

    @staticmethod
    def _process_card_payment(payment, data):
        """Process card payment via Stripe"""
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        try:
            charge = stripe.Charge.create(
                amount=int(data['amount'] * 100),
                currency='usd',
                source=data['payment_token'],
                description=f'Checkout payment #{payment.id}'
            )
            
            payment.stripe_charge_id = charge.id
            payment.status = 'completed'
            payment.save()
            
            # Generate receipt
            payment.redirect_url = f'{settings.FRONTEND_URL}/checkout/success?id={payment.id}'
            payment.save()
            
            return payment
            
        except stripe.error.StripeError as e:
            payment.status = 'failed'
            payment.save()
            raise Exception(f'Card payment failed: {str(e)}')

    @staticmethod
    def _process_mobile_money(payment, data):
        """Process mobile money payment"""
        from .mobile_money import MobileMoneyClient
        
        # Validate number first
        PaymentService._validate_mobile_money(
            data['mobile_money_number'],
            data['mobile_money_provider']
        )
        
        payment.status = 'processing'
        payment.mobile_money_provider = data['mobile_money_provider']
        payment.mobile_money_number = data['mobile_money_number']
        payment.save()
        
        try:
            # Initialize mobile money client
            mm_client = MobileMoneyClient(data['mobile_money_provider'])
            
            # Initiate payment
            response = mm_client.initiate_payment(
                amount=data['amount'],
                phone_number=data['mobile_money_number'],
                reference=f'PAY_{payment.id}'
            )
            
            # Save provider reference
            payment.provider_reference = response.get('transactionId') or response.get('id')
            payment.status = 'pending'
            payment.save()
            
            # Save webhook URL for provider to call
            payment.webhook_url = f"{settings.BASE_URL}/accounts/webhooks/mobile-money/"
            payment.save()
            
            return payment
            
        except Exception as e:
            payment.status = 'failed'
            payment.save()
            raise Exception(f'Mobile money payment failed: {str(e)}')

    @staticmethod
    def _process_bank_transfer(payment, data):
        """Process bank transfer with currency conversion"""
        try:
            # Convert amount if needed
            if data.get('currency') != payment.currency:
                payment.amount = PaymentService.convert_currency(
                    payment.amount,
                    payment.currency,
                    data['currency']
                )
                payment.currency = data['currency']
                payment.save()
            
            from .banking import BankAPIClient
            
            max_retries = 3
            retry_delay = 30  # seconds
            
            for attempt in range(max_retries):
                try:
                    bank_client = BankAPIClient(
                        api_key=settings.BANK_API_KEY,
                        account_number=data['account_number'],
                        routing_number=data['routing_number']
                    )
                    
                    response = bank_client.initiate_transfer(
                        amount=payment.amount,
                        reference=f'PAY_{payment.id}'
                    )
                    
                    payment.provider_reference = response['transaction_id']
                    payment.status = 'pending'
                    payment.save()
                    
                    # Schedule status check
                    check_transfer_status.delay(
                        payment_id=payment.id,
                        provider_ref=response['transaction_id']
                    )
                    
                    return payment
                    
                except Exception as e:
                    if attempt == max_retries - 1:
                        payment.status = 'failed'
                        payment.error = str(e)
                        payment.save()
                        raise
                    
                    time.sleep(retry_delay)

        except Exception as e:
            payment.status = 'failed'
            payment.save()
            raise Exception(f'Bank transfer payment failed: {str(e)}')

    @staticmethod
    def _process_wallet_payment(payment, data):
        # Implement wallet payment processing logic
        pass

    @staticmethod
    def _process_google_pay(payment, data):
        """Process Google Pay via Stripe"""
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        try:
            # Create PaymentIntent with Google Pay payment method
            intent = stripe.PaymentIntent.create(
                amount=int(data['amount'] * 100),
                currency=data['currency'],
                payment_method_types=['card', 'google_pay'],
                payment_method=data['payment_token'],
                confirmation_method='manual',
                confirm=True
            )
            
            payment.stripe_payment_intent_id = intent.id
            payment.status = 'completed'
            payment.redirect_url = f'{settings.FRONTEND_URL}/checkout/success?id={payment.id}'
            payment.save()
            
            return payment
            
        except stripe.error.StripeError as e:
            payment.status = 'failed'
            payment.save()
            raise Exception(f'Google Pay payment failed: {str(e)}')
    
    @staticmethod
    def _process_apple_pay(payment, data):
        """Process Apple Pay via Stripe"""
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        try:
            # Create PaymentIntent with Apple Pay payment method
            intent = stripe.PaymentIntent.create(
                amount=int(data['amount'] * 100),
                currency=data['currency'],
                payment_method_types=['card', 'apple_pay'],
                payment_method=data['payment_token'],
                confirmation_method='manual',
                confirm=True
            )
            
            payment.stripe_payment_intent_id = intent.id
            payment.status = 'completed'
            payment.redirect_url = f'{settings.FRONTEND_URL}/checkout/success?id={payment.id}'
            payment.save()
            
            return payment
            
        except stripe.error.StripeError as e:
            payment.status = 'failed'
            payment.save()
            raise Exception(f'Apple Pay payment failed: {str(e)}')
    
    @staticmethod
    def _process_qr_payment(payment, data):
        """Process QR payment via PayPal"""
        try:
            # Initialize PayPal client
            paypal_client = paypal.PayPalClient(
                client_id=settings.PAYPAL_CLIENT_ID,
                client_secret=settings.PAYPAL_SECRET,
                environment='sandbox'
            )
            
            # Create QR code order
            order = paypal_client.create_qr_order(
                amount=data['amount'],
                currency=data['currency']
            )
            
            payment.paypal_order_id = order.id
            payment.qr_data = order.qr_code_url
            payment.status = 'pending'
            payment.save()
            
            # Poll for completion (in practice would use webhooks)
            if paypal_client.check_order_complete(order.id):
                payment.status = 'completed'
                payment.save()
            
            return payment
            
        except Exception as e:
            payment.status = 'failed'
            payment.save()
            raise Exception(f'QR payment failed: {str(e)}')

class LoyaltyService:
    """
    Enhanced with:
    - Tier-based rewards
    - Fraud detection
    - Point redemption
    """
    REWARD_RATE = 0.01  # 1 point per $1 spent
    TIER_BONUS = {
        'basic': 1.0,
        'silver': 1.1,
        'gold': 1.25, 
        'platinum': 1.5
    }
    FRAUD_THRESHOLD = 5  # 5x average payment
    POINTS_PER_DOLLAR = 1
    TIER_THRESHOLDS = {
        'basic': 0,
        'silver': 100,
        'gold': 500,
        'platinum': 1000
    }

    @classmethod
    def add_points(cls, customer, amount):
        """Add points with tier bonuses"""
        points = int(amount * cls.REWARD_RATE * cls.TIER_BONUS[customer.loyalty_tier])
        customer.loyalty_points += points
        
        # Update payment history (last 10 payments)
        history = customer.payment_history[-9:] + [amount]
        customer.payment_history = history
        customer.save()
        customer.update_tier()
        return points

    @classmethod
    def check_fraud(cls, customer, amount):
        """Detect anomalous payments"""
        if len(customer.payment_history) < 3:
            return False
            
        avg = sum(customer.payment_history) / len(customer.payment_history)
        return amount > (avg * cls.FRAUD_THRESHOLD)

    @classmethod
    def update_loyalty(cls, customer, amount):
        # Calculate points earned (1 point per dollar spent)
        points_earned = int(amount * cls.POINTS_PER_DOLLAR)
        customer.loyalty_points += points_earned
        
        # Update tier based on points
        for tier, threshold in sorted(cls.TIER_THRESHOLDS.items(), 
                                    key=lambda x: x[1], reverse=True):
            if customer.loyalty_points >= threshold:
                customer.loyalty_tier = tier
                break
                
        # Update average payment amount
        total_transactions = PaymentTransaction.objects.filter(customer=customer).count()
        customer.avg_payment_amount = (
            (customer.avg_payment_amount * total_transactions) + amount
        ) / (total_transactions + 1)
        
        customer.save()
        return points_earned

def log_audit_action(action, admin, user=None, metadata=None):
    """
    Log admin actions for audit purposes
    """
    from .models import UserActivity
    
    UserActivity.objects.create(
        user=user,
        event_type=action,
        metadata=metadata or {},
        ip_address=admin.META.get('REMOTE_ADDR') if hasattr(admin, 'META') else None
    )
