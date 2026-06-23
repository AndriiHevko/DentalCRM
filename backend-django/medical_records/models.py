from django.db import models
from django.contrib.auth import get_user_model
from doctors.models import Doctor
from services.models import Service
from users.models import Patient


User = get_user_model()


class MedicalRecord(models.Model):
    patient = models.OneToOneField(Patient, on_delete=models.CASCADE,
                                related_name="medical_record")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"MedicalRecord: {self.patient.first_name} {self.patient.last_name}"


class TreatmentRecord(models.Model):
    medical_record = models.ForeignKey(MedicalRecord, on_delete=models.CASCADE, related_name="treatments")
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True)
    services = models.ManyToManyField(Service, related_name="treatment_records")
    diagnosis = models.TextField()
    notes = models.TextField(blank=True)
    date = models.DateField(auto_now_add=True)
    teeth = models.ManyToManyField('Tooth', blank=True, related_name='treatments')
    
    appointment = models.OneToOneField(
        'appointments.Appointment', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='treatment_record'
    )

    def __str__(self):
        return f"Treatment by {self.doctor} for {self.medical_record.patient.full_name} on {self.date}"


class Tooth(models.Model):
    STATUS_CHOICES = [
        ('healthy', 'Здоровий'),
        ('caries', 'Карієс'),
        ('filling', 'Пломба'),
        ('extracted', 'Видалений'),
        ('crown', 'Коронка'),
        ('implant', 'Імплант'),
        ('other', 'Інше'),
    ]

    medical_record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.CASCADE,
        related_name="teeth"
    )
    tooth_number = models.IntegerField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='healthy'
    )
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ('medical_record', 'tooth_number')
        ordering = ['tooth_number']

    def __str__(self):
        return f"Tooth {self.tooth_number} ({self.get_status_display()}) - {self.medical_record.patient.first_name} {self.medical_record.patient.last_name}"
