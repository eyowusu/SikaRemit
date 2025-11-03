from django.contrib.auth import get_user_model
from .models import Merchant, Customer, KYCDocument
from core.response import APIResponse
from django.db.models import Q

User = get_user_model()

class UserService:
    @staticmethod
    def create_user(email, password, user_type, **extra_fields):
        if User.objects.filter(email=email).exists():
            raise ValueError('User with this email already exists')
            
        user = User.objects.create_user(
            email=email,
            password=password,
            user_type=user_type,
            **extra_fields
        )
        
        # Create profile based on type
        if user_type == 2:  # merchant
            Merchant.objects.create(user=user)
        elif user_type == 3:  # customer
            Customer.objects.create(user=user)
            
        return user
    
    @staticmethod
    def get_user_profile(user):
        if user.user_type == 2:
            return user.merchant_profile
        elif user.user_type == 3:
            return user.customer_profile
        return None

    @staticmethod
    def search_users(query=None, user_type=None):
        queryset = User.objects.all()
        
        if query:
            queryset = queryset.filter(
                Q(email__icontains=query) |
                Q(username__icontains=query)
            )
            
        if user_type:
            queryset = queryset.filter(user_type=user_type)
            
        return queryset
    
    @staticmethod
    def filter_merchants(is_approved=None, business_name=None):
        queryset = Merchant.objects.select_related('user')
        
        if is_approved is not None:
            queryset = queryset.filter(is_approved=is_approved)
            
        if business_name:
            queryset = queryset.filter(business_name__icontains=business_name)
            
        return queryset


class KYCService:
    @staticmethod
    def initiate_verification(user, document_type, document_file):
        """Start KYC verification process"""
        # Validate document
        if not document_file:
            raise ValueError('Document file is required')
            
        # Create KYC record
        kyc_doc = KYCDocument.objects.create(
            user=user,
            document_type=document_type,
            document_file=document_file,
            status='PENDING'
        )
        
        # Here you would typically:
        # 1. Upload to verification service
        # 2. Initiate background check
        # 3. Send confirmation email
        
        return kyc_doc
    
    @staticmethod
    def check_verification_status(user):
        """Get current KYC status for user"""
        return KYCDocument.objects.filter(user=user).latest('created_at')
    
    @staticmethod
    def approve_verification(kyc_document):
        """Mark KYC as approved"""
        kyc_document.status = 'APPROVED'
        kyc_document.save()
        # Additional approval logic would go here
        return kyc_document
    
    @staticmethod
    def reject_verification(kyc_document, reason):
        """Mark KYC as rejected with reason"""
        kyc_document.status = 'REJECTED'
        kyc_document.rejection_reason = reason
        kyc_document.save()
        # Additional rejection logic would go here
        return kyc_document
