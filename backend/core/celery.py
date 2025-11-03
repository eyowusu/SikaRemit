from __future__ import absolute_import
import os
from celery import Celery
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Scheduled tasks
app.conf.beat_schedule = {
    'process-scheduled-notifications': {
        'task': 'notifications.tasks.process_scheduled_notifications',
        'schedule': 300.0,  # Every 5 minutes
    },
    'cleanup-expired-notifications': {
        'task': 'notifications.tasks.cleanup_expired_notifications',
        'schedule': 3600.0,  # Every hour
    },
}

@app.task
def invalidate_analytics_cache(merchant_id):
    """Invalidate cached analytics data when relevant changes occur"""
    cache.delete(f'business_summary_{merchant_id}')
    # Delete all sales trends cache variations
    keys = cache.keys(f'sales_trends_{merchant_id}_*')
    if keys:
        cache.delete_many(keys)
