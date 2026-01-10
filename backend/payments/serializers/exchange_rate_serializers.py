from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ExchangeRate, ExchangeRateHistory, ExchangeRateAlert

User = get_user_model()


class ExchangeRateSerializer(serializers.ModelSerializer):
    """Serializer for ExchangeRate model"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)
    is_currently_effective = serializers.BooleanField(read_only=True)

    class Meta:
        model = ExchangeRate
        fields = [
            'id', 'from_currency', 'to_currency', 'rate', 'source',
            'is_active', 'effective_from', 'effective_until',
            'created_by', 'updated_by', 'created_by_name', 'updated_by_name',
            'notes', 'created_at', 'updated_at', 'is_currently_effective'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by_name', 'updated_by_name']


class ExchangeRateHistorySerializer(serializers.ModelSerializer):
    """Serializer for ExchangeRateHistory model"""
    rate_display = serializers.CharField(source='rate.__str__', read_only=True)
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)

    class Meta:
        model = ExchangeRateHistory
        fields = [
            'id', 'rate', 'rate_display', 'old_rate', 'new_rate',
            'changed_by', 'changed_by_name', 'changed_at',
            'change_reason', 'notes'
        ]


class ExchangeRateAlertSerializer(serializers.ModelSerializer):
    """Serializer for ExchangeRateAlert model"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    notify_users_names = serializers.SerializerMethodField()

    class Meta:
        model = ExchangeRateAlert
        fields = [
            'id', 'alert_type', 'from_currency', 'to_currency',
            'threshold_rate', 'change_percentage',
            'notify_users', 'notify_users_names', 'notify_emails',
            'is_active', 'last_triggered',
            'created_by', 'created_by_name', 'created_at'
        ]

    def get_notify_users_names(self, obj):
        return [user.get_full_name() for user in obj.notify_users.all()]


class ExchangeRateBulkUpdateSerializer(serializers.Serializer):
    """Serializer for bulk updating exchange rates"""
    rates = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField(),
            allow_empty=False
        ),
        allow_empty=False
    )

    def validate_rates(self, value):
        """Validate that each rate has required fields"""
        for rate_data in value:
            required_fields = ['from_currency', 'to_currency', 'rate']
            missing_fields = [field for field in required_fields if field not in rate_data]

            if missing_fields:
                raise serializers.ValidationError(
                    f"Rate data missing required fields: {', '.join(missing_fields)}"
                )

            # Validate currency codes are 3 characters
            if len(rate_data['from_currency']) != 3 or len(rate_data['to_currency']) != 3:
                raise serializers.ValidationError(
                    "Currency codes must be exactly 3 characters"
                )

        return value
