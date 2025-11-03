from django.db import models
from users.models import User

class NotificationPreferences(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_prefs')
    email_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)
    push_enabled = models.BooleanField(default=True)
    web_enabled = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Preferences for {self.user.email}"

class Notification(models.Model):
    INFO = 'info'
    WARNING = 'warning'
    SUCCESS = 'success'
    ERROR = 'error'
    PAYMENT = 'payment'
    SECURITY = 'security'
    
    LEVEL_CHOICES = [
        (INFO, 'Info'),
        (WARNING, 'Warning'),
        (SUCCESS, 'Success'),
        (ERROR, 'Error'),
        (PAYMENT, 'Payment'),
        (SECURITY, 'Security'),
    ]
    
    PAYMENT_RECEIVED = 'payment_received'
    PAYMENT_FAILED = 'payment_failed'
    WITHDRAWAL = 'withdrawal'
    
    TYPE_CHOICES = [
        (PAYMENT_RECEIVED, 'Payment Received'),
        (PAYMENT_FAILED, 'Payment Failed'),
        (WITHDRAWAL, 'Withdrawal'),
    ]
    
    CHANNEL_CHOICES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('push', 'Push'),
        ('web', 'Web'),
    ]
    
    SCHEDULED = 'scheduled'
    EXPIRING = 'expiring'
    ACTIONABLE = 'actionable'
    
    CATEGORY_CHOICES = [
        (SCHEDULED, 'Scheduled'),
        (EXPIRING, 'Expiring'),
        (ACTIONABLE, 'Actionable'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    message = models.TextField()
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, default=INFO)
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    push_sent = models.BooleanField(default=False)
    push_received = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES, default='web')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='')
    scheduled_for = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    actions = models.JSONField(default=list)
    delivery_attempts = models.PositiveSmallIntegerField(default=0)
    last_attempt = models.DateTimeField(null=True, blank=True)
    delivery_metrics = models.JSONField(default=dict)
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
