from django.db import transaction
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from medical_records.models import TreatmentRecord
from appointments.models import Appointment
from .models import Invoice
from .serializers import InvoiceSerializer

# Імпорт сервісу для генерації PDF
from .utils.pdf import generate_invoice_pdf 

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='generate-for-treatment/(?P<treatment_id>\d+)')
    def generate_for_treatment(self, request, treatment_id=None):
        treatment = get_object_or_404(TreatmentRecord, id=treatment_id)
        
        # Використовуємо транзакцію: якщо щось впаде, БД відкотиться назад, без битого чеку
        with transaction.atomic():
            
            # Підрахунок суми
            calculated_total = treatment.services.aggregate(total=Sum('price'))['total'] or 0
            
            # Створення/отримання інвойсу
            invoice, created = Invoice.objects.get_or_create(
                treatment_record=treatment,
                defaults={'total_amount': calculated_total, 'status': 'paid'}
            )
            
            # Якщо інвойс вже існував, оновлення суми
            if not created:
                invoice.total_amount = calculated_total
                invoice.save()

            # Автозакриття прийому (Appointment)
            patient = treatment.medical_record.patient
            appointment = Appointment.objects.filter(
                patient=patient,
                doctor=treatment.doctor,
                appointment_datetime__date=treatment.date,
                status__in=['scheduled', 'in_progress']
            ).first()

            if appointment:
                appointment.status = 'done'
                appointment.save()
            
            # Генерація PDF
            filename, pdf_file = generate_invoice_pdf(invoice)
            
            if filename and pdf_file:
                invoice.receipt_pdf.save(filename, pdf_file, save=True)
            else:
                return Response(
                    {"error": "Не вдалося згенерувати PDF чека. Перевірте налаштування шрифтів та шаблону."}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        # Фітбек фронту
        is_registered = hasattr(patient, 'user') and patient.user is not None
        
        return Response({
            "status": "success",
            "invoice_id": invoice.id,
            "total_amount": invoice.total_amount,
            "receipt_url": request.build_absolute_uri(invoice.receipt_pdf.url) if invoice.receipt_pdf else "",
            "requires_printing": not is_registered
        }, status=status.HTTP_200_OK)