from django.test import TestCase
from django.contrib.auth import get_user_model
from merchants.models import Store, Product, MerchantOnboarding
from users.models import Merchant as MerchantProfile
from merchants.serializers import StoreSerializer, ProductSerializer

User = get_user_model()


class MerchantProfileTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testmerchant',
            email='testmerchant@example.com',
            password='TestPass123!',
            user_type=2  # Merchant
        )
        # Merchant profile should be auto-created via signals
        self.merchant_profile = self.user.merchant_profile

    def test_merchant_profile_creation(self):
        """Test that merchant profile is auto-created"""
        self.assertIsInstance(self.merchant_profile, MerchantProfile)
        self.assertEqual(self.merchant_profile.user, self.user)

    def test_merchant_profile_str_method(self):
        """Test merchant profile string representation"""
        self.merchant_profile.business_name = 'Test Business LLC'
        self.merchant_profile.save()
        self.assertEqual(str(self.merchant_profile), 'Test Business LLC')


class StoreModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testmerchant',
            email='testmerchant@example.com',
            password='TestPass123!',
            user_type=2
        )
        self.merchant_profile = self.user.merchant_profile

    def test_store_creation(self):
        """Test store creation"""
        store = Store.objects.create(
            merchant=self.merchant_profile,
            name='Test Store',
            description='A test store'
        )
        self.assertEqual(store.name, 'Test Store')
        self.assertEqual(store.merchant, self.merchant_profile)

    def test_store_str_method(self):
        """Test store string representation"""
        store = Store.objects.create(
            merchant=self.merchant_profile,
            name='Test Store',
            description='A test store'
        )
        self.assertEqual(str(store), 'Test Store')


class ProductModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testmerchant',
            email='testmerchant@example.com',
            password='TestPass123!',
            user_type=2
        )
        self.merchant_profile = self.user.merchant_profile
        self.store = Store.objects.create(
            merchant=self.merchant_profile,
            name='Test Store',
            description='A test store'
        )

    def test_product_creation(self):
        """Test product creation"""
        product = Product.objects.create(
            store=self.store,
            name='Test Product',
            description='A test product',
            price=29.99
        )
        self.assertEqual(product.name, 'Test Product')
        self.assertEqual(product.price, 29.99)
        self.assertEqual(product.store, self.store)
        self.assertEqual(product.store.merchant, self.merchant_profile)

    def test_product_str_method(self):
        """Test product string representation"""
        product = Product.objects.create(
            store=self.store,
            name='Test Product',
            description='A test product',
            price=29.99
        )
        self.assertEqual(str(product), 'Test Product')

    def test_product_sku_generation(self):
        """Test SKU auto-generation"""
        product = Product.objects.create(
            store=self.store,
            name='Test Product',
            description='A test product',
            price=29.99
        )
        # SKU should be generated after save
        product.refresh_from_db()
        self.assertTrue(product.sku.startswith(f"{self.store.id}-TES-"))

    def test_product_low_stock_property(self):
        """Test low stock property"""
        product = Product.objects.create(
            store=self.store,
            name='Test Product',
            description='A test product',
            price=29.99,
            stock_quantity=3,
            low_stock_threshold=5
        )
        self.assertTrue(product.is_low_stock)

        product.stock_quantity = 10
        product.save()
        product.refresh_from_db()
        self.assertFalse(product.is_low_stock)


class MerchantOnboardingTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testmerchant',
            email='testmerchant@example.com',
            password='TestPass123!',
            user_type=2
        )
        self.merchant_profile = self.user.merchant_profile

    def test_onboarding_creation(self):
        """Test onboarding creation"""
        onboarding = MerchantOnboarding.objects.create(
            merchant=self.merchant_profile,
            status=MerchantOnboarding.PENDING,
            current_step=1,
            total_steps=4
        )
        self.assertEqual(onboarding.status, MerchantOnboarding.PENDING)
        self.assertEqual(onboarding.merchant, self.merchant_profile)

    def test_onboarding_str_method(self):
        """Test onboarding string representation"""
        onboarding = MerchantOnboarding.objects.create(
            merchant=self.merchant_profile,
            status=MerchantOnboarding.PENDING,
            current_step=1,
            total_steps=4
        )
        self.merchant_profile.business_name = 'Test Business LLC'
        self.merchant_profile.save()
        self.assertEqual(str(onboarding), 'Test Business LLC - Pending')

    def test_onboarding_verification_on_completion(self):
        """Test that verification is set when status becomes completed"""
        onboarding = MerchantOnboarding.objects.create(
            merchant=self.merchant_profile,
            status=MerchantOnboarding.BANK_DETAILS,
            current_step=3,
            total_steps=4
        )
        self.assertFalse(onboarding.is_verified)

        onboarding.status = MerchantOnboarding.COMPLETED
        onboarding.save()
        onboarding.refresh_from_db()
        self.assertTrue(onboarding.is_verified)
