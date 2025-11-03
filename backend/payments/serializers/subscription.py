from rest_framework import serializers
from ..models.subscription import Subscription

class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = '__all__'
        read_only_fields = ('status', 'created_at', 'updated_at')
