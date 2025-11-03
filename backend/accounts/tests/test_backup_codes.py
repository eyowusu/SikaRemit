from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from users.models import User

class BackupCodesTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='password123',
            mfa_enabled=True
        )
        self.client.force_authenticate(user=self.user)
    
    def test_backup_code_flow(self):
        # Generate codes
        response = self.client.get(reverse('mfa-backup-codes'))
        self.assertEqual(response.status_code, 200)
        
        # Should have codes (though not visible in response)
        self.assertTrue(self.user.mfa_backup_codes)
