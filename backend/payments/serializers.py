from rest_framework import serializers
from .models import Payment, PaymentMethod, USSDTransaction, PaymentLog, ScheduledPayout, CrossBorderRemittance, DomesticTransfer
from .models.transaction import Transaction as PaymentTransaction
from .pos import POSDevice, POSTransaction
from users.serializers import MerchantSerializer
from .pos_integration import POSDeviceType, POSTransactionType
import croniter

class PaymentMethodSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = PaymentMethod
        fields = ['id', 'method_type', 'details', 'is_default', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class TransactionSerializer(serializers.ModelSerializer):
    customer_id = serializers.IntegerField(source='customer.id', read_only=True)
    merchant_id = serializers.IntegerField(source='merchant.id', read_only=True)
    customer_email = serializers.CharField(source='customer.user.email', read_only=True)
    customer_name = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    payment_method = serializers.SerializerMethodField()
    
    class Meta:
        model = PaymentTransaction
        fields = [
            'id',
            'customer_id',
            'merchant_id',
            'amount',
            'currency',
            'status',
            'payment_method',
            'created_at',
            'updated_at',
            'description',
            'customer_email',
            'customer_name',
            'type'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'status']
    
    def get_customer_name(self, obj):
        if obj.customer and obj.customer.user:
            return f"{obj.customer.user.first_name} {obj.customer.user.last_name}".strip()
        return ""
    
    def get_type(self, obj):
        # Determine transaction type based on context
        if obj.description and 'refund' in obj.description.lower():
            return 'refund'
        elif obj.merchant:
            return 'payment'
        else:
            return 'payout'
    
    def get_payment_method(self, obj):
        if obj.payment_method:
            return obj.payment_method.get_method_type_display()
        return None

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


# POS Serializers

class POSDeviceSerializer(serializers.ModelSerializer):
    """Serializer for POS Device model"""

    class Meta:
        model = POSDevice
        fields = [
            'device_id', 'device_type', 'device_name', 'device_info',
            'location', 'status', 'last_seen', 'created_at', 'updated_at'
        ]
        read_only_fields = ['device_id', 'created_at', 'updated_at', 'last_seen']


class POSDeviceRegistrationSerializer(serializers.Serializer):
    """Serializer for POS device registration"""

    device_type = serializers.ChoiceField(choices=[
        (POSDeviceType.VIRTUAL_TERMINAL, 'Virtual Terminal'),
        (POSDeviceType.MOBILE_READER, 'Mobile Reader'),
        (POSDeviceType.COUNTERTOP, 'Countertop Terminal'),
        (POSDeviceType.INTEGRATED, 'Integrated POS'),
        (POSDeviceType.KIOSK, 'Kiosk')
    ])
    device_name = serializers.CharField(max_length=100)
    device_info = serializers.JSONField(required=False, default=dict)

    def validate_device_type(self, value):
        """Validate device type"""
        valid_types = [POSDeviceType.VIRTUAL_TERMINAL, POSDeviceType.MOBILE_READER,
                      POSDeviceType.COUNTERTOP, POSDeviceType.INTEGRATED, POSDeviceType.KIOSK]
        if value not in valid_types:
            raise serializers.ValidationError(f"Invalid device type. Must be one of: {', '.join(valid_types)}")
        return value


class POSTransactionSerializer(serializers.ModelSerializer):
    """Serializer for POS Transaction model"""

    class Meta:
        model = POSTransaction
        fields = [
            'transaction_id', 'device_type', 'device_id', 'transaction_type',
            'amount', 'currency', 'status', 'card_last4', 'card_brand',
            'response_data', 'created_at'
        ]
        read_only_fields = ['transaction_id', 'created_at']


class POSTransactionCreateSerializer(serializers.Serializer):
    """Serializer for creating POS transactions"""

    device_id = serializers.CharField(max_length=50)
    device_type = serializers.ChoiceField(choices=[
        (POSDeviceType.VIRTUAL_TERMINAL, 'Virtual Terminal'),
        (POSDeviceType.MOBILE_READER, 'Mobile Reader'),
        (POSDeviceType.COUNTERTOP, 'Countertop Terminal'),
        (POSDeviceType.INTEGRATED, 'Integrated POS'),
        (POSDeviceType.KIOSK, 'Kiosk')
    ])
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    currency = serializers.CharField(max_length=3, default='USD')
    transaction_type = serializers.ChoiceField(choices=[
        (POSTransactionType.SALE, 'Sale'),
        (POSTransactionType.REFUND, 'Refund'),
        (POSTransactionType.VOID, 'Void'),
        (POSTransactionType.PRE_AUTH, 'Pre-authorization'),
        (POSTransactionType.CAPTURE, 'Capture')
    ], default=POSTransactionType.SALE)

    # Virtual Terminal specific fields
    card_data = serializers.JSONField(required=False)

    # Countertop Terminal specific fields
    terminal_ip = serializers.IPAddressField(required=False)
    terminal_port = serializers.IntegerField(min_value=1, max_value=65535, default=8080, required=False)

    # Optional fields
    customer_info = serializers.JSONField(required=False, default=dict)
    metadata = serializers.JSONField(required=False, default=dict)

    def validate(self, data):
        """Validate transaction data based on device type"""
        device_type = data.get('device_type')
        transaction_type = data.get('transaction_type')

        if device_type == POSDeviceType.VIRTUAL_TERMINAL:
            if not data.get('card_data'):
                raise serializers.ValidationError({
                    'card_data': 'Card data is required for virtual terminal transactions'
                })

        elif device_type == POSDeviceType.COUNTERTOP:
            if not data.get('terminal_ip'):
                raise serializers.ValidationError({
                    'terminal_ip': 'Terminal IP is required for countertop terminal transactions'
                })

        # Validate currency
        if data.get('currency') and len(data['currency']) != 3:
            raise serializers.ValidationError({
                'currency': 'Currency must be a 3-letter code'
            })

        return data


class DomesticTransferSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.user.get_full_name', read_only=True)
    recipient_name = serializers.CharField(source='recipient.name', read_only=True)
    payment_method_details = PaymentMethodSerializer(source='payment_method', read_only=True)
    
    # For input, accept recipient details
    recipient = serializers.DictField(write_only=True, required=True)
    
    class Meta:
        model = DomesticTransfer
        fields = [
            'id', 'sender', 'recipient', 'amount', 'currency', 'status',
            'reference_number', 'description', 'payment_method', 'fee',
            'processed_at', 'created_at', 'updated_at',
            'sender_name', 'recipient_name', 'payment_method_details', 'recipient_details'
        ]
        read_only_fields = ['id', 'reference_number', 'processed_at', 'created_at', 'updated_at', 'fee', 'sender', 'recipient']
    
    def create(self, validated_data):
        recipient_details = validated_data.pop('recipient')
        sender = validated_data['sender']
        
        # Create or get recipient
        recipient, created = Recipient.objects.get_or_create(
            user=sender.user,  # Assuming sender has user
            name=recipient_details['name'],
            recipient_type=recipient_details['type'],
            defaults={
                'phone': recipient_details.get('phone'),
                'account_number': recipient_details.get('accountNumber'),
                'bank_name': recipient_details.get('bankName'),
                'mobile_provider': recipient_details.get('mobileProvider'),
            }
        )
        
        validated_data['recipient'] = recipient
        
        # Generate reference number
        import uuid
        validated_data['reference_number'] = str(uuid.uuid4())[:16].upper()
        
        return super().create(validated_data)
