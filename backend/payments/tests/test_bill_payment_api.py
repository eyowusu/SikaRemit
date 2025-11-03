from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from ..models import Payment
from accounts.models import Customer

User = get_user_model()

class BillPaymentAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        cls.customer = Customer.objects.create(
            user=cls.user,
            phone_number='233123456789'
        )
        
        # Create test payment
        cls.payment = Payment.objects.create(
            customer=cls.customer,
            amount=150.00,
            bill_reference='BILL-001',
            bill_type='utility'
        )
    
    def setUp(self):
        self.client.force_authenticate(user=self.user)
    
    def test_process_bill_payment(self):
        """Test creating a new bill payment"""
        url = reverse('process-bill-payment')
        data = {
            'bill_reference': 'BILL-002',
            'bill_type': 'tax',
            'amount': 200.00,
            'bill_issuer': 'Tax Authority'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Payment.objects.count(), 2)
    
    def test_pending_bills(self):
        """Test getting pending bills"""
        url = reverse('pending-bills')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_add_late_fee(self):
        """Test adding late fee to bill"""
        url = reverse('add-late-fee', args=[self.payment.id])
        data = {'amount': 25.00}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['amount'], '175.00')
        self.assertEqual(response.data['late_fee'], '25.00')
