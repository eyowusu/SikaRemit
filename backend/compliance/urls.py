from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import RegulatorySubmissionViewSet

router = DefaultRouter()
router.register(r'regulatory-submissions', RegulatorySubmissionViewSet)

urlpatterns = [
    # Add any existing paths here
] + router.urls
