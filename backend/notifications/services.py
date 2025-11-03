from django.conf import settings
from django.core.mail import send_mail
from twilio.rest import Client
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification, NotificationPreferences
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    def send_email_notification(user, subject, message):
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            return True
        except Exception as e:
            logger.error(f"Email send failed: {str(e)}")
            return False

    @staticmethod
    def send_sms_notification(user, message):
        if not user.phone:
            return False
            
        try:
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=user.phone
            )
            return True
        except Exception as e:
            logger.error(f"SMS send failed: {str(e)}")
            return False

    @classmethod
    def create_notification(cls, user, title, message, level='info', notification_type=None, metadata=None):
        notification = Notification.objects.create(
            user=user,
            title=title,
            message=message,
            level=level,
            notification_type=notification_type,
            metadata=metadata or {}
        )
        
        # Send email for important notifications
        if level in ['warning', 'error', 'payment', 'security']:
            cls.send_email_notification(user, title, message)
            
        # Send SMS for critical notifications
        if level in ['error', 'security']:
            cls.send_sms_notification(user, f"{title}: {message}")
            
        # Send web notification
        cls.send_web_notification(user, notification)
        
        # Send push notification
        cls.send_push_notification(user, notification)
        
        return notification

    @classmethod
    def send_web_notification(cls, user, notification):
        channel_layer = get_channel_layer()
        try:
            async_to_sync(channel_layer.group_send)(
                f"notifications_{user.id}",
                {
                    "type": "notification.message",
                    "notification": {
                        "id": notification.id,
                        "title": notification.title,
                        "message": notification.message,
                        "created_at": notification.created_at.isoformat()
                    }
                }
            )
            return True
        except Exception as e:
            logger.error(f"Web notification failed: {str(e)}")
            return False
            
    @classmethod
    def send_push_notification(cls, user, notification):
        if not NotificationPreferences.objects.get(user=user).push_enabled:
            return False
            
        try:
            # Implementation would use Firebase Cloud Messaging or similar
            # This is a placeholder for the actual push notification logic
            return cls._send_fcm_push(user, notification)
        except Exception as e:
            logger.error(f"Push notification failed: {str(e)}")
            return False
            
    @classmethod
    def _send_fcm_push(cls, user, notification):
        try:
            from fcm_django.models import FCMDevice
            device = FCMDevice.objects.filter(user=user).first()
            
            if not device:
                return False
                
            result = device.send_message(
                title=notification.title,
                body=notification.message,
                data={
                    'notification_id': str(notification.id),
                    'type': notification.notification_type,
                    **notification.metadata
                }
            )
            
            notification.push_sent = True
            notification.delivery_metrics['fcm'] = {
                'sent_at': timezone.now().isoformat(),
                'message_id': getattr(result, 'message_id', None)
            }
            notification.save()
            return True
            
        except Exception as e:
            logger.error(f"FCM push failed: {str(e)}")
            return False

    @classmethod
    def mark_as_read(cls, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id)
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save()
            return True
        except Notification.DoesNotExist:
            return False

    @classmethod
    def create_bulk_notifications(cls, users, title, message, **kwargs):
        notifications = []
        for user in users:
            notification = cls.create_notification(user, title, message, **kwargs)
            notifications.append(notification)
        return notifications

    @classmethod
    def deliver_with_retry(cls, notification, max_attempts=3):
        if notification.delivery_attempts >= max_attempts:
            return False
            
        try:
            notification.delivery_attempts += 1
            notification.last_attempt = timezone.now()
            notification.save()
            
            # Exponential backoff
            delay = min(60 * (2 ** (notification.delivery_attempts - 1)), 3600)
            
            if notification.category == 'scheduled' and notification.scheduled_for > timezone.now():
                return True  # Will be handled by scheduler
                
            success = cls._deliver_notification(notification)
            
            if success:
                notification.delivery_metrics['delivered_at'] = timezone.now().isoformat()
                notification.save()
                return True
                
            return False
        except Exception as e:
            logger.error(f"Notification delivery failed: {str(e)}")
            return False
    
    @classmethod
    def _deliver_notification(cls, notification):
        # Actual delivery logic for all channels
        # Send email for important notifications
        if notification.level in ['warning', 'error', 'payment', 'security']:
            cls.send_email_notification(notification.user, notification.title, notification.message)
            
        # Send SMS for critical notifications
        if notification.level in ['error', 'security']:
            cls.send_sms_notification(notification.user, f"{notification.title}: {notification.message}")
            
        # Send web notification
        cls.send_web_notification(notification.user, notification)
        
        # Send push notification
        cls.send_push_notification(notification.user, notification)
        
        return True
