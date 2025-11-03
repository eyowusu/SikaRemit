#!/usr/bin/env python
"""
Post-deployment setup script for PayGlobe on Render
Run this after the first deployment to set up initial data
"""
import os
import django
from django.core.management import execute_from_command_line

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import UserActivity

User = get_user_model()

def create_initial_admin():
    """Create initial admin user"""
    if not User.objects.filter(email='admin@payglobe.com').exists():
        admin = User.objects.create_superuser(
            email='admin@payglobe.com',
            first_name='PayGlobe',
            last_name='Admin',
            password='admin123',  # Change this immediately after setup
            user_type=1,  # Admin
            is_verified=True
        )
        print("✅ Created admin user: admin@payglobe.com")

        # Log admin creation
        UserActivity.objects.create(
            user=admin,
            event_type='ADMIN_CREATED',
            metadata={'setup': True}
        )
        print("✅ Logged admin creation activity")
    else:
        print("ℹ️  Admin user already exists")

def create_test_users():
    """Create test users for development"""
    test_users = [
        {
            'email': 'merchant@example.com',
            'first_name': 'Test',
            'last_name': 'Merchant',
            'password': 'merchant123',
            'user_type': 2,  # Merchant
        },
        {
            'email': 'customer@example.com',
            'first_name': 'Test',
            'last_name': 'Customer',
            'password': 'customer123',
            'user_type': 3,  # Customer
        }
    ]

    for user_data in test_users:
        if not User.objects.filter(email=user_data['email']).exists():
            user = User.objects.create_user(
                email=user_data['email'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                password=user_data['password'],
                user_type=user_data['user_type'],
                is_verified=True
            )
            print(f"✅ Created test user: {user_data['email']}")

            # Log user creation
            UserActivity.objects.create(
                user=user,
                event_type='USER_CREATED',
                metadata={'test_user': True}
            )
        else:
            print(f"ℹ️  Test user already exists: {user_data['email']}")

def main():
    print("🚀 Starting PayGlobe post-deployment setup...")

    try:
        # Run migrations (in case they weren't run during build)
        print("📦 Running database migrations...")
        execute_from_command_line(['manage.py', 'migrate', '--verbosity=1'])

        # Collect static files
        print("📂 Collecting static files...")
        execute_from_command_line(['manage.py', 'collectstatic', '--no-input', '--verbosity=1'])

        # Create initial data
        print("👤 Creating initial users...")
        create_initial_admin()
        create_test_users()

        print("🎉 PayGlobe setup completed successfully!")
        print("\n📋 Next steps:")
        print("1. Change the default admin password immediately")
        print("2. Configure email settings for notifications")
        print("3. Set up payment provider credentials")
        print("4. Configure SMS provider credentials")
        print("5. Test all authentication flows")

    except Exception as e:
        print(f"❌ Setup failed: {str(e)}")
        raise

if __name__ == '__main__':
    main()
