"""
Django management command to run performance benchmarks
"""
from django.core.management.base import BaseCommand
from core.performance_benchmarks import run_all_benchmarks


class Command(BaseCommand):
    help = 'Run performance benchmarks for SikaRemit'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--iterations',
            type=int,
            default=100,
            help='Number of iterations for each benchmark'
        )
        parser.add_argument(
            '--output',
            type=str,
            default=None,
            help='Output file path for benchmark results (JSON)'
        )
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting performance benchmarks...'))
        
        iterations = options['iterations']
        output_file = options['output']
        
        # Run benchmarks
        report = run_all_benchmarks()
        
        # Save to file if specified
        if output_file:
            import json
            with open(output_file, 'w') as f:
                json.dump(report, f, indent=2)
            self.stdout.write(
                self.style.SUCCESS(f'Benchmark results saved to {output_file}')
            )
        
        self.stdout.write(self.style.SUCCESS('Benchmarks completed successfully!'))
