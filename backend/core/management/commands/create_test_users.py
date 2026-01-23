from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import User, Customer, Merchant
from shared.constants import USER_TYPE_MERCHANT, USER_TYPE_CUSTOMER

class Command(BaseCommand):
    help = 'Creates test users for admin, merchant, and customer roles.'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('Creating test users...')

        # Admin User
        admin_email = 'admin@sikaremit.com'
        if not User.objects.filter(email=admin_email).exists():
            admin_user = User.objects.create_superuser(email=admin_email, password='password', first_name='Admin', last_name='User')
            self.stdout.write(f'Admin user created: {admin_email}')
        else:
            self.stdout.write(f'Admin user already exists: {admin_email}')

        # Merchant User
        merchant_email = 'merchant@sikaremit.com'
        if not User.objects.filter(email=merchant_email).exists():
            User.objects.create_user(email=merchant_email, password='password', first_name='Merchant', last_name='User', user_type=USER_TYPE_MERCHANT)
            self.stdout.write(f'Merchant user created: {merchant_email}')
        else:
            self.stdout.write(f'Merchant user already exists: {merchant_email}')

        # Customer User
        customer_email = 'customer@sikaremit.com'
        if not User.objects.filter(email=customer_email).exists():
            User.objects.create_user(email=customer_email, password='password', first_name='Customer', last_name='User', user_type=USER_TYPE_CUSTOMER)
            self.stdout.write(f'Customer user created: {customer_email}')
        else:
            self.stdout.write(f'Customer user already exists: {customer_email}')

        self.stdout.write(self.style.SUCCESS('Successfully created test users.'))
