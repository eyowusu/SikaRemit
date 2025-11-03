from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import AdminActivity, BackupVerification, PasswordResetToken, AuthLog, Transaction, Product, Session, User, Customer, Merchant, Notification, Payout
from payments.models.payment_log import PaymentLog
from payments.models.cross_border import CrossBorderRemittance
from payments.models.payment import Payment
from django.utils.module_loading import import_string
from django.core.exceptions import ValidationError
from drf_spectacular.utils import extend_schema_serializer

User = get_user_model()

class UserRegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    user_type = serializers.IntegerField(required=True)
    username = serializers.CharField(required=False)
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    phone = serializers.CharField(required=False)

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        return attrs

    def validate_password(self, value):
        errors = []
        for validator_config in []:
            try:
                validator = import_string(validator_config['NAME'])(**validator_config.get('OPTIONS', {}))
                validator.validate(value)
            except ValidationError as e:
                errors.append({
                    'code': e.code,
                    'message': str(e)
                })
        
        if errors:
            raise serializers.ValidationError(errors)
        return value

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            from django.contrib.auth import authenticate
            from django.contrib.auth import get_user_model
            
            User = get_user_model()
            
            # Try to authenticate with the given email and password
            user = authenticate(request=self.context.get('request'), 
                              username=email,  # Using email as username
                              password=password)
            
            if not user:
                # If authentication fails, try to find the user by email first
                try:
                    user = User.objects.get(email=email)
                    if not user.check_password(password):
                        raise serializers.ValidationError('Invalid email or password.')
                except User.DoesNotExist:
                    raise serializers.ValidationError('Invalid email or password.')
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
                
            if user.mfa_enabled:
                raise serializers.ValidationError('mfa_required')
                
            attrs['user'] = user
            return attrs
        
        return attrs

class AccountsUserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    
    def get_role(self, obj):
        role_mapping = {
            1: 'admin',
            2: 'merchant', 
            3: 'customer'
        }
        return role_mapping.get(obj.user_type, 'customer')
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_verified']
        read_only_fields = ['id', 'role', 'is_verified']
        component_name = 'AccountsUser'

class AccountsTransactionSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField()
    recipient = serializers.StringRelatedField()
    
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['created_at', 'completed_at']
        component_name = 'AccountsTransaction'

class AdminActivitySerializer(serializers.ModelSerializer):
    admin_email = serializers.EmailField(source='admin.email', read_only=True)
    
    class Meta:
        model = AdminActivity
        fields = [
            'id',
            'admin_email',
            'action_type',
            'object_type',
            'object_id',
            'ip_address',
            'timestamp',
            'metadata'
        ]
        read_only_fields = fields

class BackupVerificationSerializer(serializers.ModelSerializer):
    verified_by_email = serializers.EmailField(source='verified_by.email', read_only=True)
    
    class Meta:
        model = BackupVerification
        fields = [
            'id',
            'verification_type',
            'started_at',
            'completed_at',
            'status',
            'checksum',
            'file_size',
            'verified_by_email',
            'notes'
        ]
        read_only_fields = ['started_at', 'completed_at', 'status', 'verified_by_email']

class SessionSerializer(serializers.ModelSerializer):
    device_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Session
        fields = ['id', 'ip_address', 'user_agent', 'device_info', 'created_at', 'expiry_date']
    
    def get_device_info(self, obj):
        return {
            'is_mobile': 'Mobile' in obj.user_agent,
            'browser': self._parse_browser(obj.user_agent),
            'os': self._parse_os(obj.user_agent)
        }

class PasswordResetTokenSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = PasswordResetToken
        fields = [
            'id',
            'user_email',
            'token',
            'created_at',
            'expires_at',
            'used'
        ]
        read_only_fields = ['user_email', 'token', 'created_at']

class AuthLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = AuthLog
        fields = [
            'id',
            'user_email',
            'ip_address',
            'device_id',
            'success',
            'reason',
            'timestamp'
        ]
        read_only_fields = fields

class PaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField(max_length=3)
    payment_method = serializers.CharField(max_length=20)
    metadata = serializers.JSONField(required=False, default=dict)

class PaymentLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    metadata = serializers.JSONField()
    
    class Meta:
        model = PaymentLog
        fields = '__all__'
        read_only_fields = ['created_at', 'error']

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'store']
        extra_kwargs = {
            'store': {'required': True}
        }

class ProductInventorySerializer(serializers.ModelSerializer):
    available = serializers.IntegerField()
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'available']

class MerchantProductSerializer(serializers.ModelSerializer):
    merchant_email = serializers.EmailField(source='store.email', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 
            'name', 
            'description', 
            'price',
            'merchant_email',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['merchant_email', 'created_at', 'updated_at']
        extra_kwargs = {
            'price': {'min_value': 0.01}
        }
    
    def validate(self, data):
        # Ensure price is positive
        if 'price' in data and data['price'] <= 0:
            raise serializers.ValidationError({'price': 'Price must be greater than 0'})
        return data

class RemittancePaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrossBorderRemittance
        fields = [
            'id', 'amount_sent', 'recipient_name', 
            'recipient_phone', 'recipient_country', 'created_at'
        ]
        extra_kwargs = {
            'amount_sent': {'min_value': 0.01}
        }

class BillPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'amount', 'bill_issuer', 
            'bill_reference', 'due_date', 'created_at'
        ]
        extra_kwargs = {
            'amount': {'min_value': 0.01},
            'due_date': {'required': True}
        }

class CheckoutSerializer(serializers.ModelSerializer):
    items = serializers.JSONField()
    payment_method = serializers.CharField(max_length=20)
    payment_token = serializers.CharField(required=False)
    shipping_address = serializers.CharField(required=False)
    
    class Meta:
        model = PaymentLog
        fields = [
            'items', 'amount', 'payment_type',
            'mobile_money_provider', 'mobile_money_number',
            'payment_method', 'payment_token', 'shipping_address'
        ]
        extra_kwargs = {
            'amount': {'min_value': 0.01}
        }
    
    def validate_payment_method(self, value):
        valid_methods = ['CARD', 'BANK_TRANSFER', 'WALLET', 'MOBILE_MONEY', 
                        'GOOGLE_PAY', 'APPLE_PAY', 'QR_CODE']
        if value not in valid_methods:
            raise serializers.ValidationError('Invalid payment method')
        return value
    
    def validate(self, data):
        if data['payment_method'] == 'CARD' and not data.get('payment_token'):
            raise serializers.ValidationError('Payment token required for card payments')
        if data['payment_method'] == 'MOBILE_MONEY' and not data.get('mobile_money_number'):
            raise serializers.ValidationError('Mobile money number required')
        return data

class SubscriptionPaymentSerializer(serializers.ModelSerializer):
    subscriber_email = serializers.EmailField(source='customer.email', read_only=True)
    
    class Meta:
        model = PaymentLog
        fields = [
            'id', 'amount', 'subscriber_email', 
            'subscription_id', 'billing_cycle', 'next_billing_date', 'created_at'
        ]
        extra_kwargs = {
            'amount': {'min_value': 0.01},
            'next_billing_date': {'required': True}
        }

class CustomerSerializer(serializers.ModelSerializer):
    user = AccountsUserSerializer(read_only=True)
    
    class Meta:
        model = Customer
        fields = '__all__'

class MerchantSerializer(serializers.ModelSerializer):
    user = AccountsUserSerializer(read_only=True)
    
    class Meta:
        model = Merchant
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'notification_type_display',
            'title',
            'message',
            'is_read',
            'created_at',
            'metadata'
        ]
        read_only_fields = ['created_at', 'metadata']

class PayoutSerializer(serializers.ModelSerializer):
    merchant_email = serializers.EmailField(source='merchant.email', read_only=True)
    
    class Meta:
        model = Payout
        fields = ['id', 'merchant', 'merchant_email', 'amount', 'status', 'method', 'reference', 'created_at']
        extra_kwargs = {
            'merchant': {'write_only': True}
        }
