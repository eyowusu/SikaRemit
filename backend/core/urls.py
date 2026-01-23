from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from accounts.views import MyTokenObtainPairView
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

def simple_health_check(request):
    return JsonResponse({'status': 'healthy', 'message': 'Backend is running'})

@method_decorator(csrf_exempt, name='dispatch')
class SimpleCurrenciesView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            currencies = [
                {'code': 'GHS', 'name': 'Ghana Cedi', 'symbol': '₵'},
                {'code': 'USD', 'name': 'US Dollar', 'symbol': '$'},
                {'code': 'EUR', 'name': 'Euro', 'symbol': '€'},
                {'code': 'GBP', 'name': 'British Pound', 'symbol': '£'}
            ]
            return JsonResponse({
                'success': True,
                'data': currencies,
                'results': currencies  # For frontend compatibility
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e),
                'results': []
            }, status=500)

urlpatterns = [
    # Root and Admin
    path('', RedirectView.as_view(url='/api/docs/'), name='home'),
    path('admin/', admin.site.urls),
    
    # Health Check
    path('health/', simple_health_check, name='health-check'),
    path('api/v1/health/', simple_health_check, name='api-health-check'),
    
    # Simple API endpoints (keep login at root level for compatibility)
    path('api/v1/accounts/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/accounts/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Accounts API (includes customers, support tickets, etc.)
    path('api/v1/accounts/', include('accounts.urls')),
    
    # Payments API
    path('api/v1/payments/', include('payments.urls')),

    # Notifications API
    path('api/v1/notifications/', include('notifications.urls')),

    # Merchants API
    path('api/v1/merchants/', include('merchants.urls')),
    
    # KYC API
    path('api/v1/kyc/', include('kyc.urls')),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(permission_classes=[]), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Authentication (allauth)
    path('accounts/', include('allauth.urls')),
]

# Serve static files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
