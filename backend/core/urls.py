from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from .views import HealthCheckView, TenantTestView, TestErrorView, AuthTestView, AdminMetricsView
from .api.views import AuditLogAPIView
from . import views
from payments.admin import payments_admin

urlpatterns = [
    path('', RedirectView.as_view(url='/api/docs/'), name='home'),
    path('admin/', admin.site.urls),
    path('payments-admin/', payments_admin.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('tenant-test/', TenantTestView.as_view(), name='tenant-test'),
    path('test-error/', TestErrorView.as_view(), name='test-error'),
    path('test-auth/', AuthTestView.as_view(), name='test-auth'),
    path('api/v1/accounts/', include('accounts.urls')),  
    path('api/users/', include('users.urls')),
    path('api/merchants/', include('merchants.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/audit-logs/', AuditLogAPIView.as_view(), name='audit-logs'),
    path('api/admin/metrics/', AdminMetricsView.as_view(), name='admin-metrics'),
    path('api/core/audit-logs/', AuditLogAPIView.as_view(), name='audit-logs'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
