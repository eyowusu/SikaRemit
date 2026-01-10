from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from django.views.decorators.csrf import csrf_exempt
from rest_framework.routers import DefaultRouter
from .views import (
    UserLoginView, UserRegisterView, UserLogoutView, PasswordResetView,
    PasswordResetConfirmView, EmailVerificationView, EmailVerificationConfirmView,
    MFASetupView, MFALoginView, MFABackupCodesView, GoogleOAuthCallbackView,
    PasswordChangeView, ProfileView, CustomerViewSet, CustomerStatsView,
    AdminUserCreateView, AdminUserViewSet, SupportTicketViewSet, PayoutViewSet, UserSearchView
)
from .api.views import RecipientViewSet

# Create router for support tickets
support_router = DefaultRouter()
support_router.register(r'support-tickets', SupportTicketViewSet, basename='support-tickets')

# Create router for payouts
payout_router = DefaultRouter()
payout_router.register(r'payouts', PayoutViewSet, basename='payouts')

urlpatterns = [
    path('login/', csrf_exempt(UserLoginView.as_view()), name='login'),
    path('register/', UserRegisterView.as_view(), name='register'),
    path('logout/', UserLogoutView.as_view(), name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('password/reset/', PasswordResetView.as_view(), name='password_reset'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password/change/', PasswordChangeView.as_view(), name='password_change'),
    path('verify-email/', EmailVerificationConfirmView.as_view(), name='verify_email_confirm'),
    path('resend-verification/', EmailVerificationView.as_view(), name='resend_verification'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('2fa/setup/', MFASetupView.as_view(), name='mfa_setup'),
    path('mfa/verify/', MFALoginView.as_view(), name='mfa_verify'),
    path('mfa/backup-codes/', MFABackupCodesView.as_view(), name='mfa_backup_codes'),
    path('google/callback/', GoogleOAuthCallbackView.as_view(), name='google_callback'),
    path('customers/balance/', CustomerViewSet.as_view({'get': 'balance'}), name='customer_balance'),
    path('customers/payments/', CustomerViewSet.as_view({'get': 'payments'}), name='customer_payments'),
    path('customers/receipts/', CustomerViewSet.as_view({'get': 'receipts'}), name='customer_receipts'),
    path('customers/stats/', CustomerStatsView.as_view(), name='customer_stats'),
    path('customers/profile/', ProfileView.as_view(), name='customer_profile'),
    path('customers/recipients/', RecipientViewSet.as_view({'get': 'list'}), name='customer_recipients'),
    path('users/search/', UserSearchView.as_view(), name='user_search'),
    path('customers/', include(support_router.urls)),
    path('merchant/', include(payout_router.urls)),
    path('admin/users/', AdminUserViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='admin_users'),
    path('admin/users/<int:pk>/', AdminUserViewSet.as_view({
        'get': 'retrieve',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='admin_users_detail'),
]
