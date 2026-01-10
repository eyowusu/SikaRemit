from django.db import models
from django.conf import settings
from .transaction import Transaction

class Dispute(models.Model):
    OPEN = 'open'
    UNDER_REVIEW = 'under_review'
    RESOLVED = 'resolved'
    CLOSED = 'closed'

    STATUS_CHOICES = [
        (OPEN, 'Open'),
        (UNDER_REVIEW, 'Under Review'),
        (RESOLVED, 'Resolved'),
        (CLOSED, 'Closed'),
    ]

    transaction = models.OneToOneField(Transaction, on_delete=models.CASCADE, related_name='dispute')
    reason = models.TextField(help_text="Reason for the dispute")
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default=OPEN)
    resolution = models.TextField(null=True, blank=True, help_text="Resolution details")

    # Tracking
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_disputes')
    resolved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True, blank=True, related_name='resolved_disputes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Dispute for Transaction {self.transaction.id}"

    def resolve(self, admin_user, resolution_text):
        """Resolve the dispute"""
        from django.utils import timezone

        self.status = self.RESOLVED
        self.resolution = resolution_text
        self.resolved_by = admin_user
        self.resolved_at = timezone.now()
        self.save()

    def close(self, admin_user):
        """Close the dispute without resolution"""
        from django.utils import timezone

        self.status = self.CLOSED
        self.resolved_by = admin_user
        self.resolved_at = timezone.now()
        self.save()
