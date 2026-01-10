from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from .views import HealthCheckView, AdminMetricsView, AdminSettingsViewSet, CountryViewSet
from .api.views import AuditLogAPIView
from . import views
from payments.admin import payments_admin
from dashboard.urls import router as dashboard_router
from dashboard.views import FeeConfigurationViewSet
from accounts.admin_reports import AdminReportViewSet, generate_admin_report, get_admin_report_stats
from payments.views.webhook_views import WebhookViewSet, WebhookEventViewSet

urlpatterns = [
    # Root and Admin
    path('', RedirectView.as_view(url='/api/docs/'), name='home'),
    path('admin/', admin.site.urls),
    path('payments-admin/', payments_admin.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(permission_classes=[]), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Health Check
    path('health/', HealthCheckView.as_view(), name='health-check'),
    
    # Authentication (allauth)
    path('accounts/', include('allauth.urls')),
    
    # API v1 Routes - Standardized
    path('api/v1/accounts/', include('accounts.urls')),
    path('api/v1/users/', include('users.urls')),
    path('api/v1/merchants/', include('merchants.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
    path('api/v1/kyc/', include('kyc.urls')),
    path('api/v1/invoices/', include('invoice.urls')),
    
    # Payments API v1
    path('api/v1/payments/', include('payments.urls')),
    
    # Dashboard routes
    path('api/v1/dashboard/', include('dashboard.urls')),
    
    # Admin routes - consolidated under api/v1/admin/
    path('api/v1/admin/merchants/', include('merchants.admin_urls')),
    path('api/v1/admin/ussd/', include('ussd.urls')),
    path('api/v1/admin/audit-logs/', AuditLogAPIView.as_view(), name='audit-logs'),
    path('api/v1/admin/metrics/', AdminMetricsView.as_view(), name='admin-metrics'),
    path('api/v1/admin/settings/', AdminSettingsViewSet.as_view({'get': 'list', 'patch': 'partial_update'}), name='admin-settings'),
    path('api/v1/admin/settings/general/', AdminSettingsViewSet.as_view({'get': 'general', 'patch': 'general'}), name='admin-settings-general'),
    path('api/v1/admin/settings/security/', AdminSettingsViewSet.as_view({'get': 'security', 'patch': 'security'}), name='admin-settings-security'),
    path('api/v1/admin/settings/api/', AdminSettingsViewSet.as_view({'get': 'api', 'patch': 'api'}), name='admin-settings-api'),
    path('api/v1/admin/settings/notifications/', AdminSettingsViewSet.as_view({'get': 'notifications', 'patch': 'notifications'}), name='admin-settings-notifications'),
    path('api/v1/admin/settings/maintenance/', AdminSettingsViewSet.as_view({'get': 'maintenance', 'patch': 'maintenance'}), name='admin-settings-maintenance'),
    path('api/v1/admin/fee-configurations/analytics/', FeeConfigurationViewSet.as_view({'get': 'analytics'}), name='admin-fee-analytics'),
    path('api/v1/admin/fee-configurations/', FeeConfigurationViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin-fee-configurations'),
    path('api/v1/admin/fee-configurations/<int:pk>/', FeeConfigurationViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='admin-fee-configurations-detail'),
    
    # Admin Reports
    path('api/v1/admin/reports/', AdminReportViewSet.as_view({'get': 'list'}), name='admin-reports'),
    path('api/v1/admin/reports/generate/', generate_admin_report, name='admin-reports-generate'),
    path('api/v1/admin/reports/stats/', get_admin_report_stats, name='admin-reports-stats'),
    path('api/v1/admin/reports/<int:pk>/', AdminReportViewSet.as_view({'get': 'retrieve', 'delete': 'destroy'}), name='admin-reports-detail'),
    path('api/v1/admin/reports/<int:pk>/download/', AdminReportViewSet.as_view({'get': 'retrieve'}), name='admin-reports-download'),
    
    # Admin Webhooks
    path('api/v1/admin/webhooks/', WebhookViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin-webhooks'),
    path('api/v1/admin/webhooks/stats/', WebhookViewSet.as_view({'get': 'stats'}), name='admin-webhooks-stats'),
    path('api/v1/admin/webhooks/<int:pk>/', WebhookViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'}), name='admin-webhooks-detail'),
    path('api/v1/admin/webhooks/<int:pk>/test/', WebhookViewSet.as_view({'post': 'test'}), name='admin-webhooks-test'),
    path('api/v1/admin/webhooks/<int:pk>/events/', WebhookViewSet.as_view({'get': 'events'}), name='admin-webhooks-events'),
    path('api/v1/admin/webhook-events/', WebhookEventViewSet.as_view({'get': 'list'}), name='admin-webhook-events'),
    path('api/v1/admin/webhook-events/<int:pk>/', WebhookEventViewSet.as_view({'get': 'retrieve'}), name='admin-webhook-events-detail'),
    path('api/v1/admin/webhook-events/<int:pk>/retry/', WebhookEventViewSet.as_view({'post': 'retry'}), name='admin-webhook-events-retry'),
    
    # Public routes
    path('api/v1/countries/', CountryViewSet.as_view({'get': 'list'}), name='countries'),
    
    # Legacy routes (for backwards compatibility) - will be deprecated
    path('api/users/', include('users.urls')),
    path('api/merchants/', include('merchants.urls')),
    path('api/kyc/', include('kyc.urls')),
    path('api/invoices/', include('invoice.urls')),
    path('api/audit-logs/', AuditLogAPIView.as_view(), name='audit-logs-legacy'),
    path('api/admin/metrics/', AdminMetricsView.as_view(), name='admin-metrics-legacy'),
    path('api/admin/settings/', AdminSettingsViewSet.as_view({'get': 'list', 'patch': 'partial_update'}), name='admin-settings-legacy'),
    path('api/admin/settings/general/', AdminSettingsViewSet.as_view({'get': 'general', 'patch': 'general'}), name='admin-settings-general-legacy'),
    path('api/admin/settings/security/', AdminSettingsViewSet.as_view({'get': 'security', 'patch': 'security'}), name='admin-settings-security-legacy'),
    path('api/admin/settings/api/', AdminSettingsViewSet.as_view({'get': 'api', 'patch': 'api'}), name='admin-settings-api-legacy'),
    path('api/admin/settings/notifications/', AdminSettingsViewSet.as_view({'get': 'notifications', 'patch': 'notifications'}), name='admin-settings-notifications-legacy'),
    path('api/admin/settings/maintenance/', AdminSettingsViewSet.as_view({'get': 'maintenance', 'patch': 'maintenance'}), name='admin-settings-maintenance-legacy'),
    path('api/admin/reports/', AdminReportViewSet.as_view({'get': 'list'}), name='admin-reports-legacy'),
    path('api/admin/reports/generate/', generate_admin_report, name='admin-reports-generate-legacy'),
    path('api/admin/reports/stats/', get_admin_report_stats, name='admin-reports-stats-legacy'),
    path('api/admin/reports/<int:pk>/', AdminReportViewSet.as_view({'get': 'retrieve', 'delete': 'destroy'}), name='admin-reports-detail-legacy'),
    path('api/admin/reports/<int:pk>/download/', AdminReportViewSet.as_view({'get': 'retrieve'}), name='admin-reports-download-legacy'),
    path('api/countries/', CountryViewSet.as_view({'get': 'list'}), name='countries-legacy'),
    # Fee configurations - must come before dashboard includes
    path('api/admin/fee-configurations/', FeeConfigurationViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin-fee-configurations-legacy'),
    path('api/admin/fee-configurations/<int:pk>/', FeeConfigurationViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='admin-fee-configurations-detail-legacy'),
    # Dashboard includes (after specific routes)
    path('api/dashboard/', include('dashboard.urls')),
    path('api/admin/dashboard/', include('dashboard.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
