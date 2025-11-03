from rest_framework.response import Response
from rest_framework import status, viewsets
from django.contrib.auth import get_user_model
from .serializers import AccountsUserSerializer, UserRegisterSerializer, UserLoginSerializer, PasswordResetTokenSerializer, AuthLogSerializer, AccountsTransactionSerializer, ProductSerializer, MerchantProductSerializer, ProductInventorySerializer, SubscriptionPaymentSerializer, RemittancePaymentSerializer, BillPaymentSerializer, CheckoutSerializer, PaymentLogSerializer
from core.permissions import IsAdminUser
from payments.models.transaction import Transaction
from payments.models.cross_border import CrossBorderRemittance
from payments.models.payment import Payment
from payments.models.payment_log import PaymentLog
from rest_framework.views import APIView
from .services import AuthService
from .models import PasswordResetToken, AuthLog, Product
from rest_framework.permissions import IsAuthenticated
from datetime import datetime
import requests
from django.conf import settings
import logging
from django.db import models
from functools import wraps
from rest_framework_simplejwt.tokens import AccessToken
from django.core.cache import cache

logger = logging.getLogger(__name__)

User = get_user_model()

def validate_token(view_func):
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        try:
            auth_header = request.headers.get('Authorization', '').split()
            if len(auth_header) == 2 and auth_header[0] == 'Bearer':
                AccessToken(auth_header[1]).verify()
                return view_func(request, *args, **kwargs)
            raise Exception('Invalid token format')
        except Exception as e:
            logger.warning(f'Token validation failed: {str(e)}')
            return Response({'error': 'Invalid or expired token'}, status=401)
    return wrapped_view

import time
from django.http import JsonResponse

class SessionMonitorMiddleware:
    """
    Middleware to monitor and expire inactive sessions
    """
    def __init__(self, get_response):
        self.get_response = get_response
        self.excluded_paths = ['/api/auth/refresh', '/api/auth/validate']
        
    def __call__(self, request):
        if request.user.is_authenticated and request.path not in self.excluded_paths:
            last_activity = request.session.get('last_activity')
            if last_activity and time.time() - last_activity > 3600:
                AuthService.logout_user(request.user)
                request.session.flush()
                return JsonResponse({'error': 'Session expired'}, status=401)
            request.session['last_activity'] = time.time()
        return self.get_response(request)

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = AccountsUserSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Add filtering capabilities
        email = self.request.query_params.get('email')
        if email:
            queryset = queryset.filter(email__icontains=email)
        return queryset

    def perform_update(self, serializer):
        # Prevent admins from changing their own status
        if self.request.user == serializer.instance and \
           'is_active' in serializer.validated_data:
            raise Exception("You cannot change your own status")
        serializer.save()

