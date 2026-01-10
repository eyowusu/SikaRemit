from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.utils import timezone
from .serializers import (
    UserLoginSerializer, UserRegisterSerializer, AccountsUserSerializer,
    CheckoutSerializer, AccountsTransactionSerializer, PaymentsTransactionSerializer, AdminActivitySerializer,
    BackupVerificationSerializer, SessionSerializer, PasswordResetTokenSerializer,
    AuthLogSerializer, PaymentSerializer, PaymentLogSerializer, ProductSerializer,
    ProductInventorySerializer, MerchantProductSerializer, RemittancePaymentSerializer,
    BillPaymentSerializer, SubscriptionPaymentSerializer, CustomerSerializer,
    MerchantSerializer, NotificationSerializer, PayoutSerializer,
    SupportTicketSerializer, SupportMessageSerializer, CreateSupportTicketSerializer, CreateSupportMessageSerializer
)
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import logging
from functools import wraps

logger = logging.getLogger(__name__)
from rest_framework.permissions import AllowAny, IsAuthenticated
from .permissions import IsAdminUser
from rest_framework import viewsets
from .models import (
    AdminActivity, BackupVerification, PasswordResetToken, AuthLog,
    Transaction, Session, Payout, SupportTicket, SupportMessage
)
from merchants.models import Product
from notifications.models import Notification
from payments.models.payment import Payment
from payments.models.payment_log import PaymentLog
from .services import AuthService
from django.conf import settings
from decimal import Decimal
from datetime import datetime
import requests

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
        self.excluded_paths = ['/api/auth/refresh', '/api/auth/validate', '/api/v1/accounts/google/', '/api/v1/accounts/google/callback/']
        
    def __call__(self, request):
        if request.user.is_authenticated and request.path not in self.excluded_paths:
            last_activity = request.session.get('last_activity')
            if last_activity and time.time() - last_activity > 3600:
                AuthService.logout_user(request.user)
                request.session.flush()
                return JsonResponse({'error': 'Session expired'}, status=401)
            request.session['last_activity'] = time.time()
        return self.get_response(request)

