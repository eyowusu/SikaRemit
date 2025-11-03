from django.core.management.base import BaseCommand
from core.alerts import check_alerts

class Command(BaseCommand):
    help = 'Check database metrics against alert thresholds'

    def handle(self, *args, **options):
        check_alerts()
        self.stdout.write('Alert checks completed')
