from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
import calendar

from appointments.models import Appointment
from invoices.models import Invoice
from users.models import Patient
from doctors.models import Doctor
from services.models import Service
from .models import StatisticSnapshot

def generate_all_snapshots():
    now = timezone.now().date()
    periods = ['weekly', 'monthly', 'all_time']
    
    for period in periods:
        if period == 'weekly':
            start_date = now - timedelta(days=now.weekday()) 
            end_date = start_date + timedelta(days=6)        
        elif period == 'monthly':
            start_date = now.replace(day=1)
            _, last_day = calendar.monthrange(now.year, now.month)
            end_date = now.replace(day=last_day)
        else: # all_time
            start_date = timezone.datetime(2020, 1, 1).date() 
            # Дату далеко в майбутньому, щоб захопити всі заплановані прийоми
            end_date = timezone.datetime(2099, 12, 31).date() 

        # Глобальні метрики
        total_revenue = Invoice.objects.filter(status='paid', created_at__date__lte=end_date).aggregate(total=Sum('total_amount'))['total'] or 0.00
        total_patients = Patient.objects.filter(created_at__date__lte=end_date).count()
        total_doctors = Doctor.objects.count()
        total_appointments = Appointment.objects.filter(appointment_datetime__date__lte=end_date).count()

        # Метрики за обраний період 
        revenue_for_period = Invoice.objects.filter(
            status='paid', 
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).aggregate(total=Sum('total_amount'))['total'] or 0.00

        new_patients = Patient.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).count()

        # Розподіл статусів
        appointments_qs = Appointment.objects.filter(
            appointment_datetime__date__gte=start_date,
            appointment_datetime__date__lte=end_date
        )
        status_translation = {
            'pending': 'Очікують', 'scheduled': 'Заплановані',
            'in_progress': 'В процесі', 'done': 'Завершені', 'cancelled': 'Скасовані'
        }
        status_counts = appointments_qs.values('status').annotate(count=Count('id'))
        status_breakdown = [{"name": status_translation.get(item['status'], item['status']), "value": item['count']} for item in status_counts]

        # Топ послуг
        top_services_qs = Service.objects.filter(
            treatment_records__invoice__created_at__date__gte=start_date,
            treatment_records__invoice__created_at__date__lte=end_date,
            treatment_records__invoice__status='paid'
        ).annotate(usage_count=Count('treatment_records__invoice')).order_by('-usage_count')[:5]
        
        top_services_list = [{"name": item.name, "Кількість": item.usage_count} for item in top_services_qs]

        StatisticSnapshot.objects.update_or_create(
            period_type=period,
            defaults={
                'start_date': start_date,
                'end_date': end_date,
                'total_revenue': total_revenue,
                'revenue_for_period': revenue_for_period,
                'total_patients': total_patients,
                'new_patients': new_patients,
                'total_doctors': total_doctors,
                'total_appointments': total_appointments,
                'appointments_status_breakdown': status_breakdown,
                'top_services': top_services_list
            }
        )