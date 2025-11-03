from django.core.management.base import BaseCommand
from payments.services.verification import VerificationService

class Command(BaseCommand):
    help = 'Send a test outage alert'

    def handle(self, *args, **options):
        """Trigger test alert"""
        VerificationService._send_outage_alert('africastalking', False)
        self.stdout.write(self.style.SUCCESS('Sent test alert'))
