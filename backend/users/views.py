from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from core.response import APIResponse
from .models import User, Merchant, Customer, KYCDocument
from .serializers import UserSerializer, MerchantSerializer, CustomerSerializer, KYCDocumentSerializer
from .services import UserService, KYCService
from .permissions import IsAdminUser, IsOwnerOrAdmin
from .tasks import send_verification_email, send_merchant_approval_email
from .biometrics import BiometricVerifier
import uuid
from django.shortcuts import get_object_or_404


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for managing users with admin-only access."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        """Return queryset based on user type."""
        user = self.request.user
        
        if not user.is_authenticated:
            return User.objects.none()
            
        if user.user_type == 1:  # Admin
            return User.objects.all()
        else:  # Merchant or Customer
            return User.objects.filter(pk=user.pk)

    def list(self, request, *args, **kwargs):
        """List users with proper permission filtering."""
        try:
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)
            
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
                
            serializer = self.get_serializer(queryset, many=True)
            return APIResponse(serializer.data)
            
        except Exception as e:
            return APIResponse(
                {'error': 'Failed to retrieve users'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific user."""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return APIResponse(serializer.data)
        except Exception as e:
            return APIResponse(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user's profile."""
        try:
            serializer = self.get_serializer(request.user)
            return APIResponse(serializer.data)
        except Exception as e:
            return APIResponse(
                {'error': 'Failed to retrieve user profile'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search users with optional type filter."""
        try:
            query = request.query_params.get('q', '').strip()
            user_type = request.query_params.get('type')
            
            if not query:
                raise ValidationError('Search query is required')
                
            users = UserService.search_users(query, user_type)
            serializer = self.get_serializer(users, many=True)
            return APIResponse(serializer.data)
            
        except ValidationError as e:
            return APIResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return APIResponse(
                {'error': 'Search failed'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def resend_verification(self, request, pk=None):
        """Resend verification email to user."""
        try:
            user = self.get_object()
            
            # Check if user is already verified
            if user.is_verified:
                return APIResponse(
                    {'error': 'User is already verified'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            user.verification_token = UserService.generate_verification_token()
            user.save()
            
            send_verification_email.delay(user.id)
            
            return APIResponse({'message': 'Verification email sent successfully'})
            
        except Exception as e:
            return APIResponse(
                {'error': 'Failed to resend verification email'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify a user account."""
        try:
            user = self.get_object()
            
            if user.is_verified:
                return APIResponse(
                    {'error': 'User is already verified'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            user.is_verified = True
            user.verified_at = timezone.now()
            user.save()
            
            return APIResponse({'message': 'User verified successfully'})
            
        except Exception as e:
            return APIResponse(
                {'error': 'Failed to verify user'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MerchantViewSet(viewsets.ModelViewSet):
    """ViewSet for managing merchant profiles."""
    queryset = Merchant.objects.all()
    serializer_class = MerchantSerializer
    permission_classes = [IsOwnerOrAdmin]

    def get_queryset(self):
        """Return queryset based on user permissions."""
        user = self.request.user
        
        if not user.is_authenticated:
            return Merchant.objects.none()
            
        if user.user_type == 1:  # Admin
            return Merchant.objects.all()
        else:  # Merchant can only see their own profile
            return Merchant.objects.filter(user=user)

    def list(self, request, *args, **kwargs):
        """List merchants with proper permission filtering."""
        try:
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)
            
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
                
            serializer = self.get_serializer(queryset, many=True)
            return APIResponse(serializer.data)
            
        except Exception as e:
            return APIResponse(
                {'error': 'Failed to retrieve merchants'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific merchant."""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return APIResponse(serializer.data)
        except Exception as e:
            return APIResponse(
                {'error': 'Merchant not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search and filter merchants."""
        try:
            is_approved = request.query_params.get('approved')
            business_name = request.query_params.get('name', '').strip()
            
            # Convert string to boolean if provided
            if is_approved is not None:
                is_approved = is_approved.lower() in ['true', '1', 'yes']
            
            merchants = UserService.filter_merchants(
                is_approved=is_approved,
                business_name=business_name
            )
            
            serializer = self.get_serializer(merchants, many=True)
            return APIResponse(serializer.data)
            
        except Exception as e:
            return APIResponse(
                {'error': 'Search failed'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """Approve a merchant (admin only)."""
        try:
            merchant = self.get_object()
            
            if merchant.is_approved:
                return APIResponse(
                    {'error': 'Merchant is already approved'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            merchant.is_approved = True
            merchant.approved_by = request.user
            merchant.approved_at = timezone.now()
            merchant.save()
            
            send_merchant_approval_email.delay(merchant.user.id, request.user.id)
            
            return APIResponse({'message': 'Merchant approved successfully'})
            
        except Exception as e:
            return APIResponse(
                {'error': 'Failed to approve merchant'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        """Reject a merchant (admin only)."""
        try:
            merchant = self.get_object()
            
            if not merchant.is_approved:
                return APIResponse(
                    {'error': 'Merchant is not approved'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            merchant.is_approved = False
            merchant.approved_by = None
            merchant.approved_at = None
            merchant.save()
            
            return APIResponse({'message': 'Merchant rejected successfully'})
            
        except Exception as e:
            return APIResponse(
                {'error': 'Failed to reject merchant'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CustomerViewSet(viewsets.ModelViewSet):
    """ViewSet for managing customer profiles."""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Customer.objects.none()
        if user.user_type == 1:  # Admin
            return Customer.objects.all()
        return Customer.objects.filter(user=user)

    def list(self, request, *args, **kwargs):
        """List customers with proper permission filtering."""
        try:
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)
            
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
                
            serializer = self.get_serializer(queryset, many=True)
            return APIResponse(serializer.data)
            
        except Exception as e:
            return APIResponse(
                {'error': 'Failed to retrieve customers'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific customer."""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return APIResponse(serializer.data)
        except Exception as e:
            return APIResponse(
                {'error': 'Customer not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def submit_kyc(self, request, pk=None):
        customer = self.get_object()
        try:
            document = KYCService.submit_kyc(
                user=customer.user,
                document_type=request.data['document_type'],
                front_image=request.data['front_image'],
                back_image=request.data.get('back_image')
            )
            return APIResponse(
                KYCDocumentSerializer(document).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return APIResponse(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def kyc_status(self, request, pk=None):
        customer = self.get_object()
        documents = KYCDocument.objects.filter(user=customer.user)
        return APIResponse({
            'kyc_verified': customer.kyc_verified,
            'documents': KYCDocumentSerializer(documents, many=True).data
        })

    @action(detail=True, methods=['post'])
    def verify_biometrics(self, request, pk=None):
        customer = self.get_object()
        try:
            result = BiometricVerifier.verify_face(
                request.data['document_image_url'],
                request.data['selfie_image_url']
            )
            
            if result.get('error'):
                return APIResponse(result, status=status.HTTP_400_BAD_REQUEST)
                
            customer.user.biometric_data['face_match'] = result
            customer.user.verification_level = 2 if result['is_match'] else 0
            customer.user.last_biometric_verify = timezone.now()
            customer.user.save()
            
            return APIResponse(result)
        except Exception as e:
            return APIResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def check_liveness(self, request, pk=None):
        customer = self.get_object()
        try:
            result = BiometricVerifier.check_liveness(
                request.data['video_url']
            )
            
            if result.get('error'):
                return APIResponse(result, status=status.HTTP_400_BAD_REQUEST)
                
            customer.user.biometric_data['liveness'] = result
            if result['is_live']:
                customer.user.verification_level = 3
            customer.user.save()
            
            return APIResponse(result)
        except Exception as e:
            return APIResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class KYCDocumentViewSet(viewsets.ModelViewSet):
    queryset = KYCDocument.objects.all()
    serializer_class = KYCDocumentSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user__id=user_id)
        return queryset

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        document = self.get_object()
        document = KYCService.approve_kyc(
            document,
            request.user,
            request.data.get('notes', '')
        )
        return APIResponse(self.get_serializer(document).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        document = self.get_object()
        document = KYCService.reject_kyc(
            document,
            request.user,
            request.data['reason']
        )
        return APIResponse(self.get_serializer(document).data)


class KYCViewSet(viewsets.ViewSet):
    """ViewSet for KYC verification workflows"""
    permission_classes = [IsOwnerOrAdmin]

    @action(detail=False, methods=['post'], url_path='initiate')
    def initiate_verification(self, request):
        """Initiate KYC verification process"""
        try:
            document = KYCService.initiate_verification(
                user=request.user,
                document_type=request.data['document_type'],
                document_file=request.data['document_file']
            )
            return APIResponse(
                KYCDocumentSerializer(document).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return APIResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='status')
    def verification_status(self, request):
        """Check current KYC verification status"""
        try:
            document = KYCService.check_verification_status(request.user)
            return APIResponse(KYCDocumentSerializer(document).data)
        except Exception as e:
            return APIResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser], url_path='approve')
    def approve_verification(self, request, pk=None):
        """Approve KYC verification (admin only)"""
        try:
            document = KYCDocument.objects.get(pk=pk)
            document = KYCService.approve_verification(document)
            return APIResponse(KYCDocumentSerializer(document).data)
        except Exception as e:
            return APIResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser], url_path='reject')
    def reject_verification(self, request, pk=None):
        """Reject KYC verification with reason (admin only)"""
        try:
            document = KYCDocument.objects.get(pk=pk)
            document = KYCService.reject_verification(
                document,
                request.data['reason']
            )
            return APIResponse(KYCDocumentSerializer(document).data)
        except Exception as e:
            return APIResponse({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


def verify_email(request, token):
    """Verify user email using verification token"""
    try:
        user = get_object_or_404(User, verification_token=token)
        if user.is_verified:
            return APIResponse(
                {'message': 'Email already verified'},
                status=status.HTTP_200_OK
            )
            
        user.is_verified = True
        user.verification_token = None
        user.verified_at = timezone.now()
        user.save()
        
        return APIResponse({'message': 'Email successfully verified'})
    except Exception as e:
        return APIResponse(
            {'error': 'Invalid verification token'},
            status=status.HTTP_400_BAD_REQUEST
        )