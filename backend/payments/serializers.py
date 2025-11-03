from rest_framework import serializers
from .models import Payment, PaymentMethod, Transaction, USSDTransaction, PaymentLog, ScheduledPayout, BillPayment, CrossBorderRemittance
from users.serializers import MerchantSerializer
import croniter

class PaymentMethodSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = PaymentMethod
        fields = ['id', 'method_type', 'details', 'is_default', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class USSDTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = USSDTransaction
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'accounting_sync_status', 'accounting_ref', 'last_sync_attempt']

class BillPaymentSerializer(serializers.ModelSerializer):
    billIssuer = serializers.CharField(source='bill_issuer', required=True)
    dueDate = serializers.DateField(source='due_date', required=True)
    billReference = serializers.CharField(source='bill_reference', required=True)
    billType = serializers.CharField(source='bill_type', required=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'amount', 'status', 'created_at',
            'billIssuer', 'billReference', 'dueDate', 'billType',
            'is_remitted', 'remittance_date', 'remittance_reference'
        ]
        read_only_fields = [
            'id', 'status', 'created_at',
            'is_remitted', 'remittance_date', 'remittance_reference'
        ]

class SubscriptionSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    
    class Meta:
        model = PaymentLog
        fields = [
            'id', 'user', 'amount', 'subscription_id',
            'billing_cycle', 'next_billing_date', 'status', 'created_at'
        ]
        read_only_fields = ('created_at', 'status')

class ScheduledPayoutSerializer(serializers.ModelSerializer):
    merchant_detail = MerchantSerializer(source='merchant', read_only=True)
    
    class Meta:
        model = ScheduledPayout
        fields = [
            'id',
            'merchant',
            'merchant_detail',
            'amount',
            'schedule',
            'next_execution',
            'status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['next_execution', 'created_at', 'updated_at']
        
    def validate_schedule(self, value):
        """Validate cron expression format"""
        try:
            croniter.croniter(value)
            return value
        except ValueError:
            raise serializers.ValidationError("Invalid cron expression format")

class CrossBorderRemittanceSerializer(serializers.ModelSerializer):
    """Serializer for cross-border remittance transactions"""
    recipientName = serializers.CharField(source='recipient_name', required=True)
    recipientPhone = serializers.CharField(source='recipient_phone', required=True)  
    recipientCountry = serializers.CharField(source='recipient_country', required=True)
    
    class Meta:
        model = CrossBorderRemittance
        fields = [
            'id', 'reference_number', 'sender',
            'recipientName', 'recipientPhone', 'recipientCountry',
            'amount_sent', 'amount_received', 'exchange_rate',
            'fee', 'status', 'created_at'
        ]
        read_only_fields = [
            'id', 'reference_number', 'amount_received',
            'exchange_rate', 'fee', 'status', 'created_at'
        ]
