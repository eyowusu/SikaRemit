from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import CustomUser
from users.models import Merchant

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test users for SikaRemit development'

    def add_arguments(self, parser):
        parser.add_argument(
            '--admin-only',
            action='store_true',
            help='Create only admin user',
        )

    def handle(self, *args, **options):
        self.stdout.write('Creating test users...\n')

        # Create admin user
        self.create_admin_user()

        if not options['admin_only']:
            # Create additional test users
            self.create_test_users()

        self.stdout.write(
            self.style.SUCCESS('Test users created successfully!')
        )

    def create_admin_user(self):
        """Create admin user"""
        email = 'admin@SikaRemit.com'
        password = 'admin123'

        try:
            # Delete existing user if exists
            CustomUser.objects.filter(email=email).delete()

            # Create admin user
            user = CustomUser.objects.create_user(
                email=email,
                password=password,
                first_name='Admin',
                last_name='User',
                user_type=1,  # Admin
                is_staff=True,
                is_superuser=True
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Admin user created:\n'
                    f'   Email: {email}\n'
                    f'   Password: {password}\n'
                    f'   User ID: {user.id}\n'
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to create admin user: {e}')
            )

    def create_test_users(self):
        """Create additional test users"""
        test_users = [
            {
                'email': 'merchant@SikaRemit.com',
                'password': 'merchant123',
                'first_name': 'Test',
                'last_name': 'Merchant',
                'user_type': 2,  # Merchant
            },
            {
                'email': 'customer@SikaRemit.com',
                'password': 'customer123',
                'first_name': 'Test',
                'last_name': 'Customer',
                'user_type': 3,  # Customer
            },
        ]

        for user_data in test_users:
            try:
                # Delete existing user if exists
                CustomUser.objects.filter(email=user_data['email']).delete()

                # Create user
                user = CustomUser.objects.create_user(**user_data)

                self.stdout.write(
                    f'✅ {user_data["user_type"]} user created: {user_data["email"]}'
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Failed to create {user_data["user_type"]} user: {e}')
                )
