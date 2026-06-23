from django.contrib import admin
from .models import Invoice

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_patient', 'total_amount', 'status', 'created_at']
    list_filter = ['status', 'created_at']

    @admin.display(description='Patient')
    def get_patient(self, obj):
        if obj.treatment_record and obj.treatment_record.medical_record:
            return f"{obj.treatment_record.medical_record.patient}"
        return "—"