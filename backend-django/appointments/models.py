from django.db import models
from django.contrib.auth import get_user_model
from doctors.models import Doctor
from services.models import Service
from users.models import Patient

User = get_user_model()

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
        ('cancelled', 'Cancelled'),
    ]
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True
    )
    appointment_datetime = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.patient.first_name} {self.patient.last_name} with \
    {self.doctor.full_name} at {self.appointment_datetime}"