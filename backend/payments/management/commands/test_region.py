from django.core.management.base import BaseCommand
from payments.services.verification import VerificationService

class Command(BaseCommand):
    help = 'Test provider in specific region'
    
    def add_arguments(self, parser):
        parser.add_argument('provider', type=str)
        parser.add_argument('country', type=str)
    
    def handle(self, *args, **options):
        provider = options['provider']
        country = options['country']
        
        result = VerificationService._test_provider_region(provider, country)
        status = "WORKING" if result else "FAILING"
        
        self.stdout.write(
            self.style.SUCCESS(f"{provider} in {country}: {status}")
        )
