from rest_framework import serializers
from ..models.cross_border import CrossBorderRemittance

class CrossBorderRemittanceSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.user.email', read_only=True)
    
    class Meta:
        model = CrossBorderRemittance
        fields = [
            'id', 'reference_number', 'sender', 'sender_name', 'recipient_name',
            'recipient_phone', 'recipient_country', 'amount_sent', 'amount_received',
            'exchange_rate', 'fee', 'status', 'created_at', 'exempt_status'
        ]
        read_only_fields = ['id', 'reference_number', 'amount_received', 'exchange_rate', 'created_at']
