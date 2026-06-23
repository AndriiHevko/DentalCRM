import datetime
from django.utils.dateparse import parse_date
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from appointments.models import Appointment
from users.permissions import IsAdminOrReadOnly
from .models import Doctor, Specialty, WorkSchedule
from .serializers import DoctorSerializer, SpecialtySerializer, WorkScheduleSerializer
from users.permissions import IsAdminOrReadOnly, _is_admin, _is_doctor
from services.models import Service
from .services import get_available_slots

class SpecialtyViewSet(viewsets.ModelViewSet):
    queryset = Specialty.objects.all().order_by('name')
    serializer_class = SpecialtySerializer
    permission_classes = [IsAdminOrReadOnly]

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.select_related('specialty').order_by('full_name')
    serializer_class = DoctorSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_destroy(self, instance):
        # Перевизначення видалення, щоб разом із профілем лікаря видалявся і його (User)
        user = instance.user
        instance.delete()
        
        if user:
            user.delete()

    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        if getattr(self, 'swagger_fake_view', False):
            return Response()
            
        doctor = self.get_object()
        date_str = request.query_params.get('date')
        service_id = request.query_params.get('service_id')
        
        if not date_str or not service_id:
            return Response(
                {"detail": "Параметри 'date' та 'service_id' є обов'язковими."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_date = parse_date(date_str)
            if not target_date:
                raise ValueError
        except ValueError:
            return Response({"detail": "Неправильний формат дати. Використовуйте YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            service = Service.objects.get(id=service_id)
            requested_duration = service.duration_minutes
        except Service.DoesNotExist:
             return Response({"detail": "Послугу не знайдено."}, status=status.HTTP_404_NOT_FOUND)

        weekday = target_date.isoweekday()
        schedule = doctor.work_schedules.filter(day_of_week=weekday).first()
        
        if not schedule:
            return Response({"date": date_str, "available_slots": []})
            
        booked_appointments = Appointment.objects.filter(
            doctor=doctor,
            appointment_datetime__date=target_date
        ).exclude(
            status='cancelled'
        ).select_related('service')
        
        # Завжди отримування слоті з базовим буфером 5 хв для всіх
        available_slots = get_available_slots(
            target_date=target_date,
            schedule=schedule,
            appointments=booked_appointments,
            requested_duration_minutes=requested_duration,
            step_minutes=30,
            buffer_minutes=5
        )
        
        # Додаткове відсікання
        user = request.user
        
        # Перевірка, чи користувач лікар або адмін
        has_staff_access = user.is_authenticated and (_is_admin(user) or _is_doctor(user))
        
        # Якщо це пацієнт (has_staff_access == False), відсікання слотів, 
        # які починаються менше ніж через 45 хвилин від поточного часу
        if not has_staff_access:
            from django.utils import timezone
            import datetime
            
            now_local = timezone.localtime()
            buffer_limit = now_local + datetime.timedelta(minutes=45)
            
            valid_slots = []
            for slot_str in available_slots:
                slot_time = datetime.datetime.strptime(slot_str, '%H:%M').time()
                slot_datetime_naive = datetime.datetime.combine(target_date, slot_time)
                slot_datetime_aware = timezone.make_aware(slot_datetime_naive)

                if slot_datetime_aware >= buffer_limit:
                    valid_slots.append(slot_str)
                    
            return Response({"date": date_str, "available_slots": valid_slots})
        
        # Якщо це лікар або адмін (has_staff_access == True), всі слоти доступні
        return Response({"date": date_str, "available_slots": available_slots})
    
class WorkScheduleViewSet(viewsets.ModelViewSet):
    queryset = WorkSchedule.objects.all()
    serializer_class = WorkScheduleSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        # Фільтрування графіків по конкретному лікарю (?doctor=1)
        queryset = super().get_queryset()
        doctor_id = self.request.query_params.get('doctor')
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        return queryset