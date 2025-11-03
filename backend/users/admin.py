from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Merchant, Customer

class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'user_type', 'is_staff', 'is_verified')
    list_filter = ('user_type', 'is_staff', 'is_verified')
    
admin.site.register(User, CustomUserAdmin)
admin.site.register(Merchant)
admin.site.register(Customer)
