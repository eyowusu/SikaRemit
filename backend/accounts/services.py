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
import time
import requests
from django.core.cache import cache
import json
from .mfa import MFAService

User = get_user_model()
logger = logging.getLogger(__name__)

class AuthService:
    @staticmethod
    def auto_identify_user_type(email, current_user_type=None):
        """
        Auto-identify user type based on email patterns and other attributes
        Returns suggested user_type (1=Admin, 2=merchant, 3=customer)
        
        SECURITY: Admin accounts can ONLY be created via Django admin or management commands.
        Public registration always defaults to Customer (3).
        """
        # SECURITY: Never allow admin creation via public registration
        # Admin accounts must be created by existing admins via Django admin panel
        if current_user_type == 1:
            logger.warning(f"Attempted admin registration blocked for email: {email}")
            return 3  # Force to customer
        
        # If a valid non-admin type is provided, use it
        if current_user_type in [2, 3]:
            return current_user_type

        # Default to Customer for public registration
        return 3  # Customer

    @staticmethod
    def get_user_type_display_info(user_type):
        """
        Get display information for user types including labels, colors, and icons
        """
        type_info = {
            1: {  # Admin
                'label': 'Admin',
                'color': '#dc2626',  # red-600
                'bgColor': '#fef2f2',  # red-50
                'icon': '👑',
                'description': 'Full system access'
            },
            2: {  # Merchant
                'label': 'Merchant',
                'color': '#2563eb',  # blue-600
                'bgColor': '#eff6ff',  # blue-50
                'icon': '🏪',
                'description': 'Business operations'
            },
            3: {  # Customer
                'label': 'Customer',
                'color': '#16a34a',  # green-600
                'bgColor': '#f0fdf4',  # green-50
                'icon': '👤',
                'description': 'End user'
            }
        }
        return type_info.get(user_type, {
            'label': 'Unknown',
            'color': '#6b7280',  # gray-500
            'bgColor': '#f9fafb',  # gray-50
            'icon': '❓',
            'description': 'Unknown type'
        })

    @staticmethod
    def create_user(email, password, user_type, **extra_fields):
        """User registration with role-specific profile creation"""
        from django.db import transaction
        
        if User.objects.filter(email=email).exists():
            raise ValidationError('User with this email already exists')
            
        # Set username to email if not provided
        username = extra_fields.pop('username', None) or email
        
        # Ensure phone is always provided (default to empty string)
        phone = extra_fields.pop('phone', '')
        
        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                user_type=user_type,
                phone=phone,
                **extra_fields
            )
            
            # Create role-specific profile
            if user_type == 2:  # merchant
                Merchant.objects.create(user=user)
            elif user_type == 3:  # customer
                # Check if Customer already exists (defensive programming)
                if not hasattr(user, 'customer_profile'):
                    Customer.objects.create(user=user)
                    
        return user

    @staticmethod
    def get_tokens_for_user(user):
        """Generate JWT tokens with custom claims"""
        try:
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
        except Exception as e:
            logger.error(f"Failed to generate tokens for user {user.email if user else 'unknown'}: {str(e)}")
            raise e

    @staticmethod
    def refresh_tokens(refresh_token):
        """Refresh JWT tokens"""
        try:
            refresh = RefreshToken(refresh_token)
            user = refresh.user
            
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
        except Exception as e:
            raise ValidationError('Invalid refresh token')

    @staticmethod
    def verify_mobile_money_webhook(payload, signature, provider):
        """Verify mobile money webhook signature"""
        import hmac
        import hashlib
        
        if provider not in ['mtn', 'telecel', 'airtel_tigo']:
            raise ValidationError('Invalid provider')
            
        # Parse payload if it's bytes
        if isinstance(payload, bytes):
            payload = json.loads(payload.decode('utf-8'))
        
        secret = settings.MOBILE_MONEY_WEBHOOK_SECRET or 'test-secret'
        expected_signature = hmac.new(
            secret.encode(),
            json.dumps(payload, sort_keys=True).encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_signature):
            raise ValidationError('Invalid signature')
            
        return payload

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

    @staticmethod
    def get_account_balance(user):
        """Get account balance for user"""
        try:
            # For now, return a mock balance since we don't have a balance model yet
            # In production, this would query the user's account balance
            return {
                'available': 1250.75,
                'pending': 150.00,
                'currency': 'USD',
                'lastUpdated': timezone.now().isoformat()
            }
        except Exception as e:
            logger.error(f'Error getting account balance for user {user.id}: {str(e)}')
            return {
                'available': 0.00,
                'pending': 0.00,
                'currency': 'USD',
                'lastUpdated': timezone.now().isoformat()
            }
    
    @staticmethod
    def has_concurrent_sessions(user):
        """
        Check if user has concurrent active sessions.
        Returns True if user has more than one active session.
        """
        from django.contrib.sessions.models import Session
        from django.utils import timezone
        
        try:
            # Get all active sessions
            active_sessions = Session.objects.filter(
                expire_date__gte=timezone.now()
            )
            
            # Count sessions for this user
            user_sessions = 0
            for session in active_sessions:
                session_data = session.get_decoded()
                if session_data.get('_auth_user_id') == str(user.id):
                    user_sessions += 1
                    
            # Concurrent if more than 1 active session
            return user_sessions > 1
            
        except Exception as e:
            logger.error(f'Error checking concurrent sessions for user {user.id}: {str(e)}')
            return False
    
    @staticmethod
    def test_session_functionality(request):
        """
        Test session functionality for debugging purposes.
        Returns session information and diagnostics.
        """
        from django.contrib.sessions.models import Session
        from django.utils import timezone
        
        try:
            user = request.user if request.user.is_authenticated else None
            session_key = request.session.session_key
            
            # Get session info
            session_info = {
                'session_key': session_key,
                'is_authenticated': request.user.is_authenticated,
                'user_id': user.id if user else None,
                'user_email': user.email if user else None,
                'session_data': dict(request.session.items()) if session_key else {},
            }
            
            # Count active sessions
            if user:
                active_sessions = Session.objects.filter(
                    expire_date__gte=timezone.now()
                )
                user_session_count = sum(
                    1 for s in active_sessions 
                    if s.get_decoded().get('_auth_user_id') == str(user.id)
                )
                session_info['user_active_sessions'] = user_session_count
                session_info['has_concurrent_sessions'] = user_session_count > 1
            
            # Total active sessions
            total_active = Session.objects.filter(
                expire_date__gte=timezone.now()
            ).count()
            session_info['total_active_sessions'] = total_active
            
            return session_info
            
        except Exception as e:
            logger.error(f'Error testing session functionality: {str(e)}')
            return {
                'error': str(e),
                'session_test': 'failed'
            }

    @staticmethod
    def setup_mfa(user):
        """Setup Multi-Factor Authentication for user"""
        try:
            # Check if user already has MFA enabled
            if user.mfa_enabled:
                raise ValidationError('MFA is already enabled for this user')

            # Generate TOTP secret
            secret = MFAService.generate_secret(user)

            # Generate OTP URI for authenticator apps
            otp_uri = MFAService.get_otp_uri(user, secret)

            # Generate QR code
            qr_code = MFAService.generate_qr_code(otp_uri)

            return {
                'secret': secret,
                'otp_uri': otp_uri,
                'qr_code': qr_code.decode('utf-8') if qr_code else None,
                'message': 'Scan the QR code with your authenticator app to set up 2FA'
            }
        except Exception as e:
            logger.error(f'Error setting up MFA for user {user.email}: {str(e)}')
            raise ValidationError(f'Failed to setup MFA: {str(e)}')


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
            raise ValidationError(f'Unsupported payment method: {data["payment_method"]}')
    
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
        """Process QR payment using internal QR gateway"""
        try:
            from payments.gateways.qr import QRPaymentGateway
            
            qr_gateway = QRPaymentGateway()
            result = qr_gateway.process_payment(
                amount=payment.amount,
                currency=payment.currency,
                payment_method=payment.payment_method,
                customer=payment.customer,
                merchant=payment.merchant,
                metadata={'qr_code': data.get('qr_code')}
            )
            
            if result.get('success'):
                payment.status = 'completed'
                payment.transaction_id = result.get('transaction_id')
            else:
                payment.status = 'failed'
                payment.error_message = result.get('error')
            
            payment.save()
            return payment
            
        except Exception as e:
            payment.status = 'failed'
            payment.save()
            raise Exception(f'QR payment failed: {str(e)}')


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