class UserRegisterView(APIView):
    """
    User registration endpoint
    """
    permission_classes = []  # Allow unauthenticated access to registration
    
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            user = AuthService.create_user(
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password'],
                user_type=serializer.validated_data['user_type'],
                username=serializer.validated_data.get('username'),
                first_name=serializer.validated_data.get('first_name'),
                last_name=serializer.validated_data.get('last_name'),
                phone=serializer.validated_data.get('phone')
            )
            tokens = AuthService.get_tokens_for_user(user)
            return Response(tokens, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserLoginView(APIView):
    """
    User authentication endpoint
    """
    permission_classes = []  # Allow unauthenticated access to login
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        try:
            user = serializer.validated_data['user']
            tokens = AuthService.get_tokens_for_user(user)
            
            # Log successful login
            logger.info(f"User {user.email} logged in successfully")
            
            # Set session data
            request.session['user_id'] = str(user.id)
            request.session['last_activity'] = str(time.time())
            
            # Add user data to the response
            user_data = {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_verified': user.is_verified,
                'role': 'admin' if user.is_staff else 'user'
            }
            
            response_data = {
                'access': tokens['access'],
                'refresh': tokens['refresh'],
                'user': user_data
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except serializers.ValidationError as e:
            logger.warning(f"Login validation failed: {str(e)}")
            return Response(
                {'error': str(e.detail[0]) if hasattr(e, 'detail') else 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response(
                {'error': 'An error occurred during login. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserRefreshView(APIView):
    """
    Token refresh endpoint
    """
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                raise ValueError('Refresh token is required')
                
            tokens = AuthService.refresh_tokens(refresh_token)
            return Response(tokens, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserLogoutView(APIView):
    """
    User logout endpoint with token blacklisting
    """
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                raise ValueError('Refresh token required')
            
            # Add token to blacklist
            AuthService.blacklist_token(refresh_token)
            
            # Invalidate all user sessions
            if request.user.is_authenticated:
                AuthService.invalidate_user_sessions(request.user)
            
            return Response(
                {'message': 'Successfully logged out from all devices'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f'Logout failed: {str(e)}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class LogoutOtherSessionsView(APIView):
    """
    Logout from all other active sessions
    """
    
    def post(self, request):
        try:
            # Requires authenticated user
            if not request.user.is_authenticated:
                raise Exception('Authentication required')
                
            # Logout other sessions except current one
            AuthService.logout_other_sessions(request.user, request.session.session_key)
            return Response(
                {'message': 'Logged out from all other sessions'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class GoogleAuthView(APIView):
    """
    Google authentication endpoint
    """
    
    def post(self, request):
        try:
            access_token = request.data.get('access_token')
            if not access_token:
                raise ValueError('Google access token is required')
                
            tokens = AuthService.authenticate_with_google(access_token)
            return Response(tokens, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )

class MFASetupView(APIView):
    """
    MFA setup endpoint
    """
    
    def post(self, request):
        try:
            # Requires authenticated user
            if not request.user.is_authenticated:
                raise Exception('Authentication required')
                
            # Generate MFA secret and QR code
            mfa_data = AuthService.setup_mfa(request.user)
            return Response(mfa_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class MFALoginView(APIView):
    """
    MFA verification endpoint for logins
    """
    
    def post(self, request):
        try:
            # Requires temporary auth token from initial login
            temp_token = request.data.get('temp_token')
            mfa_code = request.data.get('code')
            
            if not all([temp_token, mfa_code]):
                raise ValueError('Both temporary token and MFA code are required')
                
            # Verify MFA code and complete authentication
            tokens = AuthService.verify_mfa_login(temp_token, mfa_code)
            return Response(tokens, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )

class MFABackupCodesView(APIView):
    """
    MFA backup codes endpoint
    """
    
    def get(self, request):
        try:
            # Requires authenticated user
            if not request.user.is_authenticated:
                raise Exception('Authentication required')
                
            # Get existing backup codes
            codes = AuthService.get_backup_codes(request.user)
            return Response({'codes': codes}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    def post(self, request):
        try:
            # Requires authenticated user
            if not request.user.is_authenticated:
                raise Exception('Authentication required')
                
            # Generate new backup codes
            new_codes = AuthService.generate_backup_codes(request.user)
            return Response({'codes': new_codes}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class PasswordResetView(APIView):
    """
    Password reset request endpoint
    """
    
    def post(self, request):
        try:
            email = request.data.get('email')
            if not email:
                raise ValueError('Email is required')
                
            # Initiate password reset process
            AuthService.initiate_password_reset(email)
            return Response(
                {'message': 'Password reset link sent if email exists'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class PasswordResetConfirmView(APIView):
    """
    Password reset confirmation endpoint
    """
    
    def post(self, request):
        try:
            token = request.data.get('token')
            new_password = request.data.get('new_password')
            
            if not all([token, new_password]):
                raise ValueError('Both token and new password are required')
                
            # Complete password reset process
            AuthService.complete_password_reset(token, new_password)
            return Response(
                {'message': 'Password successfully reset'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class PasswordPolicyView(APIView):
    """
    Password policy configuration and validation endpoint
    """
    
    def get(self, request):
        try:
            # Get current password policy configuration
            policy = AuthService.get_password_policy()
            return Response(policy, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    def post(self, request):
        try:
            # Validate password against policy
            password = request.data.get('password')
            if not password:
                raise ValueError('Password is required')
                
            is_valid, message = AuthService.validate_password_policy(password)
            return Response(
                {'valid': is_valid, 'message': message},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class AdminActivityView(APIView):
    """
    Admin activity logging and retrieval endpoint
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        try:
            # Get filtered admin activities
            activities = AuthService.get_admin_activities(
                user_id=request.query_params.get('user_id'),
                action_type=request.query_params.get('action_type'),
                limit=request.query_params.get('limit', 100)
            )
            return Response(activities, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class SecurityAuditView(APIView):
    """
    Security audit endpoint
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        try:
            # Get security audit logs with optional filters
            audit_logs = AuthService.get_security_audits(
                user_id=request.query_params.get('user_id'),
                action_type=request.query_params.get('action_type'),
                start_date=request.query_params.get('start_date'),
                end_date=request.query_params.get('end_date'),
                limit=request.query_params.get('limit', 100)
            )
            return Response(audit_logs, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class BackupVerificationView(APIView):
    """
    Backup verification endpoint for account recovery
    """
    
    def post(self, request):
        try:
            email = request.data.get('email')
            verification_code = request.data.get('verification_code')
            
            if not all([email, verification_code]):
                raise ValueError('Both email and verification code are required')
                
            # Verify backup code and initiate recovery
            recovery_token = AuthService.verify_backup_code(email, verification_code)
            return Response(
                {'recovery_token': recovery_token},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class BackupVerificationListView(APIView):
    """
    Backup verification attempts listing endpoint
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        try:
            # Get all backup verification attempts
            verifications = AuthService.get_backup_verifications(
                user_id=request.query_params.get('user_id'),
                status=request.query_params.get('status'),
                limit=request.query_params.get('limit', 100)
            )
            return Response(verifications, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class SessionListView(APIView):
    """
    User session listing endpoint
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        try:
            # Get all active sessions for the current user
            sessions = AuthService.get_user_sessions(request.user)
            return Response(sessions, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class AuditReportView(APIView):
    """
    Audit report generation endpoint
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        try:
            # Generate audit report with optional filters
            report = AuthService.generate_audit_report(
                report_type=request.query_params.get('type', 'security'),
                start_date=request.query_params.get('start_date'),
                end_date=request.query_params.get('end_date'),
                user_id=request.query_params.get('user_id')
            )
            return Response(report, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class SessionAnalyticsView(APIView):
    """
    Session analytics endpoint
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        try:
            # Get session analytics data
            analytics = AuthService.get_session_analytics(
                period=request.query_params.get('period', 'daily'),
                user_id=request.query_params.get('user_id'),
                limit=request.query_params.get('limit', 30)
            )
            return Response(analytics, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class ConcurrentSessionCheckView(APIView):
    """
    Concurrent session check endpoint
    """
    
    def get(self, request):
        try:
            # Requires authenticated user
            if not request.user.is_authenticated:
                raise Exception('Authentication required')
                
            # Check for concurrent sessions
            has_concurrent = AuthService.has_concurrent_sessions(request.user)
            return Response(
                {'has_concurrent_sessions': has_concurrent},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class SessionTestView(APIView):
    """
    Session testing endpoint (for development/testing)
    """
    
    def get(self, request):
        try:
            # Test session functionality
            test_results = AuthService.test_session_functionality(request)
            return Response(test_results, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class ProductInventoryView(APIView):
    """
    Product inventory endpoint
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get inventory data with optional filters
            inventory = AuthService.get_product_inventory(
                product_id=request.query_params.get('product_id'),
                merchant_id=request.query_params.get('merchant_id'),
                in_stock=request.query_params.get('in_stock')
            )
            return Response(inventory, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class LoyaltyPointsView(APIView):
    """
    Get current loyalty points balance for authenticated user
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            points = AuthService.get_loyalty_points(request.user)
            return Response({'points': points}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class RedeemPointsView(APIView):
    """
    Redeem loyalty points for rewards
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            reward_id = request.data.get('reward_id')
            points_to_redeem = request.data.get('points')
            
            if not all([reward_id, points_to_redeem]):
                raise ValueError('Both reward_id and points are required')
                
            result = AuthService.redeem_loyalty_points(
                user=request.user,
                reward_id=reward_id,
                points=points_to_redeem
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class CheckoutAPIView(APIView):
    """
    Handle checkout operations
    """
    serializer_class = CheckoutSerializer
    
    @validate_token
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            # Process checkout logic here
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CheckoutStatusView(APIView):
    """
    Check status of a checkout transaction
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            # Get checkout status
            status = AuthService.get_checkout_status(
                user=request.user,
                checkout_id=pk
            )
            
            return Response(status, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class StripeWebhookView(APIView):
    """
    Handle Stripe webhook events
    """
    permission_classes = []
    
    def post(self, request):
        try:
            # Verify webhook signature
            payload = request.body
            sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
            event = AuthService.verify_stripe_webhook(payload, sig_header)
            
            # Process webhook event
            result = AuthService.process_stripe_webhook(event)
            
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class PayPalWebhookView(APIView):
    """
    Handle PayPal webhook events
    """
    permission_classes = []
    
    def post(self, request):
        try:
            # Verify webhook signature
            payload = request.body
            auth_algo = request.META.get('HTTP_PAYPAL_AUTH_ALGO')
            cert_url = request.META.get('HTTP_PAYPAL_CERT_URL')
            transmission_id = request.META.get('HTTP_PAYPAL_TRANSMISSION_ID')
            transmission_sig = request.META.get('HTTP_PAYPAL_TRANSMISSION_SIG')
            transmission_time = request.META.get('HTTP_PAYPAL_TRANSMISSION_TIME')
            
            event = AuthService.verify_paypal_webhook(
                payload,
                auth_algo,
                cert_url,
                transmission_id,
                transmission_sig,
                transmission_time
            )
            
            # Process webhook event
            result = AuthService.process_paypal_webhook(event)
            
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class MobileMoneyWebhookView(APIView):
    """
    Handle Mobile Money webhook events
    """
    permission_classes = []
    
    def post(self, request):
        try:
            # Verify webhook signature
            payload = request.body
            signature = request.META.get('HTTP_X_MOBILEMONEY_SIGNATURE')
            provider = request.META.get('HTTP_X_MOBILEMONEY_PROVIDER')
            
            event = AuthService.verify_mobile_money_webhook(
                payload,
                signature,
                provider
            )
            
            # Process webhook event
            result = AuthService.process_mobile_money_webhook(event)
            
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = AccountsUserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Add filtering capabilities
        email = self.request.query_params.get('email')
        if email:
            queryset = queryset.filter(email__icontains=email)
        return queryset

class CustomerViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing customers
    """
    queryset = User.objects.filter(user_type=1)  # Assuming 1 is the customer type
    serializer_class = AccountsUserSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Add filtering by email
        email = self.request.query_params.get('email')
        if email:
            queryset = queryset.filter(email__icontains=email)
        return queryset

class MerchantViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing merchants
    """
    queryset = User.objects.filter(user_type=2)  # Assuming 2 is the merchant type
    serializer_class = AccountsUserSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Add filtering by email
        email = self.request.query_params.get('email')
        if email:
            queryset = queryset.filter(email__icontains=email)
        return queryset

class PasswordResetTokenViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing password reset tokens
    """
    queryset = PasswordResetToken.objects.all()
    serializer_class = PasswordResetTokenSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Add filtering by user email
        email = self.request.query_params.get('email')
        if email:
            queryset = queryset.filter(user__email__icontains=email)
        return queryset
    
    def perform_destroy(self, instance):
        # Custom logic when deleting tokens
        AuthService.invalidate_reset_token(instance.token)
        instance.delete()

class AuthLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing authentication logs
    """
    queryset = AuthLog.objects.all().order_by('-timestamp')
    serializer_class = AuthLogSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Add filtering capabilities
        user_id = self.request.query_params.get('user_id')
        ip_address = self.request.query_params.get('ip_address')
        action = self.request.query_params.get('action')
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if ip_address:
            queryset = queryset.filter(ip_address=ip_address)
        if action:
            queryset = queryset.filter(action=action)
            
        return queryset

class TransactionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing financial transactions
    """
    queryset = Transaction.objects.all().order_by('-created_at')
    serializer_class = AccountsTransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by current user unless admin
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
            
        # Add additional filters
        status = self.request.query_params.get('status')
        currency = self.request.query_params.get('currency')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if status:
            queryset = queryset.filter(status=status)
        if currency:
            queryset = queryset.filter(currency=currency)
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
            
        return queryset
    
    def perform_create(self, serializer):
        # Add transaction processing logic
        transaction = serializer.save(user=self.request.user)
        AuthService.process_transaction(transaction)

class ProductViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing products
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by current merchant unless admin
        if not self.request.user.is_staff:
            queryset = queryset.filter(merchant=self.request.user)
            
        # Add additional filters
        status = self.request.query_params.get('status')
        product_type = self.request.query_params.get('type')
        
        if status:
            queryset = queryset.filter(status=status)
        if product_type:
            queryset = queryset.filter(product_type=product_type)
            
        return queryset
    
    def perform_create(self, serializer):
        # Set merchant to current user
        if not self.request.user.is_staff:
            serializer.save(merchant=self.request.user)
        else:
            serializer.save()

class MerchantProductViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing merchant products
    """
    queryset = Product.objects.all()
    serializer_class = MerchantProductSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by current merchant unless admin
        if not self.request.user.is_staff:
            queryset = queryset.filter(store=self.request.user)
            
        # Add additional filters
        status = self.request.query_params.get('status')
        product_type = self.request.query_params.get('type')
        
        if status:
            queryset = queryset.filter(status=status)
        if product_type:
            queryset = queryset.filter(product_type=product_type)
            
        return queryset
    
    def perform_create(self, serializer):
        # Set store to current user
        if not self.request.user.is_staff:
            serializer.save(store=self.request.user)
        else:
            serializer.save()

class ProductInventoryView(APIView):
    """
    Product inventory endpoint
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get inventory data with optional filters
            inventory = AuthService.get_product_inventory(
                product_id=request.query_params.get('product_id'),
                merchant_id=request.query_params.get('merchant_id'),
                in_stock=request.query_params.get('in_stock')
            )
            return Response(inventory, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class SubscriptionPaymentView(APIView):
    """
    Production-ready subscription payment endpoint with:
    - 7 payment methods
    - Custom webhooks
    - Fraud detection
    - Transaction logging
    """
    permission_classes = [IsAuthenticated]
    throttle_scope = 'payments'
    
    VALID_PAYMENT_METHODS = [
        'credit_card', 'bank_transfer', 'mobile_money',
        'crypto', 'wallet', 'paypal', 'gift_card'
    ]
    
    def post(self, request):
        try:
            # Idempotency check
            idempotency_key = request.headers.get('Idempotency-Key')
            if idempotency_key and PaymentLog.objects.filter(idempotency_key=idempotency_key).exists():
                return Response(
                    {'error': 'Duplicate request', 'code': 'idempotency_error'},
                    status=status.HTTP_409_CONFLICT
                )
            
            serializer = SubscriptionPaymentSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data
            
            # Validate payment
            if data['payment_method'] not in self.VALID_PAYMENT_METHODS:
                raise ValueError(f'Invalid payment method. Must be one of: {self.VALID_PAYMENT_METHODS}')
            if data['amount'] <= 0:
                raise ValueError('Payment amount must be positive')
            if len(data.get('metadata', {})) > 10:
                raise ValueError('Metadata cannot exceed 10 items')
            
            # Process payment
            result = AuthService.process_subscription_payment(
                user=request.user,
                subscription_id=data['subscription_id'],
                payment_method=data['payment_method'],
                amount=data['amount'],
                currency=data.get('currency', 'USD'),
                metadata=data.get('metadata', {})
            )
            
            # Log transaction
            PaymentLog.objects.create(
                transaction_id=result['id'],
                amount=result['amount'],
                currency=result['currency'],
                status='completed',
                idempotency_key=idempotency_key,
                metadata=result.get('metadata', {})
            )
            
            # Trigger webhook
            if data.get('enable_webhook', False):
                webhook_url = result.get('webhook_url') or settings.DEFAULT_PAYMENT_WEBHOOK_URL
                if webhook_url:
                    requests.post(
                        webhook_url,
                        json={
                            'event': 'payment_processed',
                            'user': {'id': request.user.id, 'email': request.user.email},
                            'payment': result,
                            'merchant': {
                                'id': settings.MERCHANT_ID,
                                'name': settings.MERCHANT_NAME
                            },
                            'timestamp': datetime.now().isoformat()
                        },
                        headers={'Content-Type': 'application/json'},
                        timeout=5
                    )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f'Payment failed: {str(e)}', exc_info=True)
            return Response(
                {'error': str(e), 'code': 'payment_error'},
                status=status.HTTP_400_BAD_REQUEST
            )

class RemittancePaymentView(APIView):
    """
    Handle remittance payments
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            serializer = RemittancePaymentSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Create remittance instance
            remittance = CrossBorderRemittance.objects.create(
                sender=request.user.customer,
                recipient_name=serializer.validated_data['recipient_name'],
                recipient_phone=serializer.validated_data.get('recipient_phone'),
                recipient_country=serializer.validated_data['recipient_country'],
                amount_sent=serializer.validated_data['amount'],
                amount_received=serializer.validated_data['amount'],  # Simplified
                exchange_rate=Decimal('1.0'),
                fee=Decimal('0.0')
            )
            
            return Response({
                'id': remittance.id,
                'reference_number': remittance.reference_number,
                'amount_sent': remittance.amount_sent,
                'recipient_name': remittance.recipient_name,
                'recipient_country': remittance.recipient_country,
                'status': remittance.status,
                'created_at': remittance.created_at
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class BillPaymentView(APIView):
    """
    Handle bill payments
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            serializer = BillPaymentSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Create bill payment instance
            payment = Payment.objects.create(
                customer=request.user.customer,
                merchant=None,  # Bill payments might not have a specific merchant
                amount=serializer.validated_data['amount'],
                currency='USD',  # Default
                payment_method='bank_transfer',  # Default for bills
                payment_type=Payment.BILL,
                bill_issuer=serializer.validated_data['bill_issuer'],
                bill_reference=serializer.validated_data['bill_reference'],
                due_date=serializer.validated_data['due_date']
            )
            
            return Response({
                'id': payment.id,
                'amount': payment.amount,
                'status': payment.status,
                'bill_issuer': payment.bill_issuer,
                'bill_reference': payment.bill_reference,
                'due_date': payment.due_date,
                'created_at': payment.created_at
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class TokenValidateView(APIView):
    """
    Endpoint for validating access tokens
    """
    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'valid': False}, status=400)
        
        # Check cache first
        cache_key = f'valid_token_{token}'
        if cache.get(cache_key):
            return Response({'valid': True}, status=200)
            
        try:
            AccessToken(token).verify()
            cache.set(cache_key, True, timeout=300)
            return Response({'valid': True}, status=200)
        except Exception as e:
            logger.debug(f'Token validation failed: {str(e)}')
            return Response({'valid': False}, status=400)

class PaymentView(APIView):
    """
    Payment endpoint
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            serializer = SubscriptionPaymentSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            result = AuthService.process_subscription_payment(
                user=request.user,
                subscription_id=serializer.validated_data['subscription_id'],
                payment_method=serializer.validated_data['payment_method'],
                amount=serializer.validated_data['amount'],
                currency=serializer.validated_data.get('currency', 'USD'),
                metadata=serializer.validated_data.get('metadata', {})
            )
            
            return Response(result, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class PaymentLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing payment logs
    """
    queryset = PaymentLog.objects.all().order_by('-created_at')
    serializer_class = PaymentLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by current user unless admin
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
            
        # Add additional filters
        status = self.request.query_params.get('status')
        payment_method = self.request.query_params.get('payment_method')
        
        if status:
            queryset = queryset.filter(status=status)
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
            
        return queryset

class TokenValidateView(APIView):
    """
    Token validation endpoint
    """
    permission_classes = []  # Allow unauthenticated access for token validation

    def post(self, request):
        try:
            token = request.data.get('token')
            if not token:
                raise ValueError('Token is required')

            # Validate the token
            from rest_framework_simplejwt.tokens import AccessToken
            AccessToken(token).verify()

            return Response({'valid': True}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'valid': False, 'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )
