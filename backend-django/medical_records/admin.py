from django.contrib import admin
from invoices.models import Invoice
from .models import MedicalRecord, TreatmentRecord, Tooth

class TreatmentRecordInline(admin.StackedInline):
    model = TreatmentRecord
    extra = 0
    filter_horizontal = ['services']
    readonly_fields = ['date']

class ToothInline(admin.TabularInline):
    model = Tooth
    extra = 0

class InvoiceInline(admin.StackedInline):
    model = Invoice
    extra = 0 #

@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient', 'notes', 'created_at', 'updated_at']
    list_filter = ['created_at']
    search_fields = ['patient__first_name', 'patient__last_name', 'patient__phone_number', 'patient__user__username', 'notes']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [TreatmentRecordInline, ToothInline]

@admin.register(TreatmentRecord)
class TreatmentRecordAdmin(admin.ModelAdmin):
    list_display = ['id', 'medical_record', 'doctor', 'date', 'diagnosis']
    list_filter = ['date', 'doctor']
    search_fields = ['diagnosis', 'notes', 'medical_record__patient__user__username']
    filter_horizontal = ['services']
    readonly_fields = ['date']
    inlines = [InvoiceInline]

@admin.register(Tooth)
class ToothAdmin(admin.ModelAdmin):
    list_display = ['id', 'medical_record', 'tooth_number', 'status', 'notes']
    list_filter = ['status']
    search_fields = ['medical_record__patient__user__username', 'notes']