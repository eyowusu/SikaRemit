from rest_framework.permissions import BasePermission

class IsSuperAdmin(BasePermission):
    """
    Allows access only to super admins.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser

class IsAdminUser(BasePermission):
    """
    Allows access only to admin users (staff).
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_staff
