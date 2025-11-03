from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardStatsView, BusinessSummaryView, SalesTrendsView, DashboardStatsViewSet,
    AdminStatsView, RecentActivityView, SystemHealthView
)
from .api.views import MetricsAPIView

router = DefaultRouter()
router.register(r'stats', DashboardStatsViewSet)

urlpatterns = [
    path('metrics/', MetricsAPIView.as_view(), name='dashboard-metrics'),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('business-summary/', BusinessSummaryView.as_view(), name='business-summary'),
    path('sales-trends/', SalesTrendsView.as_view(), name='sales-trends'),
    path('admin-stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('recent-activity/', RecentActivityView.as_view(), name='recent-activity'),
    path('system-health/', SystemHealthView.as_view(), name='system-health'),
    path('', include(router.urls)),
]
