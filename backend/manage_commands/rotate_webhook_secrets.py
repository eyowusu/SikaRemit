"""
Management command to rotate webhook secrets for enhanced security
"""
import os
import secrets
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Rotate webhook secrets for payment providers'

    def add_arguments(self, parser):
        parser.add_argument(
            '--provider',
            type=str,
            choices=['stripe', 'paystack', 'flutterwave', 'all'],
            default='all',
            help='Specify which provider secrets to rotate'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be rotated without making changes'
        )

    def handle(self, *args, **options):
        provider = options['provider']
        dry_run = options['dry_run']

        self.stdout.write(
            self.style.WARNING(f"{'DRY RUN: ' if dry_run else ''}Rotating webhook secrets for {provider}")
        )

        secrets_to_rotate = []

        if provider in ['stripe', 'all']:
            secrets_to_rotate.append(('STRIPE_WEBHOOK_SECRET', 'Stripe'))
        if provider in ['paystack', 'all']:
            secrets_to_rotate.append(('PAYSTACK_WEBHOOK_SECRET', 'Paystack'))
        if provider in ['flutterwave', 'all']:
            secrets_to_rotate.append(('FLUTTERWAVE_WEBHOOK_SECRET', 'Flutterwave'))

        rotated_secrets = {}

        for env_var, provider_name in secrets_to_rotate:
            old_secret = os.environ.get(env_var)
            if not old_secret:
                self.stdout.write(
                    self.style.WARNING(f"No existing secret found for {provider_name}")
                )
                continue

            # Generate new 32-byte secret
            new_secret = secrets.token_hex(32)

            if dry_run:
                self.stdout.write(
                    self.style.SUCCESS(f"Would rotate {provider_name} webhook secret")
                )
                self.stdout.write(f"  Old: {old_secret[:8]}...")
                self.stdout.write(f"  New: {new_secret[:8]}...")
            else:
                # In production, you would update the environment variables
                # and notify relevant services. For now, we'll just log.
                self.stdout.write(
                    self.style.SUCCESS(f"Rotated {provider_name} webhook secret")
                )
                rotated_secrets[env_var] = new_secret

        if not dry_run and rotated_secrets:
            self.stdout.write(
                self.style.SUCCESS("Rotation complete. Update your environment variables:")
            )
            for env_var, new_secret in rotated_secrets.items():
                self.stdout.write(f"  {env_var}={new_secret}")

            self.stdout.write(
                self.style.WARNING(
                    "IMPORTANT: Update webhook endpoints in payment provider dashboards "
                    "with the new secrets before deploying!"
                )
            )
