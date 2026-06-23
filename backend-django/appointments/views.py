from rest_framework import viewsets, permissions, serializers
from .models import Appointment
from .serializers import AppointmentSerializer
import django_filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework import filters
from django.db import transaction
from medical_records.models import MedicalRecord, TreatmentRecord
from invoices.models import Invoice

class AppointmentFilter(django_filters.FilterSet):
    doctor_id = django_filters.NumberFilter(field_name="doctor_id")
    date = django_filters.DateFilter(field_name="appointment_datetime", lookup_expr='date')

    class Meta:
        model = Appointment
        fields = ['doctor_id', 'date']


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Appointment.objects.select_related('patient', 'doctor', 'doctor__specialty', 'service').all().order_by('-appointment_datetime')
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = AppointmentFilter

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return self.queryset.none()
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return self.queryset
            
        from django.db.models import Q
        if hasattr(user, 'doctor_profile'):
            return self.queryset.filter(doctor=user.doctor_profile)
        
        # Для пацієнтів: повторні візити, пов’язані з їхнім профілем пацієнта
        if hasattr(user, 'patient_profile'):
            return self.queryset.filter(patient=user.patient_profile)
            
        return self.queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        save_kwargs = {}

        # Допоміжна логіка: діставання пацієнта (може бути "patient" з серіалізатора або "patient_id" з request)
        patient_data = serializer.validated_data.get('patient')
        if not patient_data and self.request.data.get('patient_id'):
            from users.models import Patient
            patient_data = Patient.objects.filter(id=self.request.data.get('patient_id')).first()

        # Допоміжна логіка: діставання лікаря (може бути "doctor" або "doctor_id")
        doctor_data = serializer.validated_data.get('doctor')
        if not doctor_data and self.request.data.get('doctor_id'):
            from doctors.models import Doctor
            doctor_data = Doctor.objects.filter(id=self.request.data.get('doctor_id')).first()

        # 1. Якщо це ЛІКАР (C++ додаток)
        if hasattr(user, 'doctor_profile'):
            save_kwargs['status'] = 'scheduled'
            save_kwargs['doctor'] = user.doctor_profile
            
            if not patient_data:
                raise serializers.ValidationError({"patient": "Будь ласка, оберіть пацієнта."})
            save_kwargs['patient'] = patient_data

        # 2. Якщо це ПАЦІЄНТ (Веб-портал)
        elif hasattr(user, 'patient_profile'):
            save_kwargs['status'] = 'pending'
            save_kwargs['patient'] = user.patient_profile
            
            if not doctor_data:
                raise serializers.ValidationError({"doctor": "Будь ласка, оберіть лікаря."})
            save_kwargs['doctor'] = doctor_data

        # 3. Якщо це АДМІНІСТРАТОР
        elif user.is_staff or user.is_superuser:
            save_kwargs['status'] = 'scheduled'
            
            if not patient_data:
                raise serializers.ValidationError({"patient": "Адміністратор повинен вказати пацієнта."})
            if not doctor_data:
                raise serializers.ValidationError({"doctor": "Адміністратор повинен вказати лікаря."})
                
            save_kwargs['patient'] = patient_data
            save_kwargs['doctor'] = doctor_data
            
        else:
            raise serializers.ValidationError("У вас немає профілю для створення запису.")

        serializer.save(**save_kwargs)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        user = request.user

        is_staff = user.is_staff or user.is_superuser
        is_doctor_for_appt = hasattr(user, 'doctor_profile') and instance.doctor == user.doctor_profile
        is_patient_owner = hasattr(user, 'patient_profile') and instance.patient == user.patient_profile
        
        if not (is_staff or is_doctor_for_appt or is_patient_owner):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        # Перевірка, які поля намагається змінити користувач, якщо він НЕ адміністратор
        if not is_staff:
            request_keys = set(request.data.keys())
            
            if is_patient_owner:
                # Пацієнт може тільки скасувати запис
                if request_keys != {'status'} or request.data.get('status') != 'cancelled':
                    return Response({"detail": "You can only cancel your appointments."}, status=status.HTTP_400_BAD_REQUEST)
            
            elif is_doctor_for_appt:
                # Лікар може змінювати статус та нотатки
                allowed_doctor_fields = {'status', 'notes'}
                if not request_keys.issubset(allowed_doctor_fields):
                    return Response({"detail": "Doctors can only update status and notes."}, status=status.HTTP_400_BAD_REQUEST)

        # Адміністратор проходить усі перевірки.
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def me(self, request):
        user = request.user
        base_qs = self.filter_queryset(self.get_queryset())
        
        if hasattr(user, 'doctor_profile'):
            appointments = base_qs.filter(doctor=user.doctor_profile)
        elif hasattr(user, 'patient_profile'):
            appointments = base_qs.filter(patient=user.patient_profile)
        else:
            appointments = base_qs.none()
            
        page = self.paginate_queryset(appointments)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def complete(self, request, pk=None):
        instance = self.get_object()

        # 1. Зчитування медичних даних (без total_amount)
        medical_record_notes = request.data.get('medical_record_notes')
        dental_chart_updates = request.data.get('dental_chart_updates')
        performed_services = request.data.get('performed_services', [])
        
        diagnosis = request.data.get('diagnosis')
        treatment_notes = request.data.get('notes')
        doctor_id = request.data.get('doctor')
        teeth_numbers = request.data.get('treated_teeth', [])
        
        if not diagnosis:
            return Response({"detail": "diagnosis is required to create a treatment record."}, status=status.HTTP_400_BAD_REQUEST)

        # Отримання або створення MedicalRecord
        medical_record, created = MedicalRecord.objects.get_or_create(patient=instance.patient)
        
        if medical_record_notes is not None:
            medical_record.notes = medical_record_notes
            
        # Оновлення зубної формули dental_chart
        if dental_chart_updates is not None:
            from medical_records.models import Tooth
            for tooth_number, update_data in dental_chart_updates.items():
                Tooth.objects.update_or_create(
                    medical_record=medical_record,
                    tooth_number=int(tooth_number),
                    defaults={
                        'status': update_data.get('status', 'healthy'),
                        'notes': update_data.get('notes', '')
                    }
                )
        
        medical_record.save()

        # Створення TreatmentRecord
        doctor_instance = None
        if doctor_id:
            from doctors.models import Doctor
            doctor_instance = Doctor.objects.filter(id=doctor_id).first()
        else:
            doctor_instance = instance.doctor

        treatment_record = TreatmentRecord.objects.create(
            medical_record=medical_record,
            doctor=doctor_instance,
            diagnosis=diagnosis,
            notes=treatment_notes if treatment_notes else "",
            appointment=instance
        )
        
        if performed_services:
            treatment_record.services.set(performed_services)

        # Прив'язка вилікуваних зубів до запису
        if teeth_numbers:
            from medical_records.models import Tooth
            tooth_instances = []
            for num in teeth_numbers:
                tooth, _ = Tooth.objects.get_or_create(
                    medical_record=medical_record,
                    tooth_number=int(num)
                )
                tooth_instances.append(tooth)
            treatment_record.teeth.set(tooth_instances) 

        # Зміна статусу Appointment на 'done'
        instance.status = 'done'
        instance.save()

        # Повернення treatment_id для C++ клієнта
        return Response({
            "status": "success", 
            "treatment_id": treatment_record.id
        }, status=status.HTTP_200_OK)