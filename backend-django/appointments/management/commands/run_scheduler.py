import logging
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.models import DjangoJobExecution
from django_apscheduler import util

# Імпортуй свою модель Appointment (перевір правильність шляху)
from appointments.models import Appointment 

logger = logging.getLogger(__name__)

def auto_cancel_unconfirmed_appointments():
    """
    Логіка: скасування записів (status='pending'), 
    якщо до прийому залишилось менше ніж 30 хвилин, 
    включаючи ті, що залишилися в минулому через зупинку сервера.
    """
    now = timezone.now()
    threshold_time = now + timedelta(minutes=30)
    
    appointments_to_cancel = Appointment.objects.filter(
        status='pending',
        appointment_datetime__lte=threshold_time,
        # appointment_datetime__gte=now якщо потрібно не чіпати записи, які вже в минулому
    )
    
    count = 0
    for appt in appointments_to_cancel:
        appt.status = 'cancelled'
        system_note = "[Система]: Автоматично скасовано через відсутність підтвердження лікарем."
        
        if appt.notes:
            appt.notes = f"{appt.notes}\n{system_note}"
        else:
            appt.notes = system_note
            
        appt.save(update_fields=['status', 'notes'])
        count += 1
        
    if count > 0:
        print(f"[{timezone.now()}] Автоскасування: скасовано {count} записів.")


def auto_complete_hanging_appointments():
    """
    Логіка: автозавершення прийомів (переведення в 'done'),
    ТІЛЬКИ для статусів 'in_progress', якщо поточний час 
    більший за appointment_datetime + (duration_minutes * 2).
    """
    now = timezone.now()
    
    # ЗМІНЕНО: Фільтруємо ТІЛЬКИ записи 'in_progress', час яких вже настав або минув
    appointments_to_check = Appointment.objects.filter(
        status='in_progress',
        appointment_datetime__lte=now
    ).select_related('service')
    
    count = 0
    for appt in appointments_to_check:
        duration = appt.service.duration_minutes if (appt.service and hasattr(appt.service, 'duration_minutes')) else 30
        
        # Формула: appointment_datetime + (duration_minutes * 2)
        limit_time = appt.appointment_datetime + timedelta(minutes=duration * 2)
        
        # Якщо поточний час перевищив ліміт, закриваємо запис
        if now > limit_time:
            appt.status = 'done'
            system_note = "[Система]: Запис автоматично закрито через відсутність активності."
            
            if appt.notes:
                appt.notes = f"{appt.notes}\n{system_note}"
            else:
                appt.notes = system_note
                
            appt.save(update_fields=['status', 'notes'])
            count += 1
            
    if count > 0:
        print(f"[{timezone.now()}] Автозавершення: успішно закрито {count} 'in_progress' записів.")

# Очищення старих логів планувальника з БД (щоб не засмічувати базу)
@util.close_old_connections
def delete_old_job_executions(max_age=604_800):
    DjangoJobExecution.objects.delete_old_job_executions(max_age)


class Command(BaseCommand):
    help = "Запускає APScheduler для фонових задач."

    def handle(self, *args, **options):
        scheduler = BlockingScheduler(timezone=settings.TIME_ZONE)
        scheduler.add_jobstore(DjangoJobStore(), "default")

        # Скасування записів зі статусом 'pending', до початку яких залишилось 30 хвилин або менше.Вона буде запускатись кожні 2 хвилини
        scheduler.add_job(
            auto_cancel_unconfirmed_appointments,
            trigger=CronTrigger(minute="*/2"),
            id="auto_cancel_appointments",
            max_instances=1,
            replace_existing=True,
        )
        logger.info("Додано задачу 'auto_cancel_appointments'.")

        # Автозавершення завислих прийомів (кожні 5 хвилин)
        scheduler.add_job(
            auto_complete_hanging_appointments,
            trigger=CronTrigger(minute="*/5"),
            id="auto_complete_appointments",
            max_instances=1,
            replace_existing=True,
        )
        logger.info("Додано задачу 'auto_complete_appointments'.")

        # Додаємо задачу для очищення логів самого планувальника (раз на тиждень)
        scheduler.add_job(
            delete_old_job_executions,
            trigger=CronTrigger(day_of_week="mon", hour="00", minute="00"),
            id="delete_old_job_executions",
            max_instances=1,
            replace_existing=True,
        )
        logger.info("Додано задачу очищення логів виконання.")

        try:
            logger.info("Запуск планувальника... (Натисни Ctrl+C для зупинки)")
            scheduler.start()
        except KeyboardInterrupt:
            logger.info("Зупинка планувальника...")
            scheduler.shutdown()
            logger.info("Планувальник успішно зупинено.")