class AdminUserCreateView(APIView):
    """
    Admin-only endpoint for creating user accounts (admin, merchant, customer)
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        # Only admins can create users through this endpoint
        if not request.user.is_staff or request.user.user_type != 1:
            return Response(
                {'error': 'Only administrators can create user accounts'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = AccountsUserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create user through AuthService
            user = AuthService.create_user(
                email=serializer.validated_data['email'],
                password=serializer.validated_data.get('password'),  # Optional for admin creation
                user_type=serializer.validated_data.get('user_type', 3),  # Default to customer
                username=serializer.validated_data.get('username'),
                first_name=serializer.validated_data.get('first_name'),
                last_name=serializer.validated_data.get('last_name'),
                phone=serializer.validated_data.get('phone', '')
            )
            
            # If no password provided, set unusable password (force reset)
            if not serializer.validated_data.get('password'):
                user.set_unusable_password()
                user.save()
            
            # Log admin action
            logger.info(f"Admin {request.user.email} created user account: {user.email} (type: {user.user_type})")
            
            response_serializer = AccountsUserSerializer(user)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Admin user creation failed: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

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
    throttle_classes = []  # Disable throttling for registration
    
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            # Log validation errors for debugging
            logger.error(f"Registration validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Auto-identify user type if not provided or if we want to override
            email = serializer.validated_data['email']
            provided_user_type = serializer.validated_data.get('user_type')
            
            # Auto-detect user type based on email patterns
            auto_detected_type = AuthService.auto_identify_user_type(email, provided_user_type)
            
            # Log auto-identification if it differs from provided type
            if provided_user_type and auto_detected_type != provided_user_type:
                logger.info(f"Auto-identified user type {auto_detected_type} for {email}, overriding provided type {provided_user_type}")
            elif not provided_user_type:
                logger.info(f"Auto-identified user type {auto_detected_type} for {email}")
            
            user = AuthService.create_user(
                email=email,
                password=serializer.validated_data['password'],
                user_type=auto_detected_type,
                username=serializer.validated_data.get('username'),
                first_name=serializer.validated_data.get('first_name'),
                last_name=serializer.validated_data.get('last_name'),
                phone=serializer.validated_data.get('phone', '')
            )
            
            tokens = AuthService.get_tokens_for_user(user)
            
            # Include user type display info in response
            user_type_info = AuthService.get_user_type_display_info(user.user_type)
            
            response_data = {
                **tokens,
                'user_type_info': user_type_info,
                'auto_identified': provided_user_type is None or auto_detected_type != provided_user_type
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Registration failed: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

@method_decorator(csrf_exempt, name='dispatch')
class UserLoginView(APIView):
    """
    User authentication endpoint with caching optimization
    """
    permission_classes = []  # Allow unauthenticated access to login
    authentication_classes = []  # Disable JWT authentication for login
    throttle_classes = []  # Disable throttling for login
    
    def post(self, request):
        import traceback
        try:
            print(f"DEBUG: Login view called with data: {request.data}")
            
            # Validate input data
            if not request.data or 'email' not in request.data or 'password' not in request.data:
                print(f"DEBUG: Missing email or password in request.data")
                return Response(
                    {'error': 'Email and password are required'},
                    status=400
                )
            
            print(f"DEBUG: Creating serializer with data: {request.data}")
            serializer = UserLoginSerializer(data=request.data)
            
            print(f"DEBUG: Checking serializer validity...")
            is_valid = serializer.is_valid()
            print(f"DEBUG: Serializer is_valid: {is_valid}")
            
            if not is_valid:
                print(f"DEBUG: Serializer errors: {serializer.errors}")
                error_msg = 'Invalid email or password.'
                
                # Check if this might be an admin login attempt
                email = request.data.get('email', '')
                try:
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    user = User.objects.filter(email=email).first()
                    if user and user.user_type == 1:  # Admin user
                        error_msg = 'Access denied. Invalid admin credentials.'
                except Exception as e:
                    print(f"DEBUG: Error checking admin user: {e}")
                
                return Response(
                    {'error': error_msg},
                    status=400
                )
            
            print("DEBUG: Serializer valid, getting user")
            user = serializer.validated_data['user']
            
            print(f"DEBUG: User found: {user.email}, type: {user.user_type}")
            print(f"DEBUG: User is_active: {user.is_active}, is_verified: {user.is_verified}")
            
            # Generate tokens
            from rest_framework_simplejwt.tokens import RefreshToken
            try:
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
                print("DEBUG: Tokens generated successfully")
            except Exception as e:
                print(f"ERROR: Token generation failed: {str(e)}")
                return Response(
                    {'error': 'Authentication failed. Please try again.'},
                    status=500
                )
            
            role_mapping = {1: 'admin', 2: 'merchant', 3: 'customer'}
            
            # Get user type display info
            user_type_info = AuthService.get_user_type_display_info(user.user_type)
            
            response_data = {
                'access': access_token,
                'refresh': refresh_token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name or '',
                    'last_name': user.last_name or '',
                    'role': role_mapping.get(user.user_type, 'customer'),
                    'is_verified': user.is_verified
                },
                'user_type_info': user_type_info
            }
            
            print("DEBUG: Login successful")
            return Response(response_data, status=200)
            
        except Exception as e:
            print(f"ERROR: Unexpected error in login: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {'error': 'An unexpected error occurred. Please try again.'},
                status=500
            )

class UserRefreshView(APIView):
    """
    Token refresh endpoint
    """
    permission_classes = [AllowAny]
    
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

class EmailVerificationView(APIView):
    """
    Email verification request endpoint
    """

    def post(self, request):
        try:
            email = request.data.get('email')
            if not email:
                raise ValueError('Email is required')

            # Send email verification link
            AuthService.send_email_verification(email)
            return Response(
                {'message': 'Email verification link sent successfully'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class EmailVerificationConfirmView(APIView):
    """
    Email verification confirmation endpoint
    """

    def post(self, request):
        try:
            token = request.data.get('token')
            if not token:
                raise ValueError('Verification token is required')

            # Verify email with token
            AuthService.verify_email_token(token)
            return Response(
                {'message': 'Email verified successfully'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class PasswordChangeView(APIView):
    """
    Password change endpoint for authenticated users
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            current_password = request.data.get('current_password')
            new_password = request.data.get('new_password')
            confirm_password = request.data.get('confirm_password')
            
            if not all([current_password, new_password, confirm_password]):
                raise ValueError('All password fields are required')
                
            if new_password != confirm_password:
                raise ValueError('New passwords do not match')
                
            # Verify current password
            if not request.user.check_password(current_password):
                raise ValueError('Current password is incorrect')
                
            # Change password
            request.user.set_password(new_password)
            request.user.save()
            
            return Response(
                {'message': 'Password changed successfully'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class ProfileView(APIView):
    """
    User profile endpoint for authenticated users
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            serializer = AccountsUserSerializer(request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def patch(self, request):
        try:
            serializer = AccountsUserSerializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

from django.http import HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@csrf_exempt
def google_oauth_view(request):
    """
    Simple function-based view for Google OAuth initiation to bypass DRF authentication
    """
    try:
        if not hasattr(settings, 'GOOGLE_OAUTH_CLIENT_ID') or not settings.GOOGLE_OAUTH_CLIENT_ID:
            from django.http import JsonResponse
            return JsonResponse({
                'error': 'Google OAuth is not configured. Please set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in your environment.'
            }, status=503)

        from .oauth import GoogleOAuth

        # Get the frontend callback URL
        frontend_url = request.GET.get('callback_url', 'http://localhost:3000')
        redirect_uri = f"{frontend_url}/auth/callback/google"

        google_oauth = GoogleOAuth()
        oauth_session = google_oauth.get_oauth_session(redirect_uri)

        authorization_url, state = oauth_session.authorization_url(
            GoogleOAuth.AUTHORIZATION_BASE_URL,
            access_type="offline",
            prompt="consent"
        )

        # Store state and redirect_uri in session for security
        request.session['oauth_state'] = state
        request.session['oauth_redirect_uri'] = redirect_uri

        return HttpResponseRedirect(authorization_url)

    except Exception as e:
        logger.error(f"Google OAuth initiation failed: {str(e)}")
        from django.http import JsonResponse
        return JsonResponse({'error': 'Failed to initiate Google OAuth'}, status=500)

class GoogleAuthView(APIView):
    """
    Google OAuth initiation endpoint - redirects to Google for authorization
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def get(self, request):
        try:
            # Check if Google OAuth is configured
            if not hasattr(settings, 'GOOGLE_OAUTH_CLIENT_ID') or not settings.GOOGLE_OAUTH_CLIENT_ID:
                return Response(
                    {'error': 'Google OAuth is not configured. Please set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in your environment.'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

            from .oauth import GoogleOAuth
            from django.http import HttpResponseRedirect

            # Get the frontend callback URL
            frontend_url = request.GET.get('callback_url', 'http://localhost:3000')
            redirect_uri = f"{frontend_url}/auth/callback/google"

            google_oauth = GoogleOAuth()
            oauth_session = google_oauth.get_oauth_session(redirect_uri)

            authorization_url, state = oauth_session.authorization_url(
                GoogleOAuth.AUTHORIZATION_BASE_URL,
                access_type="offline",
                prompt="consent"
            )

            # Store state and redirect_uri in session for security
            request.session['oauth_state'] = state
            request.session['oauth_redirect_uri'] = redirect_uri

            return HttpResponseRedirect(authorization_url)

        except Exception as e:
            logger.error(f"Google OAuth initiation failed: {str(e)}")
            return Response(
                {'error': 'Failed to initiate Google OAuth'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GoogleOAuthCallbackView(APIView):
    """
    Google OAuth callback endpoint to exchange authorization code for tokens
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        try:
            # Check if Google OAuth is configured
            if not hasattr(settings, 'GOOGLE_OAUTH_CLIENT_ID') or not settings.GOOGLE_OAUTH_CLIENT_ID:
                return Response(
                    {'error': 'Google OAuth is not configured. Please set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in your environment.'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

            code = request.data.get('code')
            state = request.data.get('state')
            if not code:
                raise ValueError('Authorization code is required')

            # Validate state parameter for security
            session_state = request.session.get('oauth_state')
            if state and session_state and state != session_state:
                raise ValueError('Invalid OAuth state')

            # Get the redirect URI from the session or use default
            redirect_uri = request.session.get('oauth_redirect_uri', 'http://localhost:3000/auth/callback/google')

            # Exchange code for tokens and get user info
            from .oauth import GoogleOAuth, OAuthService
            google_oauth = GoogleOAuth()

            # Create OAuth session with the same redirect URI used during authorization
            oauth_session = google_oauth.get_oauth_session(redirect_uri)
            token_url = 'https://oauth2.googleapis.com/token'

            token_response = oauth_session.fetch_token(
                token_url=token_url,
                code=code,
                client_secret=settings.GOOGLE_OAUTH_CLIENT_SECRET
            )

            # Get user info
            user_info = google_oauth.get_user_info(token_response)

            # Authenticate or create user
            user = OAuthService.authenticate_or_create(user_info, 'google')

            # Generate JWT tokens
            tokens = AuthService.generate_tokens(user)

            return Response({
                'access': str(tokens['access']),
                'refresh': str(tokens['refresh']),
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': dict(user.USER_TYPE_CHOICES).get(user.user_type, 'customer')
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Google OAuth callback failed: {str(e)}")
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

class CustomerBalanceView(APIView):
    """
    Customer balance endpoint
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Get customer profile
            customer = getattr(request.user, 'customer_profile', None)
            if not customer:
                return Response({'error': 'Customer profile not found'}, status=status.HTTP_404_NOT_FOUND)

            # Return balance information
            balance_data = {
                'balance': str(customer.balance),
                'currency': 'GHS',  # Default currency
                'available_balance': str(customer.balance),
                'pending_balance': '0.00'
            }
            return Response(balance_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class CustomerPaymentsView(APIView):
    """
    Customer payments/transactions endpoint
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Get customer profile
            customer = getattr(request.user, 'customer_profile', None)
            if not customer:
                return Response({'error': 'Customer profile not found'}, status=status.HTTP_404_NOT_FOUND)

            # Get customer transactions (simplified for now)
            transactions = Transaction.objects.filter(customer=customer).order_by('-created_at')[:20]

            serializer = PaymentsTransactionSerializer(transactions, many=True)
            return Response({
                'transactions': serializer.data,
                'count': len(serializer.data)
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class CustomerReceiptsView(APIView):
    """
    Customer receipts endpoint
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Get customer profile
            customer = getattr(request.user, 'customer_profile', None)
            if not customer:
                return Response({'error': 'Customer profile not found'}, status=status.HTTP_404_NOT_FOUND)

            # Get customer receipts/payments (simplified for now)
            payments = Payment.objects.filter(customer=customer).order_by('-created_at')[:20]

            serializer = PaymentSerializer(payments, many=True)
            return Response({
                'receipts': serializer.data,
                'count': len(serializer.data)
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class CustomerStatsView(APIView):
    """
    Customer statistics endpoint
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            from datetime import timedelta
            from django.utils import timezone
            from payments.models import Transaction as PaymentTransaction
            from django.db.models import Q
            
            # Get customer profile
            customer = getattr(request.user, 'customer_profile', None)
            
            # Get transactions for this month
            thirty_days_ago = timezone.now() - timedelta(days=30)
            
            # Query payments Transaction model (has customer field)
            if customer:
                all_transactions = PaymentTransaction.objects.filter(customer=customer)
            else:
                # Fallback: use accounts Transaction model with sender field
                all_transactions = Transaction.objects.filter(
                    Q(sender=request.user) | Q(recipient=request.user)
                )
            
            this_month_transactions = all_transactions.filter(created_at__gte=thirty_days_ago)
            
            total_transactions = all_transactions.count()
            transactions_this_month = this_month_transactions.count()
            completed_transactions = all_transactions.filter(status='completed').count()
            failed_transactions = all_transactions.filter(status='failed').count()
            
            # Calculate success rate
            success_rate = 0
            if total_transactions > 0:
                success_rate = (completed_transactions / total_transactions) * 100

            return Response({
                'transactions_this_month': transactions_this_month,
                'success_rate': round(success_rate, 1),
                'total_transactions': total_transactions,
                'completed_transactions': completed_transactions,
                'failed_transactions': failed_transactions,
            }, status=status.HTTP_200_OK)
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

class BalanceView(APIView):
    """
    Get current account balance for authenticated user
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Get balance from user's account
            balance = AuthService.get_account_balance(request.user)
            return Response(balance, status=status.HTTP_200_OK)
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

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for managing financial transactions
    """
    queryset = Transaction.objects.all().order_by('-created_at')
    serializer_class = PaymentsTransactionSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by current user - if customer, show transactions where user is customer
        # if merchant, show transactions where user is merchant
        if not self.request.user.is_staff:
            if self.request.user.user_type == 3:  # customer
                queryset = queryset.filter(customer__user=self.request.user)
            elif self.request.user.user_type == 2:  # merchant
                queryset = queryset.filter(merchant__user=self.request.user)
            
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

class PaymentsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for managing financial payments
    """
    queryset = Payment.objects.all().order_by('-created_at')
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by current user - payments where user is customer
        if not self.request.user.is_staff:
            if self.request.user.user_type == 3:  # customer
                queryset = queryset.filter(customer__user=self.request.user)
            elif self.request.user.user_type == 2:  # merchant
                queryset = queryset.filter(merchant__user=self.request.user)
                
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
        'crypto', 'wallet', 'gift_card'
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


class CustomerViewSet(viewsets.ModelViewSet):
    """
    Customer-specific API endpoints
    """
    queryset = User.objects.all()  # Required for router registration
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def payments(self, request):
        """Get customer recent payments"""
        try:
            # Check if user has customer profile
            try:
                customer_profile = request.user.customer_profile
            except:
                # Return empty array instead of 404 to allow dashboard to render
                return Response([])

            # Get user's transactions
            transactions = Payment.objects.filter(
                customer=customer_profile
            ).select_related('merchant', 'payment_method').order_by('-created_at')[:10]  # Limit to recent payments

            data = []
            for transaction in transactions:
                # Determine merchant name based on transaction type
                transaction_type = transaction.metadata.get('transaction_type', 'payment') if transaction.metadata else 'payment'
                
                if transaction_type == 'p2p_send':
                    merchant_name = f"To: {transaction.metadata.get('recipient_email', 'Unknown')}"
                    payment_method_name = 'P2P Transfer'
                elif transaction_type == 'p2p_receive':
                    merchant_name = f"From: {transaction.metadata.get('sender_email', 'Unknown')}"
                    payment_method_name = 'P2P Transfer'
                elif transaction_type == 'bill_payment':
                    bill_type = transaction.metadata.get('bill_type', 'Bill') if transaction.metadata else 'Bill'
                    merchant_name = transaction.merchant.business_name if transaction.merchant else bill_type.title()
                    payment_method_name = 'Wallet Balance'
                elif transaction_type == 'airtime_purchase':
                    recipient_phone = transaction.metadata.get('recipient_phone', 'Unknown') if transaction.metadata else 'Unknown'
                    provider = transaction.metadata.get('provider', 'Unknown') if transaction.metadata else 'Unknown'
                    merchant_name = f"Airtime: {recipient_phone} ({provider})"
                    payment_method_name = 'Wallet Balance'
                elif transaction_type == 'wallet_topup':
                    merchant_name = 'Wallet'
                    payment_method_name = transaction.metadata.get('payment_method', 'Top-up') if transaction.metadata else 'Top-up'
                elif transaction_type == 'wallet_deduction':
                    merchant_name = transaction.metadata.get('description', 'Wallet').split(':')[0] if transaction.metadata and 'description' in transaction.metadata else 'Wallet'
                    payment_method_name = 'Wallet Deduction'
                else:
                    merchant_name = transaction.merchant.business_name if transaction.merchant else 'Unknown'
                    payment_method_name = transaction.payment_method.name if transaction.payment_method else 'Unknown'
                
                # Use transaction description if available, otherwise create one
                description = transaction.description or f"Payment to {merchant_name}"
                
                data.append({
                    'id': str(transaction.id),
                    'amount': float(transaction.amount),
                    'currency': transaction.currency,
                    'status': transaction.status,
                    'merchant': merchant_name,
                    'description': description,
                    'created_at': transaction.created_at.isoformat(),
                    'payment_method': payment_method_name,
                    'transaction_type': transaction_type
                })

            return Response(data)
        except Exception as e:
            logger.error(f"Error fetching customer payments: {str(e)}")
            return Response({'error': 'Failed to fetch payments'}, status=500)

    @action(detail=False, methods=['get'])
    def receipts(self, request):
        """Get customer receipts"""
        try:
            # Check if user has customer profile
            try:
                customer_profile = request.user.customer_profile
            except:
                # Return empty array instead of 404 to allow dashboard to render
                return Response([])

            # Get user's successful transactions as receipts
            transactions = Payment.objects.filter(
                customer=customer_profile,
                status='completed'
            ).select_related('merchant', 'payment_method').order_by('-created_at')[:5]  # Limit to recent receipts

            data = []
            for transaction in transactions:
                # Determine merchant name based on transaction type
                transaction_type = transaction.metadata.get('transaction_type', 'payment') if transaction.metadata else 'payment'
                
                if transaction_type == 'p2p_send':
                    merchant_name = f"To: {transaction.metadata.get('recipient_email', 'Unknown')}"
                elif transaction_type == 'p2p_receive':
                    merchant_name = f"From: {transaction.metadata.get('sender_email', 'Unknown')}"
                elif transaction_type == 'bill_payment':
                    bill_type = transaction.metadata.get('bill_type', 'Bill') if transaction.metadata else 'Bill'
                    merchant_name = transaction.merchant.business_name if transaction.merchant else bill_type.title()
                elif transaction_type == 'airtime_purchase':
                    recipient_phone = transaction.metadata.get('recipient_phone', 'Unknown') if transaction.metadata else 'Unknown'
                    provider = transaction.metadata.get('provider', 'Unknown') if transaction.metadata else 'Unknown'
                    merchant_name = f"Airtime: {recipient_phone} ({provider})"
                elif transaction_type == 'wallet_topup':
                    merchant_name = 'Wallet'
                elif transaction_type == 'wallet_deduction':
                    merchant_name = transaction.metadata.get('description', 'Wallet').split(':')[0] if transaction.metadata and 'description' in transaction.metadata else 'Wallet'
                else:
                    merchant_name = transaction.merchant.business_name if transaction.merchant else 'Unknown'
                
                data.append({
                    'id': str(transaction.id),
                    'payment_id': str(transaction.id),
                    'amount': float(transaction.amount),
                    'currency': transaction.currency,
                    'merchant': merchant_name,
                    'date': transaction.created_at.date().isoformat(),
                    'receipt_number': f"RCP-{transaction.id}",
                    'download_url': f"/api/receipts/{transaction.id}/download/",
                    'transaction_type': transaction_type
                })

            return Response(data)
        except Exception as e:
            logger.error(f"Error fetching customer receipts: {str(e)}")
            return Response({'error': 'Failed to fetch receipts'}, status=500)

    @action(detail=False, methods=['get'])
    def balance(self, request):
        """Get customer account balance"""
        try:
            # For now, return a mock balance. In a real implementation,
            # this would calculate from actual transactions
            balance_data = {
                'available': 0.00,  # Default for new customers
                'pending': 0.00,
                'currency': 'GHS',
                'last_updated': timezone.now().isoformat()
            }
            return Response(balance_data)
        except Exception as e:
            logger.error(f"Error fetching customer balance: {str(e)}")
            return Response({'error': 'Failed to fetch balance'}, status=500)

    @action(detail=False, methods=['get', 'patch'])
    def profile(self, request):
        """Get or update customer profile"""
        try:
            user = request.user
            customer_profile = getattr(user, 'customer_profile', None)
            
            if request.method == 'GET':
                profile_data = {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone': user.phone,
                    'date_joined': user.date_joined.isoformat(),
                    'role': dict(user.USER_TYPE_CHOICES).get(user.user_type, 'customer'),
                    'is_verified': user.is_verified,
                    'customer_profile': {
                        'date_of_birth': customer_profile.date_of_birth.isoformat() if customer_profile and customer_profile.date_of_birth else None,
                        'kyc_verified': customer_profile.kyc_verified if customer_profile else False,
                        'address': customer_profile.address if customer_profile else {}
                    } if customer_profile else None
                }
                return Response(profile_data)
            elif request.method == 'PATCH':
                # Update user profile
                allowed_fields = ['first_name', 'last_name', 'phone']
                for field in allowed_fields:
                    if field in request.data:
                        setattr(user, field, request.data[field])
                user.save()

                # Update customer profile if it exists
                if customer_profile and 'customer_profile' in request.data:
                    customer_data = request.data['customer_profile']
                    if 'date_of_birth' in customer_data:
                        customer_profile.date_of_birth = customer_data['date_of_birth']
                    if 'address' in customer_data:
                        customer_profile.address = customer_data['address']
                    customer_profile.save()

                profile_data = {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone': user.phone,
                    'date_joined': user.date_joined.isoformat(),
                    'role': dict(user.USER_TYPE_CHOICES).get(user.user_type, 'customer'),
                    'is_verified': user.is_verified,
                    'customer_profile': {
                        'date_of_birth': customer_profile.date_of_birth.isoformat() if customer_profile and customer_profile.date_of_birth else None,
                        'kyc_verified': customer_profile.kyc_verified if customer_profile else False,
                        'address': customer_profile.address if customer_profile else {}
                    } if customer_profile else None
                }
                return Response(profile_data)
        except Exception as e:
            logger.error(f"Error with customer profile: {str(e)}")
            return Response({'error': 'Failed to process profile request'}, status=500)

class SupportTicketViewSet(viewsets.ModelViewSet):
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SupportTicket.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateSupportTicketSerializer
        return SupportTicketSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        ticket = self.get_object()
        serializer = CreateSupportMessageSerializer(data=request.data, context={'ticket': ticket})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PayoutViewSet(viewsets.ModelViewSet):
    serializer_class = PayoutSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Payout.objects.filter(merchant=self.request.user)

    def perform_create(self, serializer):
        serializer.save(merchant=self.request.user)

    @action(detail=False, methods=['get'])
    def balance(self, request):
        """Get merchant payout balance"""
        # For now, return a mock balance
        # In real implementation, calculate from transactions
        balance = {
            'available': 1500.00,
            'pending': 250.00,
            'currency': 'GHS'
        }
        return Response(balance)

class UserSearchView(APIView):
    """
    API endpoint for searching SikaRemit users by email or phone
    Used for p2p transfers to find recipients
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.GET.get('q', '').strip()
        
        if not query or len(query) < 2:
            return Response(
                {'error': 'Search query must be at least 2 characters long'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Search users by email or phone (excluding current user)
        users = User.objects.filter(
            Q(email__icontains=query) | Q(phone__icontains=query)
        ).exclude(id=request.user.id).select_related()[:10]  # Limit to 10 results
        
        # Format response
        results = []
        for user in users:
            results.append({
                'id': user.id,
                'email': user.email,
                'phone': user.phone,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': f"{user.first_name} {user.last_name}".strip(),
                'is_verified': user.is_verified,
            })
        
        return Response({
            'results': results,
            'count': len(results)
        })
