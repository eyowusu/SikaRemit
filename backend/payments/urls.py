from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentMethodViewSet, TransactionViewSet, AdminTransactionViewSet, process_payment, verify_mobile_payment, USSDCallbackView, USSDTransactionViewSet, PaymentViewSet, ScheduledPayoutViewSet, CrossBorderRemittanceViewSet, VerificationViewSet, P2PPaymentView
from . import webhooks, reporting

router = DefaultRouter()
router.register(r'payment-methods', PaymentMethodViewSet, basename='payment-methods')
router.register(r'transactions', TransactionViewSet, basename='transactions')
router.register(r'admin/transactions', AdminTransactionViewSet, basename='admin-transactions')
router.register(r'ussd-transactions', USSDTransactionViewSet, basename='ussd-transactions')
router.register(r'payments', PaymentViewSet, basename='payments')
router.register(r'scheduled-payouts', ScheduledPayoutViewSet, basename='scheduled-payouts')
router.register(r'cross-border', CrossBorderRemittanceViewSet, basename='cross-border')
router.register(r'cross-border/remittances', CrossBorderRemittanceViewSet, basename='cross-border-remittances')

urlpatterns = [
    path('', include(router.urls)),
    
    # P2P Payment endpoint
    path('send/', P2PPaymentView.as_view(), name='p2p_payment'),
    
    # Dashboard
    path('verification/dashboard/', 
        VerificationViewSet.as_view({'get': 'analytics'}), 
        name='verification-dashboard'),
    
    # Analytics endpoints
    path('verification/analytics/', 
        VerificationViewSet.as_view({'get': 'analytics'}), 
        name='verification-analytics'),
    path('verification/stats/', 
        VerificationViewSet.as_view({'get': 'provider_stats'}), 
        name='verification-stats'),
    
    # Verification endpoints
    path('verify/phone/', 
        VerificationViewSet.as_view({'post': 'verify_phone'}), 
        name='verify-phone'),
    path('verify/funds/', 
        VerificationViewSet.as_view({'post': 'verify_funds'}), 
        name='verify-funds'),
    path('verify/providers/', 
        VerificationViewSet.as_view({'get': 'available_providers'}), 
        name='verification-providers'),
    path('verify/test/', 
        VerificationViewSet.as_view({'post': 'test_provider'}), 
        name='test-verification'),
    
    path('process/', process_payment, name='process_payment'),
    path('webhooks/bank-transfer/', webhooks.bank_transfer_webhook, name='bank_transfer_webhook'),
    path('webhooks/mobile-money/', webhooks.mobile_money_webhook, name='mobile_money_webhook'),
    path('verify-mobile/', verify_mobile_payment, name='verify_mobile_payment'),
    path('reports/', reporting.custom_report_view, name='payment-reports'),
    path('ussd/callback/', USSDCallbackView.as_view(), name='ussd_callback'),
    
    # Bill payment endpoints
    path('bill-payments/', 
        TransactionViewSet.as_view({'post': 'process_bill_payment'}), 
        name='process-bill-payment'),
    path('bill-payments/pending/', 
        TransactionViewSet.as_view({'get': 'pending_bills'}), 
        name='pending-bills'),
    path('bill-payments/<int:pk>/add-late-fee/', 
        TransactionViewSet.as_view({'post': 'add_late_fee'}), 
        name='add-late-fee'),
    # path('remittance-report/', 
    #     TransactionViewSet.as_view({'get': 'remittance_report'}), 
    #     name='remittance-report'),
    # path('remittance-report/detailed/', 
    #     TransactionViewSet.as_view({'get': 'detailed_remittance_report'}), 
    #     name='detailed-remittance-report'),
    path('cross-border/initiate/', 
        CrossBorderRemittanceViewSet.as_view({'post': 'initiate_transfer'}), 
        name='initiate-cross-border-transfer'),
    # path('cross-border/remittances/', 
    #     CrossBorderRemittanceViewSet.as_view({'get': 'list_remittances'}), 
    #     name='list-cross-border-remittances'),
    # path('cross-border/remittances/<int:pk>/', 
    #     CrossBorderRemittanceViewSet.as_view({'get': 'retrieve_remittance'}), 
    #     name='retrieve-cross-border-remittance'),
    # path('cross-border/remittances/<int:pk>/cancel/', 
    #     CrossBorderRemittanceViewSet.as_view({'post': 'cancel_remittance'}), 
    #     name='cancel-cross-border-remittance'),
    path('cross-border/<int:pk>/request-exemption/', 
        CrossBorderRemittanceViewSet.as_view({'post': 'request_exemption'}), 
        name='request-exemption'),
    path('cross-border/<int:pk>/approve-exemption/', 
        CrossBorderRemittanceViewSet.as_view({'post': 'approve_exemption'}),
        name='approve-exemption'),
    path('cross-border/<int:pk>/reject-exemption/', 
        CrossBorderRemittanceViewSet.as_view({'post': 'reject_exemption'}),
        name='reject-exemption'),
]
