from django.db import models
from medical_records.models import TreatmentRecord
from services.models import Service

class Invoice(models.Model):
    STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled')
    ]

    treatment_record = models.OneToOneField(
        TreatmentRecord, 
        on_delete=models.CASCADE, 
        related_name='invoice',
        null=True,
        blank=True
    )


    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='unpaid'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    receipt_pdf = models.FileField(upload_to='receipts/', blank=True, null=True)

    def __str__(self):
        # Перевірка чи існує зв'язок з записом про лікування
        if self.treatment_record and hasattr(self.treatment_record, 'medical_record'):
            patient = self.treatment_record.medical_record.patient
            return f"Invoice {self.id} - {patient.first_name} {patient.last_name} - {self.get_status_display()}"
        
        # Варіант, якщо зв'язку немає
        return f"Invoice {self.id} - (No Treatment Record) - {self.get_status_display()}"