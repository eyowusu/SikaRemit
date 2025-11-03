from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import StoreViewSet, ProductViewSet, onboarding_status, upload_verification, MerchantDashboardViewSet

router = DefaultRouter()
router.register(r'stores', StoreViewSet, basename='stores')
router.register(r'products', ProductViewSet, basename='products')
router.register(r'dashboard', MerchantDashboardViewSet, basename='merchant-dashboard')

urlpatterns = [
    path('onboarding/', onboarding_status, name='onboarding-status'),
    path('onboarding/verify/', upload_verification, name='upload-verification'),
] + router.urls
