from rest_framework import serializers
from ..models.fees import FeeConfiguration


class FeeConfigurationSerializer(serializers.ModelSerializer):
    # Explicitly declare merchant as optional
    merchant = serializers.IntegerField(required=False, allow_null=True, default=None)

    class Meta:
        model = FeeConfiguration
        fields = '__all__'
        read_only_fields = ['created_by', 'approved_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Automatically set created_by from the request user
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
        
        # Handle merchant field - convert ID to object or set to None
        merchant_id = validated_data.pop('merchant', None)
        if merchant_id:
            from users.models import Merchant
            try:
                validated_data['merchant'] = Merchant.objects.get(id=merchant_id)
            except Merchant.DoesNotExist:
                validated_data['merchant'] = None
        else:
            validated_data['merchant'] = None
        
        # Set is_platform_default=True for platform-wide configs (no merchant, no corridors)
        if validated_data.get('merchant') is None:
            if not validated_data.get('corridor_from') and not validated_data.get('corridor_to'):
                validated_data['is_platform_default'] = True
            
        return super().create(validated_data)
