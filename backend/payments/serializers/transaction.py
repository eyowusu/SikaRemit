from rest_framework import serializers
from payments.models.transaction import Transaction
from users.serializers import UserSerializer

class TransactionSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    merchant = UserSerializer(read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id',
            'customer',
            'merchant',
            'amount',
            'currency',
            'status',
            'payment_method',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'status']
        component_name = 'PaymentsTransaction'
        
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be positive')
        return value
