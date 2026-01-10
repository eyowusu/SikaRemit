from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as filters
from django.db.models import Q
from django.db import transaction
from decimal import Decimal
from payments.models import TelecomProvider, TelecomPackage, BusinessRule, Transaction
from payments.serializers import (
    TelecomProviderSerializer,
    TelecomPackageSerializer,
    BusinessRuleSerializer,
    TelecomPackageListSerializer
)
import logging
import uuid

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def telecom_providers(request, country_code=None):
    """Get list of available telecom providers for a country"""
    try:
        service = TelecomService()
        if country_code:
            providers = service.get_providers_by_country(country_code)
        else:
            providers = service.get_all_providers()
        return Response(providers)
    except Exception as e:
        logger.error(f"Error fetching telecom providers: {str(e)}")
        return Response(
            {'error': 'Failed to fetch providers'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def telecom_packages(request, country_code=None):
    """Get data packages for a specific country"""
    provider = request.GET.get('provider')

    if not provider:
        return Response(
            {'error': 'Provider parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        service = TelecomService()
        if country_code:
            packages = service.get_data_packages_by_country(provider, country_code)
        else:
            packages = service.get_data_packages(provider)
        return Response({
            'provider': provider,
            'packages': packages
        })
    except Exception as e:
        logger.error(f"Error fetching telecom packages: {str(e)}")
        return Response(
            {'error': 'Failed to fetch packages'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def purchase_airtime(request):
    """
    Purchase airtime/mobile credit
    
    Request body:
    {
        "phone_number": "0241234567",
        "provider": "MTN",  # MTN, Vodafone, AirtelTigo
        "amount": 50.00,
        "country_code": "GH"
    }
    """
    try:
        phone_number = request.data.get('phone_number')
        provider = request.data.get('provider')
        amount = request.data.get('amount')
        country_code = request.data.get('country_code', 'GH')
        
        # Validate required fields
        if not all([phone_number, provider, amount]):
            return Response(
                {'error': 'phone_number, provider, and amount are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = Decimal(str(amount))
            if amount <= 0:
                raise ValueError("Amount must be positive")
        except (ValueError, TypeError) as e:
            return Response(
                {'error': 'Invalid amount format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate minimum amount
        if amount < Decimal('1.00'):
            return Response(
                {'error': 'Minimum airtime amount is 1.00'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create transaction record
        with transaction.atomic():
            tx = Transaction.objects.create(
                user=request.user,
                transaction_type='airtime',
                amount=amount,
                currency_code=country_code == 'GH' and 'GHS' or 'USD',
                status='pending',
                reference=f"AIR-{uuid.uuid4().hex[:12].upper()}",
                description=f"Airtime purchase - {provider} - {phone_number}",
                metadata={
                    'phone_number': phone_number,
                    'provider': provider,
                    'country_code': country_code,
                    'type': 'airtime'
                }
            )
            
            # TODO: Integrate with actual telecom provider API
            # For now, mark as completed (simulate success)
            tx.status = 'completed'
            tx.save()
        
        return Response({
            'success': True,
            'message': f'Airtime of {amount} successfully sent to {phone_number}',
            'transaction_id': tx.reference,
            'phone_number': phone_number,
            'provider': provider,
            'amount': float(amount),
            'status': tx.status
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error purchasing airtime: {str(e)}")
        return Response(
            {'error': 'Failed to process airtime purchase'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def purchase_data_bundle(request):
    """
    Purchase data bundle
    
    Request body:
    {
        "phone_number": "0241234567",
        "provider": "MTN",
        "package_id": "mtn_5gb_30days",
        "package_name": "5GB - 30 Days",
        "amount": 50.00,
        "country_code": "GH"
    }
    """
    try:
        phone_number = request.data.get('phone_number')
        provider = request.data.get('provider')
        package_id = request.data.get('package_id')
        package_name = request.data.get('package_name', '')
        amount = request.data.get('amount')
        country_code = request.data.get('country_code', 'GH')
        
        # Validate required fields
        if not all([phone_number, provider, package_id, amount]):
            return Response(
                {'error': 'phone_number, provider, package_id, and amount are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = Decimal(str(amount))
            if amount <= 0:
                raise ValueError("Amount must be positive")
        except (ValueError, TypeError) as e:
            return Response(
                {'error': 'Invalid amount format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create transaction record
        with transaction.atomic():
            tx = Transaction.objects.create(
                user=request.user,
                transaction_type='data_bundle',
                amount=amount,
                currency_code=country_code == 'GH' and 'GHS' or 'USD',
                status='pending',
                reference=f"DATA-{uuid.uuid4().hex[:12].upper()}",
                description=f"Data bundle - {provider} - {package_name} - {phone_number}",
                metadata={
                    'phone_number': phone_number,
                    'provider': provider,
                    'package_id': package_id,
                    'package_name': package_name,
                    'country_code': country_code,
                    'type': 'data_bundle'
                }
            )
            
            # TODO: Integrate with actual telecom provider API
            # For now, mark as completed (simulate success)
            tx.status = 'completed'
            tx.save()
        
        return Response({
            'success': True,
            'message': f'Data bundle {package_name} successfully sent to {phone_number}',
            'transaction_id': tx.reference,
            'phone_number': phone_number,
            'provider': provider,
            'package_id': package_id,
            'package_name': package_name,
            'amount': float(amount),
            'status': tx.status
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error purchasing data bundle: {str(e)}")
        return Response(
            {'error': 'Failed to process data bundle purchase'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
