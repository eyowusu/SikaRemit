from django.db import models
from users.models import User

MOBILE_PROVIDERS = [
    ('mtn', 'MTN Mobile Money'),
    ('telecel', 'Telecel Cash'),
    ('airtel_tigo', 'AirtelTigo Money')
]

class PaymentMethod(models.Model):
    CARD = 'card'
    BANK = 'bank'
    CRYPTO = 'crypto'
    MTN_MOMO = 'mtn_momo'
    TELECEL = 'telecel'
    AIRTEL_TIGO = 'airtel_tigo'
    QR = 'qr'
    
    METHOD_CHOICES = [
        (CARD, 'Credit/Debit Card'),
        (BANK, 'Bank Transfer'),
        (CRYPTO, 'Cryptocurrency'),
        (MTN_MOMO, 'MTN Mobile Money'),
        (TELECEL, 'Telecel Cash'),
        (AIRTEL_TIGO, 'AirtelTigo Money'),
        (QR, 'QR Payment')
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    method_type = models.CharField(
        max_length=20,  # Increased with ample buffer
        choices=METHOD_CHOICES
    )
    details = models.JSONField()
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_method_type_display()} - {self.user.email}"
