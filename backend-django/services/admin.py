from django.contrib import admin
from .models import Service

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'specialty', 'price', 'duration_minutes']
    list_filter = ['specialty']
    search_fields = ['name', 'description']