from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from .models import AdminActivity
import json

class SecurityHeadersMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        # CSP Headers
        response['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
        
        # Other security headers
        response['X-Frame-Options'] = 'DENY'
        response['X-Content-Type-Options'] = 'nosniff'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        # HSTS for HTTPS
        if not settings.DEBUG:
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            
        return response

class AdminActivityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        if request.user.is_authenticated and request.user.is_staff:
            if request.method in ('POST', 'PUT', 'DELETE', 'PATCH'):
                AdminActivity.objects.create(
                    admin=request.user,
                    action_type='SYSTEM_ACTION',
                    details={
                        'path': request.path,
                        'method': request.method,
                        'params': dict(request.GET),
                        'data': request.POST.dict() if request.method == 'POST' else {}
                    },
                    ip_address=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT')
                )
        
        return response
