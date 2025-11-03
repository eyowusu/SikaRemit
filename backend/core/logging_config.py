import logging
import logging.handlers
import json
from django.conf import settings

class RequestIdFilter(logging.Filter):
    def filter(self, record):
        from django.http import HttpRequest
        request = getattr(record, 'request', None)
        
        if isinstance(request, HttpRequest):
            record.request_id = getattr(request, 'request_id', 'none')
        else:
            record.request_id = 'none'
            
        return True

def configure_logging():
    logging.config.dictConfig({
        'version': 1,
        'disable_existing_loggers': False,
        'filters': {
            'request_id': {
                '()': RequestIdFilter
            }
        },
        'formatters': {
            'json': {
                '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
                'format': '%(asctime)s %(levelname)s %(name)s %(message)s %(request_id)s'
            }
        },
        'handlers': {
            'file': {
                'level': 'INFO',
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': settings.LOGS_DIR / 'app.log',
                'maxBytes': 1024*1024*10,  # 10MB
                'backupCount': 5,
                'formatter': 'json',
                'filters': ['request_id']
            },
            'console': {
                'level': 'DEBUG',
                'class': 'logging.StreamHandler',
                'formatter': 'json',
                'filters': ['request_id']
            }
        },
        'loggers': {
            'payments': {
                'handlers': ['file'],
                'level': 'INFO',
                'propagate': False
            }
        },
        'root': {
            'handlers': ['file', 'console'],
            'level': 'INFO'
        }
    })
