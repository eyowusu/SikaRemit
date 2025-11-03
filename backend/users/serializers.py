from rest_framework import serializers
from .models import KYCDocument, User, Merchant, Customer

class KYCDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCDocument
        fields = '__all__'
        read_only_fields = ('status', 'reviewed_by', 'reviewed_at', 'rejection_reason')
        extra_kwargs = {
            'front_image': {'write_only': True},
            'back_image': {'write_only': True},
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not self.context.get('include_images', False):
            data.pop('front_image_url', None)
            data.pop('back_image_url', None)
        return data

class UserSerializer(serializers.ModelSerializer):
    verification_level = serializers.IntegerField(read_only=True)
    last_biometric_verify = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'user_type', 'is_verified', 'verification_level', 'last_biometric_verify')
        read_only_fields = ('id', 'is_verified')
        component_name = 'UsersUser'

class MerchantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Merchant
        fields = '__all__'

class CustomerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Customer
        fields = '__all__'
