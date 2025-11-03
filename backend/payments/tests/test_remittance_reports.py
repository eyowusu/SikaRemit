from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from ..models import Payment
from accounts.models import Customer
from ..services.remittance_service import RemittanceService

User = get_user_model()

class RemittanceReportTests(TestCase):
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
        
        # Create test payments
        Payment.objects.create(
            customer=cls.customer,
            amount=100.00,
            bill_reference='BILL-001',
            bill_type='utility',
            is_remitted=True,
            remittance_date=timezone.now()
        )
        Payment.objects.create(
            customer=cls.customer,
            amount=200.00,
            bill_reference='BILL-002',
            bill_type='tax',
            is_remitted=False
        )
    
    def test_detailed_remittance_report(self):
        """Test generating detailed remittance report"""
        report = RemittanceService.generate_detailed_remittance_report()
        
        self.assertIn('daily_summary', report)
        self.assertIn('bill_type_breakdown', report)
        self.assertIn('totals', report)
        
        # Verify totals
        self.assertEqual(report['totals']['remitted'], 100.00)
        self.assertEqual(report['totals']['pending'], 200.00)
    
    def test_filtered_report(self):
        """Test report with bill type filter"""
        report = RemittanceService.generate_detailed_remittance_report(
            bill_type='utility'
        )
        
        self.assertEqual(len(report['bill_type_breakdown']), 1)
        self.assertEqual(report['bill_type_breakdown'][0]['bill_type'], 'utility')
