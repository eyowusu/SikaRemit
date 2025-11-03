from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, MerchantViewSet, CustomerViewSet, KYCDocumentViewSet, KYCViewSet
from . import views

router = DefaultRouter()
router.register(r'', UserViewSet, basename='users')
router.register(r'merchants', MerchantViewSet, basename='merchants')
router.register(r'customers', CustomerViewSet, basename='customers')
router.register(r'kyc-documents', KYCDocumentViewSet, basename='kyc-documents')
router.register(r'kyc', KYCViewSet, basename='kyc')

urlpatterns = [
    path('me/', UserViewSet.as_view({'get': 'me'}), name='user-me'),
    path('verify-email/<uuid:token>/', views.verify_email, name='verify-email'),
    path('customers/<int:pk>/verify-biometrics/', CustomerViewSet.as_view({'post': 'verify_biometrics'}), name='verify-biometrics'),
    path('customers/<int:pk>/check-liveness/', CustomerViewSet.as_view({'post': 'check_liveness'}), name='check-liveness'),
] + router.urls
