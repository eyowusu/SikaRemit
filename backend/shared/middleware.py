from django.utils.deprecation import MiddlewareMixin
from uuid import uuid4

class RequestIDMiddleware(MiddlewareMixin):
    """Add a unique request ID to each request"""
    def process_request(self, request):
        request.id = str(uuid4())

class SecurityHeadersMiddleware(MiddlewareMixin):
    """Add security headers to responses"""
    def process_response(self, request, response):
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        return response
