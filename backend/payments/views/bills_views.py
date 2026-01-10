from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from ..models import Bill, PaymentMethod
from ..serializers.bills import BillSerializer, CreateBillSerializer, AddLateFeeSerializer, PayBillSerializer
from ..services import PaymentService

class BillViewSet(viewsets.ModelViewSet):
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Bill.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateBillSerializer
        return BillSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending bills for the user"""
        bills = self.get_queryset().filter(status='pending')
        serializer = self.get_serializer(bills, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def late_fee(self, request, pk=None):
        """Add late fee to a bill"""
        bill = self.get_object()
        serializer = AddLateFeeSerializer(data=request.data)
        
        if serializer.is_valid():
            late_fee_amount = serializer.validated_data['amount']
            bill.late_fee += late_fee_amount
            bill.save()
            
            bill_serializer = self.get_serializer(bill)
            return Response(bill_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        """Pay a bill using a payment method"""
        bill = self.get_object()
        serializer = PayBillSerializer(data=request.data)
        
        if serializer.is_valid():
            payment_method_id = serializer.validated_data['payment_method_id']
            
            try:
                payment_method = PaymentMethod.objects.get(
                    id=payment_method_id,
                    user=request.user
                )
            except PaymentMethod.DoesNotExist:
                return Response(
                    {'error': 'Payment method not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Calculate total amount including late fee
            total_amount = bill.amount + bill.late_fee
            
            # Process payment
            try:
                payment_result = PaymentService.process_bill_payment(
                    bill=bill,
                    payment_method=payment_method,
                    amount=total_amount
                )
                
                if payment_result['success']:
                    bill.status = 'paid'
                    bill.payment_method = payment_method
                    bill.paid_at = timezone.now()
                    bill.transaction_id = payment_result.get('transaction_id')
                    bill.save()
                    
                    bill_serializer = self.get_serializer(bill)
                    return Response(bill_serializer.data)
                else:
                    return Response(
                        {'error': payment_result.get('error', 'Payment failed')}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
            except Exception as e:
                return Response(
                    {'error': str(e)}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
