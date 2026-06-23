import os
from io import BytesIO
from django.conf import settings
from django.core.files.base import ContentFile
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Імпорт моделі прийому для отримання точного часу
from appointments.models import Appointment

def get_local_time_str(dt_obj):
    # Допоміжна функція для безпечного конвертування часу в локальний часовий пояс
    if not dt_obj:
        return "—"
    if timezone.is_aware(dt_obj):
        dt_obj = timezone.localtime(dt_obj)
    return dt_obj.strftime("%d.%m.%Y %H:%M")

def generate_invoice_pdf(invoice):
    treatment = invoice.treatment_record
    patient = treatment.medical_record.patient
    
    font_path = os.path.join(settings.BASE_DIR, 'static', 'fonts', 'arial.ttf')
    try:
        pdfmetrics.registerFont(TTFont('ArialCyr', font_path))
    except Exception as e:
        print(f"КРИТИЧНА ПОМИЛКА ШРИФТУ: {e}")
        return None, None

    # Точний час прийому через прямий зв'язок з моделлю Appointment
    if hasattr(treatment, 'appointment') and treatment.appointment:
        appt_time_str = get_local_time_str(treatment.appointment.appointment_datetime)
    else:
        appt_time_str = treatment.date.strftime("%d.%m.%Y")
        
    inv_time_str = get_local_time_str(invoice.created_at)

    pdf_buffer = BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer, 
        pagesize=A4, 
        rightMargin=50, 
        leftMargin=50, 
        topMargin=50, 
        bottomMargin=50
    )
    elements = []

    # Налаштування вигляду та кольорів
    pdf_buffer = BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer, 
        pagesize=A4, 
        rightMargin=50, 
        leftMargin=50, 
        topMargin=50, 
        bottomMargin=50
    )
    elements = []

    # Кольори
    text_main = colors.HexColor("#0f172a")     
    text_muted = colors.HexColor("#64748b")    
    success = colors.HexColor("#10b981")       
    bg_header = colors.HexColor("#f8fafc")     
    border = colors.HexColor("#e2e8f0")        

    # Стилі тексту
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'Title', fontName='ArialCyr', fontSize=28, leading=34, textColor=text_main, spaceAfter=8
    )
    subtitle_style = ParagraphStyle(
        'Sub', fontName='ArialCyr', fontSize=11, leading=14, textColor=text_muted, spaceAfter=25
    )
    label_style = ParagraphStyle(
        'Label', fontName='ArialCyr', fontSize=9, leading=11, textColor=text_muted, spaceAfter=5
    )
    value_style = ParagraphStyle(
        'Value', fontName='ArialCyr', fontSize=12, leading=15, textColor=text_main
    )
    footer_style = ParagraphStyle(
        'Footer', fontName='ArialCyr', fontSize=9, leading=12, textColor=text_muted, alignment=1
    )

    def draw_divider():
        line = Table([['']], colWidths=[495], rowHeights=[5])
        line.setStyle(TableStyle([('LINEBELOW', (0, 0), (-1, -1), 0.5, border)]))
        return line

    # ================== РЕНДЕРИНГ ==================

    # Шапка
    elements.append(Paragraph("Dental Clinic", title_style))
    date_str = invoice.created_at.strftime('%d.%m.%Y')
    elements.append(Paragraph(f"Квитанція №{invoice.id} від {date_str}", subtitle_style))
    
    elements.append(draw_divider())
    elements.append(Spacer(1, 20))

    # Деталі
    info_data = [
        [Paragraph("ПАЦІЄНТ", label_style), Paragraph("ЛІКАР", label_style)],
        [Paragraph(f"{patient.first_name} {patient.last_name}", value_style),
         Paragraph(treatment.doctor.full_name if treatment.doctor else "—", value_style)],
        
        [Spacer(1, 15), Spacer(1, 15)], 
        
        # Дати
        [Paragraph("ДАТА ТА ЧАС ПРИЙОМУ", label_style), Paragraph("СТВОРЕНО ЧЕК", label_style)],
        [Paragraph(appt_time_str, value_style), Paragraph(inv_time_str, value_style)],

        [Spacer(1, 15), Spacer(1, 15)], 

        [Paragraph("СТАТУС", label_style), Paragraph("", label_style)],
        [Paragraph("ОПЛАЧЕНО", ParagraphStyle('Paid', fontName='ArialCyr', fontSize=12, leading=15, textColor=success)), Paragraph("", value_style)]
    ]

    info_table = Table(info_data, colWidths=[200, 295])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 30))

    # Послуги
    services_data = [
        [Paragraph("НАЗВА ПОСЛУГИ", label_style), 
         Paragraph("ВАРТІСТЬ", ParagraphStyle('THR', fontName='ArialCyr', fontSize=9, leading=11, textColor=text_muted, alignment=2))]
    ]

    for service in treatment.services.all():
        services_data.append([
            Paragraph(service.name, value_style),
            Paragraph(f"{service.price} грн", ParagraphStyle('TR', fontName='ArialCyr', fontSize=12, leading=15, textColor=text_main, alignment=2))
        ])

    services_table = Table(services_data, colWidths=[375, 120])
    services_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), bg_header), 
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LINEBELOW', (0, 0), (-1, -1), 0.5, border), 
    ]))
    elements.append(services_table)
    elements.append(Spacer(1, 15))

    # Загальна сума
    total_data = [
        [Paragraph("Всього до сплати:", ParagraphStyle('TL', fontName='ArialCyr', fontSize=12, leading=15, textColor=text_muted, alignment=2)),
         Paragraph(f"{invoice.total_amount} грн", ParagraphStyle('TV', fontName='ArialCyr', fontSize=18, leading=22, textColor=text_main, alignment=2))]
    ]
    total_table = Table(total_data, colWidths=[320, 175])
    total_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(total_table)

    # Футер
    elements.append(Spacer(1, 60))
    elements.append(draw_divider())
    elements.append(Spacer(1, 15))
    elements.append(Paragraph("Дякуємо, що довіряєте нам своє здоров'я!<br/>Згенеровано автоматично системою Dental Clinic", footer_style))

    # Генерація та збереження PDF
    doc.build(elements)
    
    filename = f"receipt_{invoice.id}.pdf"
    return filename, ContentFile(pdf_buffer.getvalue())