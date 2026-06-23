from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Patient

User = get_user_model()

@receiver(post_save, sender=User)
def sync_user_to_patient(sender, instance, created, **kwargs):
    # Автосинхронізація даних з User до Patient після збереження User

    # Перевірка чи user є patient
    if hasattr(instance, 'patient_profile') and instance.patient_profile:
        patient = instance.patient_profile
        needs_update = False
        
        # Оновлення полів Patient, якщо вони відрізняються від User
        if patient.first_name != instance.first_name:
            patient.first_name = instance.first_name
            needs_update = True
            
        if patient.last_name != instance.last_name:
            patient.last_name = instance.last_name
            needs_update = True
            
        if patient.phone_number != instance.phone:
            patient.phone_number = instance.phone
            needs_update = True
            
        if patient.email != instance.email:
            patient.email = instance.email
            needs_update = True
            
        if patient.date_of_birth != instance.date_of_birth:
            patient.date_of_birth = instance.date_of_birth
            needs_update = True
            
        if patient.address != instance.address:
            patient.address = instance.address
            needs_update = True
            
        if needs_update:
            # Збереження тільки якщо є зміни
            patient.save(update_fields=['first_name', 'last_name', 'phone_number', 'email', 'date_of_birth', 'address', 'updated_at'])