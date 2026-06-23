from rest_framework import serializers
from .models import MedicalRecord, TreatmentRecord, Tooth

class ToothSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tooth
        fields = ['id', 'tooth_number', 'status', 'notes']

    def validate_tooth_number(self, value):
        valid_teeth = (
            list(range(11, 19)) +
            list(range(21, 29)) +
            list(range(31, 39)) +
            list(range(41, 49))
        )
        if value not in valid_teeth:
            raise serializers.ValidationError("Недійсний номер зуба за системою FDI.")
        return value

class DentalChartSerializer(serializers.Serializer):
    teeth = ToothSerializer(many=True)

    def update(self, instance, validated_data):
        teeth_data = validated_data.get('teeth', [])
        teeth_instances = []
        for tooth_data in teeth_data:
            tooth, created = Tooth.objects.update_or_create(
                medical_record=instance,
                tooth_number=tooth_data['tooth_number'],
                defaults={
                    'status': tooth_data.get('status', 'healthy'),
                    'notes': tooth_data.get('notes', '')
                }
            )
            teeth_instances.append(tooth)
        return teeth_instances


class TreatmentRecordSerializer(serializers.ModelSerializer):
    services = serializers.SerializerMethodField()
    teeth = serializers.SerializerMethodField()
    cost = serializers.SerializerMethodField()
    receipt_url = serializers.SerializerMethodField()

    date = serializers.DateField(format="%Y-%m-%d", read_only=True)

    class Meta:
        model = TreatmentRecord
        fields = [
            'id', 'medical_record', 'doctor', 'services', 
            'teeth', 'cost', 'diagnosis', 'notes', 'date', 'receipt_url',
        ]
        read_only_fields = ['id', 'date']

    def get_services(self, obj):
        if hasattr(obj, 'services') and hasattr(obj.services, 'all'):
            return ", ".join([s.name for s in obj.services.all()])
        return "Немає даних"

    def get_teeth(self, obj):
        if hasattr(obj, 'teeth') and hasattr(obj.teeth, 'all'):
            return ", ".join([str(t.tooth_number) for t in obj.teeth.all()])
        return "Не вказано"

    def get_cost(self, obj):
        if hasattr(obj, 'services') and hasattr(obj.services, 'all'):
            try:
                return float(sum(s.price for s in obj.services.all()))
            except AttributeError:
                return 0.0
        return 0.0

    def get_receipt_url(self, obj):
        try:
            from invoices.models import Invoice
            
            invoice = Invoice.objects.filter(
                treatment_record=obj
            ).exclude(receipt_pdf='').first()

            if invoice and invoice.receipt_pdf:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(invoice.receipt_pdf.url)
                return invoice.receipt_pdf.url

        except Invoice.DoesNotExist:
            return ""
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Помилка отримання чека для TreatmentRecord {obj.id}: {str(e)}")
            
        return ""


class MedicalRecordSerializer(serializers.ModelSerializer):
    treatments = TreatmentRecordSerializer(many=True, read_only=True)
    dental_chart = ToothSerializer(source='teeth', many=True, read_only=True)
    patient_name = serializers.SerializerMethodField()
    patient_phone = serializers.CharField(source='patient.phone_number', read_only=True)

    class Meta:
        model = MedicalRecord
        fields = [
            'id',
            'patient',
            'patient_name',
            'patient_phone',
            'notes',
            'dental_chart',
            'created_at',
            'updated_at',
            'treatments',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"