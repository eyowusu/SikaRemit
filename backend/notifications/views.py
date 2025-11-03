from core.response import APIResponse
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from .models import Notification
from .serializers import NotificationSerializer
from .services import NotificationService  # Assuming NotificationService is in .services module
from django.db import models

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return APIResponse(serializer.data)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        if NotificationService.mark_as_read(pk):
            return APIResponse({"status": "marked as read"})
        return APIResponse({"error": "Notification not found"}, status=404)

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        user_notifications = self.get_queryset()
        
        metrics = {
            'total': user_notifications.count(),
            'read': user_notifications.filter(is_read=True).count(),
            'delivery_success_rate': user_notifications.filter(
                delivery_metrics__has_key='delivered_at'
            ).count() / max(1, user_notifications.count()),
            'categories': dict(user_notifications.values_list('category').annotate(
                count=models.Count('id')
            ))
        }
        
        return APIResponse(metrics)
