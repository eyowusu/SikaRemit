from django.db import models
from users.models import Merchant


class POSDevice(models.Model):
    """POS hardware devices"""
    DEVICE_TYPES = [
        ('virtual_terminal', 'Virtual Terminal'),
        ('mobile_reader', 'Mobile Reader'),
        ('countertop', 'Countertop Terminal'),
        ('integrated', 'Integrated POS'),
        ('kiosk', 'Self-Service Kiosk'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('maintenance', 'Maintenance'),
        ('decommissioned', 'Decommissioned'),
    ]

    device_id = models.CharField(max_length=50, unique=True, db_index=True)
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='pos_devices')
    device_type = models.CharField(max_length=20, choices=DEVICE_TYPES)
    device_name = models.CharField(max_length=100)
    device_info = models.JSONField(default=dict)
    location = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    last_seen = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['merchant', 'status']),
            models.Index(fields=['device_type']),
        ]

    def __str__(self):
        return f"{self.device_name} ({self.device_id})"


class POSTransaction(models.Model):
    """POS transaction records"""
    TRANSACTION_TYPES = [
        ('sale', 'Sale'),
        ('refund', 'Refund'),
        ('void', 'Void'),
        ('pre_auth', 'Pre-Authorization'),
        ('capture', 'Capture'),
    ]

    transaction_id = models.CharField(max_length=100, unique=True, db_index=True)
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='pos_transactions')
    device_type = models.CharField(max_length=20)
    device_id = models.CharField(max_length=50, blank=True)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20)
    card_last4 = models.CharField(max_length=4, blank=True)
    card_brand = models.CharField(max_length=20, blank=True)
    response_data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['merchant', 'created_at']),
            models.Index(fields=['device_id']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"POS {self.transaction_id}: {self.amount} {self.currency}"
