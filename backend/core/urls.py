from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
import json

def simple_health_check(request):
    return JsonResponse({'status': 'healthy', 'message': 'Backend is running'})

@method_decorator(csrf_exempt, name='dispatch')
class SimpleLoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
            
            # Simple mock login for testing
            if email == 'customer@test.com' and password == 'TestPassword123':
                return JsonResponse({
                    'status': 'success',
                    'message': 'Login successful',
                    'user': {
                        'id': 1,
                        'email': 'customer@test.com',
                        'first_name': 'Test',
                        'last_name': 'Customer',
                        'is_verified': True
                    },
                    'tokens': {
                        'access': 'mock-access-token',
                        'refresh': 'mock-refresh-token'
                    }
                })
            else:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Invalid credentials'
                }, status=401)
                
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=400)

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
    
    # Simple API endpoints
    path('api/v1/accounts/login/', SimpleLoginView.as_view(), name='login'),
    
    # Payments API
    path('api/v1/payments/', include('payments.urls')),
    
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
