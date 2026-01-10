import logging
from datetime import datetime
import requests
import json
from django.conf import settings

logger = logging.getLogger(__name__)

class PaymentMonitor:
    """Automated credential and payment monitoring"""
    
    @staticmethod
    def _send_slack_alert(message):
        """Send alert to Slack webhook"""
        if not hasattr(settings, 'SLACK_WEBHOOK_URL'):
            return
            
        requests.post(
            settings.SLACK_WEBHOOK_URL,
            json={
                'text': f"🚨 Payment System Alert: {message}",
                'username': 'Payment Monitor',
                'icon_emoji': ':credit_card:'
            },
            timeout=5
        )

    @classmethod
    def check_paystack_health(cls):
        """Verify Paystack API connectivity"""
        try:
            response = requests.get(
                'https://api.paystack.co/transaction',
                headers={'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}'},
                timeout=5
            )
            
            if response.status_code == 200:
                return True
                
            cls._send_slack_alert(f"Paystack API failure (HTTP {response.status_code})")
            logger.error(f"Paystack API failure: {response.status_code}")
            return False
            
        except Exception as e:
            cls._send_slack_alert(f"Monitoring failed: {str(e)}")
            logger.critical(f"Paystack monitoring failed: {str(e)}")
            raise
    
    @classmethod
    def audit_credentials(cls):
        """Log credential details without exposing secrets"""
        return {
            'timestamp': datetime.now().isoformat(),
            'paystack_key_active': settings.PAYSTACK_SECRET_KEY[-6:] != 'xxxxxx',
            'stripe_key_active': settings.STRIPE_SECRET_KEY[-6:] != 'xxxxxx',
            'last_rotation': settings.LAST_KEY_ROTATION if hasattr(settings, 'LAST_KEY_ROTATION') else 'Never'
        }
