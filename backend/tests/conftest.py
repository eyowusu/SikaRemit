"""
Pytest Configuration and Fixtures for SikaRemit Tests
"""
import pytest
import os
import django
from django.conf import settings

# Configure Django settings for tests
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.test_settings')


@pytest.fixture(scope='session')
def django_db_setup():
    """Setup test database"""
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
        'ATOMIC_REQUESTS': False,
    }


@pytest.fixture
def api_client():
    """Return a DRF API client"""
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def create_user(db):
    """Factory fixture to create users"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    def _create_user(
        email='test@example.com',
        password='TestPass123!',
        first_name='Test',
        last_name='User',
        phone_number='+233241234567',
        user_type=3,
        kyc_status='not_submitted',
        **kwargs
    ):
        return User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            user_type=user_type,
            kyc_status=kyc_status,
            **kwargs
        )
    
    return _create_user


@pytest.fixture
def create_admin(db):
    """Factory fixture to create admin users"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    def _create_admin(
        email='admin@example.com',
        password='AdminPass123!',
        **kwargs
    ):
        return User.objects.create_superuser(
            email=email,
            password=password,
            **kwargs
        )
    
    return _create_admin


@pytest.fixture
def auth_headers(create_user):
    """Return authentication headers for a test user"""
    from rest_framework_simplejwt.tokens import RefreshToken
    
    user = create_user()
    refresh = RefreshToken.for_user(user)
    
    return {
        'HTTP_AUTHORIZATION': f'Bearer {refresh.access_token}',
        'user': user,
    }


@pytest.fixture
def admin_auth_headers(create_admin):
    """Return authentication headers for an admin user"""
    from rest_framework_simplejwt.tokens import RefreshToken
    
    admin = create_admin()
    refresh = RefreshToken.for_user(admin)
    
    return {
        'HTTP_AUTHORIZATION': f'Bearer {refresh.access_token}',
        'user': admin,
    }


@pytest.fixture
def mock_payment_gateway():
    """Mock payment gateway for testing"""
    from unittest.mock import MagicMock
    
    gateway = MagicMock()
    gateway.process_payment.return_value = {
        'success': True,
        'transaction_id': 'TXN123456789',
        'status': 'completed',
    }
    gateway.refund_payment.return_value = {
        'success': True,
        'refund_id': 'REF123456789',
    }
    
    return gateway


@pytest.fixture
def sample_transaction_data():
    """Sample transaction data for testing"""
    return {
        'amount': '100.00',
        'currency': 'GHS',
        'recipient_phone': '+233241234567',
        'description': 'Test transaction',
    }


@pytest.fixture
def sample_kyc_data():
    """Sample KYC data for testing"""
    return {
        'document_type': 'national_id',
        'document_number': 'GHA-123456789-0',
        'first_name': 'Test',
        'last_name': 'User',
        'date_of_birth': '1990-01-01',
        'nationality': 'GH',
    }
