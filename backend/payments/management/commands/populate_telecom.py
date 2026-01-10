from django.core.management.base import BaseCommand
from django.db import transaction
from payments.models import TelecomProvider, TelecomPackage, Country, Currency


class Command(BaseCommand):
    help = 'Populate telecom providers and packages data'

    def handle(self, *args, **options):
        self.stdout.write('Starting telecom data population...')

        try:
            with transaction.atomic():
                self._populate_ghana_providers()
                self._populate_nigeria_providers()
                self._populate_kenya_providers()
                self._populate_south_africa_providers()

                self.stdout.write(
                    self.style.SUCCESS(
                        '✅ Telecom data population completed successfully!'
                    )
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error populating telecom data: {str(e)}')
            )
            raise

    def _populate_ghana_providers(self):
        """Populate Ghana telecom providers and packages"""
        try:
            ghana = Country.objects.get(code='GH')
            ghs = Currency.objects.get(code='GHS')

            # MTN Ghana
            mtn, created = TelecomProvider.objects.get_or_create(
                code='MTN_GH',
                defaults={
                    'name': 'MTN Ghana',
                    'country': ghana,
                    'website': 'https://www.mtn.com.gh',
                    'supports_data': True,
                    'supports_airtime': True,
                    'is_active': True
                }
            )

            if created:
                self.stdout.write(f'Created provider: {mtn.name}')

            # MTN Data Packages
            mtn_packages = [
                {'id': 'MTN_1GB', 'name': '1GB Data Bundle', 'data': '1GB', 'price': 15.00, 'validity': 30},
                {'id': 'MTN_2GB', 'name': '2GB Data Bundle', 'data': '2GB', 'price': 25.00, 'validity': 30},
                {'id': 'MTN_5GB', 'name': '5GB Data Bundle', 'data': '5GB', 'price': 50.00, 'validity': 30},
                {'id': 'MTN_10GB', 'name': '10GB Data Bundle', 'data': '10GB', 'price': 90.00, 'validity': 30},
                {'id': 'MTN_20GB', 'name': '20GB Data Bundle', 'data': '20GB', 'price': 150.00, 'validity': 30},
                {'id': 'MTN_UNLIMITED', 'name': 'Unlimited Data', 'data': 'Unlimited', 'price': 200.00, 'validity': 30},
            ]

            for pkg_data in mtn_packages:
                package, created = TelecomPackage.objects.get_or_create(
                    provider=mtn,
                    package_id=pkg_data['id'],
                    defaults={
                        'name': pkg_data['name'],
                        'package_type': 'data',
                        'price': pkg_data['price'],
                        'currency': ghs,
                        'data_amount': pkg_data['data'],
                        'validity_days': pkg_data['validity'],
                        'is_active': True,
                        'is_featured': pkg_data['id'] == 'MTN_5GB'
                    }
                )
                if created:
                    self.stdout.write(f'  Created package: {package.name}')

            # Vodafone Ghana
            vodafone, created = TelecomProvider.objects.get_or_create(
                code='VODAFONE_GH',
                defaults={
                    'name': 'Vodafone Ghana',
                    'country': ghana,
                    'website': 'https://www.vodafone.com.gh',
                    'supports_data': True,
                    'supports_airtime': True,
                    'is_active': True
                }
            )

            # Vodafone packages
            vodafone_packages = [
                {'id': 'VODA_1GB', 'name': '1GB Data Bundle', 'data': '1GB', 'price': 12.00, 'validity': 30},
                {'id': 'VODA_5GB', 'name': '5GB Data Bundle', 'data': '5GB', 'price': 45.00, 'validity': 30},
                {'id': 'VODA_15GB', 'name': '15GB Data Bundle', 'data': '15GB', 'price': 120.00, 'validity': 30},
            ]

            for pkg_data in vodafone_packages:
                package, created = TelecomPackage.objects.get_or_create(
                    provider=vodafone,
                    package_id=pkg_data['id'],
                    defaults={
                        'name': pkg_data['name'],
                        'package_type': 'data',
                        'price': pkg_data['price'],
                        'currency': ghs,
                        'data_amount': pkg_data['data'],
                        'validity_days': pkg_data['validity'],
                        'is_active': True
                    }
                )

            # AirtelTigo Ghana
            airteltigo, created = TelecomProvider.objects.get_or_create(
                code='AIRTELTIGO_GH',
                defaults={
                    'name': 'AirtelTigo Ghana',
                    'country': ghana,
                    'website': 'https://www.airteltigo.com.gh',
                    'supports_data': True,
                    'supports_airtime': True,
                    'is_active': True
                }
            )

        except Country.DoesNotExist:
            self.stdout.write(self.style.WARNING('Ghana country not found, skipping Ghana providers'))
        except Currency.DoesNotExist:
            self.stdout.write(self.style.WARNING('GHS currency not found, skipping Ghana packages'))

    def _populate_nigeria_providers(self):
        """Populate Nigeria telecom providers and packages"""
        try:
            nigeria = Country.objects.get(code='NG')
            ngn = Currency.objects.get(code='NGN')

            # MTN Nigeria
            mtn_ng, created = TelecomProvider.objects.get_or_create(
                code='MTN_NG',
                defaults={
                    'name': 'MTN Nigeria',
                    'country': nigeria,
                    'website': 'https://www.mtn.ng',
                    'supports_data': True,
                    'supports_airtime': True,
                    'is_active': True
                }
            )

            # MTN Nigeria packages
            mtn_ng_packages = [
                {'id': 'MTN_NG_1GB', 'name': '1GB Data Bundle', 'data': '1GB', 'price': 250.00, 'validity': 30},
                {'id': 'MTN_NG_2GB', 'name': '2GB Data Bundle', 'data': '2GB', 'price': 500.00, 'validity': 30},
                {'id': 'MTN_NG_5GB', 'name': '5GB Data Bundle', 'data': '5GB', 'price': 1000.00, 'validity': 30},
                {'id': 'MTN_NG_10GB', 'name': '10GB Data Bundle', 'data': '10GB', 'price': 1800.00, 'validity': 30},
            ]

            for pkg_data in mtn_ng_packages:
                package, created = TelecomPackage.objects.get_or_create(
                    provider=mtn_ng,
                    package_id=pkg_data['id'],
                    defaults={
                        'name': pkg_data['name'],
                        'package_type': 'data',
                        'price': pkg_data['price'],
                        'currency': ngn,
                        'data_amount': pkg_data['data'],
                        'validity_days': pkg_data['validity'],
                        'is_active': True,
                        'is_featured': pkg_data['id'] == 'MTN_NG_5GB'
                    }
                )

        except Country.DoesNotExist:
            self.stdout.write(self.style.WARNING('Nigeria country not found, skipping Nigeria providers'))
        except Currency.DoesNotExist:
            self.stdout.write(self.style.WARNING('NGN currency not found, skipping Nigeria packages'))

    def _populate_kenya_providers(self):
        """Populate Kenya telecom providers and packages"""
        try:
            kenya = Country.objects.get(code='KE')
            kes = Currency.objects.get(code='KES')

            # Safaricom Kenya
            safaricom, created = TelecomProvider.objects.get_or_create(
                code='SAFARICOM_KE',
                defaults={
                    'name': 'Safaricom Kenya',
                    'country': kenya,
                    'website': 'https://www.safaricom.co.ke',
                    'supports_data': True,
                    'supports_airtime': True,
                    'is_active': True
                }
            )

            # Safaricom packages
            saf_packages = [
                {'id': 'SAF_1GB', 'name': '1GB Data Bundle', 'data': '1GB', 'price': 100.00, 'validity': 30},
                {'id': 'SAF_5GB', 'name': '5GB Data Bundle', 'data': '5GB', 'price': 500.00, 'validity': 30},
                {'id': 'SAF_10GB', 'name': '10GB Data Bundle', 'data': '10GB', 'price': 1000.00, 'validity': 30},
            ]

            for pkg_data in saf_packages:
                package, created = TelecomPackage.objects.get_or_create(
                    provider=safaricom,
                    package_id=pkg_data['id'],
                    defaults={
                        'name': pkg_data['name'],
                        'package_type': 'data',
                        'price': pkg_data['price'],
                        'currency': kes,
                        'data_amount': pkg_data['data'],
                        'validity_days': pkg_data['validity'],
                        'is_active': True,
                        'is_featured': pkg_data['id'] == 'SAF_5GB'
                    }
                )

        except Country.DoesNotExist:
            self.stdout.write(self.style.WARNING('Kenya country not found, skipping Kenya providers'))
        except Currency.DoesNotExist:
            self.stdout.write(self.style.WARNING('KES currency not found, skipping Kenya packages'))

    def _populate_south_africa_providers(self):
        """Populate South Africa telecom providers and packages"""
        try:
            sa = Country.objects.get(code='ZA')
            zar = Currency.objects.get(code='ZAR')

            # Vodacom South Africa
            vodacom, created = TelecomProvider.objects.get_or_create(
                code='VODACOM_ZA',
                defaults={
                    'name': 'Vodacom South Africa',
                    'country': sa,
                    'website': 'https://www.vodacom.co.za',
                    'supports_data': True,
                    'supports_airtime': True,
                    'is_active': True
                }
            )

            # Vodacom packages
            voda_packages = [
                {'id': 'VODA_ZA_1GB', 'name': '1GB Data Bundle', 'data': '1GB', 'price': 50.00, 'validity': 30},
                {'id': 'VODA_ZA_5GB', 'name': '5GB Data Bundle', 'data': '5GB', 'price': 200.00, 'validity': 30},
                {'id': 'VODA_ZA_20GB', 'name': '20GB Data Bundle', 'data': '20GB', 'price': 500.00, 'validity': 30},
            ]

            for pkg_data in voda_packages:
                package, created = TelecomPackage.objects.get_or_create(
                    provider=vodacom,
                    package_id=pkg_data['id'],
                    defaults={
                        'name': pkg_data['name'],
                        'package_type': 'data',
                        'price': pkg_data['price'],
                        'currency': zar,
                        'data_amount': pkg_data['data'],
                        'validity_days': pkg_data['validity'],
                        'is_active': True,
                        'is_featured': pkg_data['id'] == 'VODA_ZA_5GB'
                    }
                )

        except Country.DoesNotExist:
            self.stdout.write(self.style.WARNING('South Africa country not found, skipping SA providers'))
        except Currency.DoesNotExist:
            self.stdout.write(self.style.WARNING('ZAR currency not found, skipping SA packages'))
