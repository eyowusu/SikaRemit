from django.core.management.base import BaseCommand
import subprocess

class Command(BaseCommand):
    help = 'Run all test suites'

    def handle(self, *args, **options):
        self.stdout.write('Running tests...')
        result = subprocess.run(['pytest'], capture_output=True, text=True)
        self.stdout.write(result.stdout)
        if result.returncode != 0:
            self.stderr.write(result.stderr)
            raise SystemExit(result.returncode)
