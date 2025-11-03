from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from ..models import Payout
from ..serializers import PayoutSerializer
from django.utils import timezone

class MerchantPayoutsAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        payouts = Payout.objects.filter(status='pending').select_related('merchant')
        serializer = PayoutSerializer(payouts, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = PayoutSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProcessPayoutAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request, payout_id):
        try:
            payout = Payout.objects.get(pk=payout_id, status='pending')
            # TODO: Integrate with actual payout processor
            payout.status = 'processing'
            payout.save()
            
            # Simulate processing completion
            payout.status = 'completed'
            payout.processed_at = timezone.now()
            payout.save()
            
            return Response({'status': 'completed'})
        except Payout.DoesNotExist:
            return Response({'error': 'Payout not found'}, status=404)
