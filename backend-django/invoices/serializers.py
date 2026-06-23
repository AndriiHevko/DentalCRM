from rest_framework import serializers
from .models import Invoice

class InvoiceSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    patient_phone = serializers.CharField(source='treatment_record.medical_record.patient.phone_number', read_only=True)
    
    class Meta:
        model = Invoice
        fields = ['id', 'treatment_record', 'total_amount', 'status', 'created_at', 'patient_name', 'patient_phone', 'receipt_pdf']
        read_only_fields = ['id', 'created_at', 'receipt_pdf', 'total_amount']
    
    def get_patient_name(self, obj):
        patient = obj.treatment_record.medical_record.patient
        return f"{patient.first_name} {patient.last_name}"