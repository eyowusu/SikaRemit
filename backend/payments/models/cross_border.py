from django.db import models
from django.utils import timezone
import uuid
# from .compliance import GhanaRemittanceCompliance  # TODO: Create this class

class CrossBorderRemittance(models.Model):
    """Model for international money transfers"""
    PENDING = 'pending'
    PROCESSING = 'processing'
    COMPLETED = 'completed'
    FAILED = 'failed'
    
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (PROCESSING, 'Processing'),
        (COMPLETED, 'Completed'),
        (FAILED, 'Failed'),
    ]
    
    EXEMPTION_STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('revoked', 'Revoked')
    ]
    
    sender = models.ForeignKey('accounts.Customer', on_delete=models.PROTECT, related_name='sent_remittances')
    recipient_name = models.CharField(max_length=100)
    recipient_phone = models.CharField(max_length=20)
    recipient_country = models.CharField(max_length=3)  # ISO code
    amount_sent = models.DecimalField(max_digits=12, decimal_places=2)
    amount_received = models.DecimalField(max_digits=12, decimal_places=2)
    exchange_rate = models.DecimalField(max_digits=8, decimal_places=4)
    fee = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    reference_number = models.CharField(max_length=50, unique=True, default=uuid.uuid4)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reported_to_regulator = models.BooleanField(default=False)
    report_reference = models.CharField(max_length=50, blank=True)
    source_of_funds_verified = models.BooleanField(default=False)
    recipient_verified = models.BooleanField(default=False)
    exempt_status = models.CharField(
        max_length=20,
        blank=True,
        # choices=[(e, e) for e in GhanaRemittanceCompliance.EXEMPT_ENTITIES]  # TODO: Fix when class exists
    )
    exemption_status = models.CharField(
        max_length=10,
        choices=EXEMPTION_STATUS_CHOICES,
        blank=True,
        null=True
    )
    exemption_approver = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_exemptions'
    )
    exemption_notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.reference_number}: {self.amount_sent}→{self.recipient_country}"
    
    def requires_reporting(self):
        """Check if transaction meets BoG reporting threshold"""
        from django.conf import settings
        return self.amount_sent >= settings.REPORTING_THRESHOLD
    
    def can_request_exemption(self):
        """Check if exemption can be requested"""
        return self.exemption_status in [None, 'rejected', 'revoked']
    
    def approve_exemption(self, user, notes=''):
        """Approve exemption request"""
        self.exemption_status = 'approved'
        self.exemption_approver = user
        self.exemption_notes = notes
        self.save()
    
    def reject_exemption(self, user, notes):
        """Reject exemption request"""
        if not notes:
            raise ValueError("Rejection reason is required")
        self.exemption_status = 'rejected'
        self.exemption_approver = user
        self.exemption_notes = notes
        self.save()
    
    class Meta:
        verbose_name = 'Cross-Border Remittance'
        verbose_name_plural = 'Cross-Border Remittances'
