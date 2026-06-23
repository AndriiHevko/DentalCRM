from django.contrib import admin
from .models import Appointment
from invoices.models import Invoice

# class InvoiceInline(admin.StackedInline):
#     model = Invoice
#     extra = 0
#     filter_horizontal = ['services']
#     readonly_fields = ['created_at']

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient', 'doctor', 'service', 'appointment_datetime', 'status', 'notes']
    list_filter = ['status', 'appointment_datetime', 'doctor', 'service']
    search_fields = ['patient__first_name', 'patient__last_name', 'patient__phone_number', 'doctor__full_name', 'notes']
    # inlines = [InvoiceInline]
