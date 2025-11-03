from django.core.management.base import BaseCommand
from payments.utils.alerts import AlertService

class Command(BaseCommand):
    help = 'Test alert system'
    
    def add_arguments(self, parser):
        parser.add_argument('provider', type=str)
        parser.add_argument('--region', type=str, required=False)
    
    def handle(self, *args, **options):
        provider = options['provider']
        region = options.get('region')
        
        # Test failure alert
        AlertService.send_alert(provider, False, region)
        
        # Test recovery alert
        AlertService.send_alert(provider, True, region)
        
        self.stdout.write(self.style.SUCCESS(
            f"Sent test alerts for {provider} in {region or 'global'}"
        ))
