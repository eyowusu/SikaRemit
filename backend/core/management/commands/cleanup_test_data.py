from django.core.management.base import BaseCommand
from django.db import transaction, connection
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Cleanup test data: remove inactive users, test users, and all transactions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion (required for actual deletion)',
        )

    def safe_delete_all(self, model_class, label):
        """Safely delete all records from a model"""
        try:
            count = model_class.objects.count()
            if count > 0:
                model_class.objects.all().delete()
                self.stdout.write(self.style.SUCCESS(f'Deleted {count} {label} records'))
            return count
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Could not delete {label}: {e}'))
            return 0

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        confirm = options['confirm']

        if not dry_run and not confirm:
            self.stdout.write(self.style.WARNING(
                'This will DELETE data permanently. Use --dry-run to preview or --confirm to execute.'
            ))
            return

        self.stdout.write('=' * 60)
        self.stdout.write('SIKAREMIT TEST DATA CLEANUP')
        self.stdout.write('=' * 60)

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No data will be deleted\n'))

        # Track counts
        deleted_counts = {}

        # ============================================================
        # 1. IDENTIFY INACTIVE AND TEST USERS
        # ============================================================
        self.stdout.write('\n--- USERS ---')

        # Test user emails (from create_test_users.py)
        test_emails = [
            'admin@sikaremit.com',
            'merchant@sikaremit.com', 
            'customer@sikaremit.com',
        ]

        # Find inactive users (is_active=False)
        inactive_users = User.objects.filter(is_active=False)
        self.stdout.write(f'Inactive users found: {inactive_users.count()}')
        for user in inactive_users[:10]:
            self.stdout.write(f'  - {user.email} (type: {user.user_type})')
        if inactive_users.count() > 10:
            self.stdout.write(f'  ... and {inactive_users.count() - 10} more')

        # Find test users by email pattern
        test_users = User.objects.filter(email__in=test_emails)
        self.stdout.write(f'Test users found: {test_users.count()}')
        for user in test_users:
            self.stdout.write(f'  - {user.email} (type: {user.user_type})')

        # Find unverified users (potential test accounts)
        unverified_users = User.objects.filter(is_verified=False, is_superuser=False)
        self.stdout.write(f'Unverified non-admin users: {unverified_users.count()}')

        # ============================================================
        # 2. IDENTIFY TRANSACTIONS
        # ============================================================
        self.stdout.write('\n--- TRANSACTIONS ---')

        # accounts.Transaction
        try:
            from accounts.models import Transaction as AccountsTransaction
            accounts_tx = AccountsTransaction.objects.all()
            self.stdout.write(f'accounts.Transaction records: {accounts_tx.count()}')
            deleted_counts['accounts.Transaction'] = accounts_tx.count()
        except Exception as e:
            self.stdout.write(f'accounts.Transaction: Error - {e}')
            accounts_tx = None

        # payments Transaction (if exists)
        try:
            from payments.models import Transaction as PaymentsTransaction
            payments_tx = PaymentsTransaction.objects.all()
            self.stdout.write(f'payments.Transaction records: {payments_tx.count()}')
            deleted_counts['payments.Transaction'] = payments_tx.count()
        except Exception as e:
            self.stdout.write(f'payments.Transaction: Not found or error - {e}')
            payments_tx = None

        # PaymentLog
        try:
            from accounts.models import PaymentLog
            payment_logs = PaymentLog.objects.all()
            self.stdout.write(f'PaymentLog records: {payment_logs.count()}')
            deleted_counts['PaymentLog'] = payment_logs.count()
        except Exception as e:
            self.stdout.write(f'PaymentLog: Error - {e}')
            payment_logs = None

        # WalletBalance
        try:
            from payments.models import WalletBalance
            wallet_balances = WalletBalance.objects.all()
            self.stdout.write(f'WalletBalance records: {wallet_balances.count()}')
            deleted_counts['WalletBalance'] = wallet_balances.count()
        except Exception as e:
            self.stdout.write(f'WalletBalance: Error - {e}')
            wallet_balances = None

        # AuthLog
        try:
            from accounts.models import AuthLog
            auth_logs = AuthLog.objects.all()
            self.stdout.write(f'AuthLog records: {auth_logs.count()}')
            deleted_counts['AuthLog'] = auth_logs.count()
        except Exception as e:
            self.stdout.write(f'AuthLog: Error - {e}')
            auth_logs = None

        # ============================================================
        # 3. IDENTIFY RELATED DATA
        # ============================================================
        self.stdout.write('\n--- RELATED DATA ---')

        # Notifications
        try:
            from notifications.models import Notification
            notifications = Notification.objects.all()
            self.stdout.write(f'Notifications: {notifications.count()}')
            deleted_counts['Notifications'] = notifications.count()
        except Exception as e:
            self.stdout.write(f'Notifications: Error - {e}')
            notifications = None

        # KYC Documents
        try:
            from users.models import KYCDocument
            kyc_docs = KYCDocument.objects.all()
            self.stdout.write(f'KYC Documents: {kyc_docs.count()}')
            deleted_counts['KYCDocument'] = kyc_docs.count()
        except Exception as e:
            self.stdout.write(f'KYC Documents: Error - {e}')
            kyc_docs = None

        # Merchants
        try:
            from users.models import Merchant
            merchants = Merchant.objects.all()
            self.stdout.write(f'Merchant profiles: {merchants.count()}')
            deleted_counts['Merchant'] = merchants.count()
        except Exception as e:
            self.stdout.write(f'Merchant profiles: Error - {e}')
            merchants = None

        # Customers
        try:
            from users.models import Customer
            customers = Customer.objects.all()
            self.stdout.write(f'Customer profiles: {customers.count()}')
            deleted_counts['Customer'] = customers.count()
        except Exception as e:
            self.stdout.write(f'Customer profiles: Error - {e}')
            customers = None

        # ============================================================
        # 4. DELETE DATA (if not dry run)
        # ============================================================
        if not dry_run and confirm:
            self.stdout.write('\n' + '=' * 60)
            self.stdout.write(self.style.WARNING('DELETING DATA...'))
            self.stdout.write('=' * 60)

            # Delete all related models that have protected foreign keys FIRST
            # Not using atomic transaction to allow partial success
            
            # DomesticTransfer
            try:
                from payments.models import DomesticTransfer
                self.safe_delete_all(DomesticTransfer, 'DomesticTransfer')
            except Exception as e:
                self.stdout.write(f'DomesticTransfer: {e}')

            # CrossBorderRemittance
            try:
                from payments.models import CrossBorderRemittance
                self.safe_delete_all(CrossBorderRemittance, 'CrossBorderRemittance')
            except Exception as e:
                self.stdout.write(f'CrossBorderRemittance: {e}')

            # Recipient
            try:
                from accounts.models import Recipient
                self.safe_delete_all(Recipient, 'Recipient')
            except Exception as e:
                self.stdout.write(f'Recipient: {e}')

            # PaymentMethod
            try:
                from payments.models import PaymentMethod
                self.safe_delete_all(PaymentMethod, 'PaymentMethod')
            except Exception as e:
                self.stdout.write(f'PaymentMethod: {e}')

            # FeeConfiguration - reassign to first available admin instead of NULL
            try:
                from payments.models import FeeConfiguration
                first_admin = User.objects.filter(is_superuser=True, is_active=True).first()
                if first_admin:
                    FeeConfiguration.objects.exclude(created_by=first_admin).update(created_by=first_admin)
                    self.stdout.write(self.style.SUCCESS(f'Reassigned FeeConfiguration.created_by to {first_admin.email}'))
            except Exception as e:
                self.stdout.write(f'FeeConfiguration: {e}')

            # Delete transactions
            if accounts_tx:
                self.safe_delete_all(accounts_tx.model, 'accounts.Transaction')

            if payments_tx:
                self.safe_delete_all(payments_tx.model, 'payments.Transaction')

            if payment_logs:
                self.safe_delete_all(payment_logs.model, 'PaymentLog')

            if wallet_balances:
                self.safe_delete_all(wallet_balances.model, 'WalletBalance')

            if auth_logs:
                self.safe_delete_all(auth_logs.model, 'AuthLog')

            if notifications:
                self.safe_delete_all(notifications.model, 'Notification')

            if kyc_docs:
                self.safe_delete_all(kyc_docs.model, 'KYCDocument')

            # Delete more related data
            try:
                from payments.models.social_payments import GroupSavings, SplitBill, PaymentRequest
                self.safe_delete_all(GroupSavings, 'GroupSavings')
                self.safe_delete_all(SplitBill, 'SplitBill')
                self.safe_delete_all(PaymentRequest, 'PaymentRequest')
            except Exception as e:
                self.stdout.write(f'Social payments: {e}')

            try:
                from payments.models.budgeting import Budget, BudgetAlert
                self.safe_delete_all(BudgetAlert, 'BudgetAlert')
                self.safe_delete_all(Budget, 'Budget')
            except Exception as e:
                self.stdout.write(f'Budgeting: {e}')

            # Disable foreign key checks for SQLite (needed to delete users with broken FK references)
            with connection.cursor() as cursor:
                cursor.execute("PRAGMA foreign_keys = OFF")

            # Delete inactive users
            inactive_to_delete = list(User.objects.filter(is_active=False).values_list('id', 'email'))
            for user_id, email in inactive_to_delete:
                try:
                    with connection.cursor() as cursor:
                        cursor.execute("DELETE FROM users_user WHERE id = %s", [user_id])
                    self.stdout.write(self.style.SUCCESS(f'Deleted inactive user: {email}'))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'Could not delete {email}: {e}'))

            # Delete test users (but not if they're the only admin!)
            admin_count = User.objects.filter(is_superuser=True).count()
            for email in test_emails:
                user = User.objects.filter(email=email).first()
                if user:
                    if user.is_superuser and admin_count <= 1:
                        self.stdout.write(self.style.WARNING(
                            f'Skipped deleting {email} - only remaining admin'
                        ))
                    else:
                        try:
                            with connection.cursor() as cursor:
                                cursor.execute("DELETE FROM users_user WHERE id = %s", [user.id])
                            if user.is_superuser:
                                admin_count -= 1
                            self.stdout.write(self.style.SUCCESS(f'Deleted test user: {email}'))
                        except Exception as e:
                            self.stdout.write(self.style.WARNING(f'Could not delete {email}: {e}'))

            # Re-enable foreign key checks
            with connection.cursor() as cursor:
                cursor.execute("PRAGMA foreign_keys = ON")

            self.stdout.write('\n' + self.style.SUCCESS('=' * 60))
            self.stdout.write(self.style.SUCCESS('CLEANUP COMPLETED SUCCESSFULLY'))
            self.stdout.write(self.style.SUCCESS('=' * 60))

        else:
            self.stdout.write('\n' + '=' * 60)
            self.stdout.write('SUMMARY (Dry Run - No changes made)')
            self.stdout.write('=' * 60)
            self.stdout.write('\nTo actually delete this data, run:')
            self.stdout.write(self.style.WARNING(
                '  python manage.py cleanup_test_data --confirm'
            ))
