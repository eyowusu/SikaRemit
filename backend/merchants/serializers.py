from django.db.models import Q
from rest_framework import serializers
from .models import Store, Product, MerchantOnboarding
from users.serializers import MerchantSerializer

class StoreSerializer(serializers.ModelSerializer):
    merchant = MerchantSerializer(read_only=True)
    
    class Meta:
        model = Store
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'merchant')
        
    def validate_name(self, value):
        """Ensure store name is unique per merchant"""
        if Store.objects.filter(
            merchant=self.context['request'].user.merchant_profile,
            name=value
        ).exists():
            raise serializers.ValidationError("You already have a store with this name")
        return value

class ProductSerializer(serializers.ModelSerializer):
    store = serializers.PrimaryKeyRelatedField(queryset=Store.objects.all())
    is_low_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'is_low_stock')
        
    def validate_price(self, value):
        """Ensure price is positive"""
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero")
        return value
        
    def validate_store(self, value):
        """Ensure product is being added to merchant's own store"""
        if value.merchant.user != self.context['request'].user:
            raise serializers.ValidationError("You can only add products to your own stores")
        return value

class OnboardingSerializer(serializers.ModelSerializer):
    """Handles merchant onboarding data"""
    class Meta:
        model = MerchantOnboarding
        fields = ['status', 'current_step', 'total_steps', 'data']
        read_only_fields = ['status', 'current_step', 'total_steps']
    
    def validate(self, data):
        """Validate onboarding data based on current step"""
        instance = self.instance
        
        # Business info step validation
        if instance.current_step == 1:
            required_fields = ['business_name', 'business_type', 'tax_id']
            for field in required_fields:
                if field not in data.get('data', {}):
                    raise serializers.ValidationError(f"{field} is required")
        
        # Bank details step validation
        elif instance.current_step == 2:
            required_fields = ['account_number', 'bank_name', 'account_name']
            for field in required_fields:
                if field not in data.get('data', {}):
                    raise serializers.ValidationError(f"{field} is required")
        
        return data

class VerificationSerializer(serializers.Serializer):
    """Handles merchant verification documents"""
    document_type = serializers.CharField()
    document_file = serializers.FileField()
    
    def validate_document_type(self, value):
        valid_types = ['id_card', 'business_license', 'tax_certificate']
        if value not in valid_types:
            raise serializers.ValidationError("Invalid document type")
        return value
