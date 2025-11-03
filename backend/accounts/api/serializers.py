from rest_framework import serializers
from ..models import UserActivity

class UserActivitySerializer(serializers.ModelSerializer):
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    
    class Meta:
        model = UserActivity
        fields = [
            'id', 
            'event_type',
            'event_type_display',
            'ip_address',
            'metadata',
            'created_at'
        ]
