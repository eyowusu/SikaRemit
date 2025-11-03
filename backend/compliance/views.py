from rest_framework import viewsets
from .models import RegulatorySubmission
from .serializers import RegulatorySubmissionSerializer
from rest_framework.permissions import IsAuthenticated

class RegulatorySubmissionViewSet(viewsets.ModelViewSet):
    queryset = RegulatorySubmission.objects.all()
    serializer_class = RegulatorySubmissionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by user if not admin
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
            
        # Filter by success status if specified
        success = self.request.query_params.get('success')
        if success:
            queryset = queryset.filter(success=success.lower() == 'true')
            
        return queryset.order_by('-submitted_at')
