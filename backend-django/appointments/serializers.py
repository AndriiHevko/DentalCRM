from django.utils import timezone
from datetime import timedelta

from rest_framework import serializers
from .models import Appointment
from users.models import Patient
from doctors.models import Doctor, WorkSchedule
from services.models import Service

class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    doctor_specialty = serializers.CharField(source='doctor.specialty.name', read_only=True, default=None)
    service_name = serializers.CharField(source='service.name', read_only=True, default=None)
    patient_id = serializers.IntegerField(read_only=True)    
    doctor_id = serializers.IntegerField(source='doctor.id', read_only=True)
    service_id = serializers.IntegerField(source='service.id', read_only=True)

    duration_minutes = serializers.IntegerField(source='service.duration_minutes', read_only=True)
    
    patient = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(), 
        write_only=True,
        required=False
    )
    
    doctor = serializers.PrimaryKeyRelatedField(
        queryset=Doctor.objects.all(),
        write_only=True,
        required=False
    )

    service = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        write_only=True,
        required=False
    )
    
    patient_name = serializers.SerializerMethodField()
    patient_phone = serializers.CharField(source='patient.phone_number', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id',
            'patient', 'patient_id', 'patient_name', 'patient_phone',
            'appointment_datetime', 'status', 'notes',
            'doctor', 'doctor_id', 'doctor_name', 'doctor_specialty',
            'service', 'service_id', 'service_name', 'duration_minutes',
        ]
        read_only_fields = ['id'] 

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"
    
    def validate_appointment_datetime(self, value):
        request = self.context.get('request')
        if not request or not hasattr(request, 'user'):
            return value
            
        user = request.user
        now = timezone.now()

        if value < now:
            raise serializers.ValidationError("Неможливо створити запис у минулому часі.")

        if hasattr(user, 'patient_profile') and not (user.is_staff or user.is_superuser):
            buffer_time = now + timedelta(minutes=45)
            if value < buffer_time:
                raise serializers.ValidationError(
                    "Запис онлайн можливий мінімум за 45 хвилин до початку. "
                    "Будь ласка, оберіть інший час або зателефонуйте в Dental Clinic."
                )
        
        return value

    def validate(self, data):
        # Загальна валідація, для доступу до всіх переданих полів: appointment_datetime, doctor, service.
        data = super().validate(data)
        
        is_modifying_schedule = any(key in data for key in ['appointment_datetime', 'doctor', 'service'])
        if self.instance and not is_modifying_schedule:
            return data

        appt_datetime = data.get('appointment_datetime', getattr(self.instance, 'appointment_datetime', None))
        
        request = self.context.get('request')
        doctor = data.get('doctor')
        
        if not doctor:
            doctor_id = request.data.get('doctor_id') if request else None
            if doctor_id:
                doctor = Doctor.objects.filter(id=doctor_id).first()
            elif request and hasattr(request.user, 'doctor_profile'):
                doctor = request.user.doctor_profile
            elif self.instance:
                 doctor = self.instance.doctor

        service = data.get('service', getattr(self.instance, 'service', None))

        if not (appt_datetime and doctor and service):
             return data

        duration = service.duration_minutes
        appt_end_time = appt_datetime + timedelta(minutes=duration)

        overlapping_appointments = Appointment.objects.filter(
            doctor=doctor,
            appointment_datetime__date=appt_datetime.date()
        ).exclude(status='cancelled')

        if self.instance:
            overlapping_appointments = overlapping_appointments.exclude(pk=self.instance.pk)

        for existing_appt in overlapping_appointments:
            existing_duration = existing_appt.service.duration_minutes if existing_appt.service else 30
            existing_end_time = existing_appt.appointment_datetime + timedelta(minutes=existing_duration)

            if appt_datetime < existing_end_time and appt_end_time > existing_appt.appointment_datetime:
                 raise serializers.ValidationError({
                    "appointment_datetime": f"Цей час перетинається з іншим записом у лікаря. "
                                            f"Зайнятий період: {timezone.localtime(existing_appt.appointment_datetime).strftime('%H:%M')} - "
                                            f"{timezone.localtime(existing_end_time).strftime('%H:%M')}."
                 })

        local_appt_datetime = timezone.localtime(appt_datetime)
        local_appt_end_time = timezone.localtime(appt_end_time)

        weekday = local_appt_datetime.isoweekday() 
        
        schedule = WorkSchedule.objects.filter(
            doctor=doctor,
            day_of_week=weekday
        ).first()

        if not schedule:
             raise serializers.ValidationError({
                 "appointment_datetime": "Лікар не працює у цей день тижня."
             })

        appt_start_time_only = local_appt_datetime.time()
        appt_end_time_only = local_appt_end_time.time()

        if appt_start_time_only < schedule.start_time or appt_end_time_only > schedule.end_time:
             raise serializers.ValidationError({
                 "appointment_datetime": f"Час прийому виходить за межі робочого графіка лікаря "
                                         f"({schedule.start_time.strftime('%H:%M')} - {schedule.end_time.strftime('%H:%M')})."
             })
             
        if schedule.lunch_start and schedule.lunch_end:
            if appt_start_time_only < schedule.lunch_end and appt_end_time_only > schedule.lunch_start:
                 raise serializers.ValidationError({
                    "appointment_datetime": f"Час прийому перетинається з обідньою перервою лікаря "
                                            f"({schedule.lunch_start.strftime('%H:%M')} - {schedule.lunch_end.strftime('%H:%M')})."
                 })

        return data
    
def validate_status(self, value):
        if not self.instance:
            return value

        old_status = self.instance.status
        new_status = value

        if old_status == new_status:
            return value

        allowed_transitions = {
            'pending': ['scheduled', 'cancelled'],
            'scheduled': ['in_progress', 'cancelled'],
            'in_progress': ['cancelled'],
            'done': [],
            'cancelled': []
        }

        valid_next_statuses = allowed_transitions.get(old_status, [])

        if new_status not in valid_next_statuses:
            raise serializers.ValidationError(
                f"Недопустима операція: неможливо змінити статус запису з '{old_status}' на '{new_status}'."
            )

        if new_status == 'cancelled':
            request = self.context.get('request')
            if request and hasattr(request, 'user'):
                user = request.user
                
                is_staff_or_doctor = user.is_staff or user.is_superuser or hasattr(user, 'doctor_profile')
                
                if not is_staff_or_doctor:
                    now = timezone.now()
                    cancel_limit_time = now + timedelta(hours=2)
                    
                    if self.instance.appointment_datetime < cancel_limit_time:
                        raise serializers.ValidationError(
                            "Ви не можете самостійно скасувати запис менш ніж за 2 години до його початку. "
                            "Будь ласка, зателефонуйте в Dental Clinic."
                        )

        return value