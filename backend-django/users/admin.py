from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Patient

class PatientInline(admin.StackedInline):
    model = Patient
    fk_name = 'user'
    extra = 0
    readonly_fields = ['created_at', 'updated_at']

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'phone', 'gender', 'is_staff', 'is_active']
    list_filter = ['is_staff', 'is_superuser', 'is_active', 'gender']
    search_fields = ['username', 'first_name', 'last_name', 'email', 'phone']
    inlines = [PatientInline]
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Personal Info', {'fields': ('phone', 'date_of_birth', 'gender', 'address')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Personal Info', {'fields': ('phone', 'date_of_birth', 'gender', 'address')}),
    )

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['id', 'first_name', 'last_name', 'phone_number', 'email', 'user', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['first_name', 'last_name', 'phone_number', 'email', 'user__username']