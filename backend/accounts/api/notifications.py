from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from ..models import Notification
from accounts.serializers import NotificationSerializer

class NotificationAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)
    
    def post(self, request, pk=None):
        if pk:  # Mark as read
            notification = Notification.objects.get(pk=pk, user=request.user)
            notification.mark_as_read()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(status=status.HTTP_400_BAD_REQUEST)
