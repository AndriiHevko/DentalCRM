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

def generate_statistics_pdf(snapshot):
    # Завантаження шрифту
    font_path = os.path.join(settings.BASE_DIR, 'static', 'fonts', 'arial.ttf')
    try:
        pdfmetrics.registerFont(TTFont('ArialCyr', font_path))
    except Exception as e:
        print(f"Помилка шрифту: {e}")
        return None, None

    # Налаштування полотна
    pdf_buffer = BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer, 
        pagesize=A4, 
        rightMargin=40, leftMargin=40, 
        topMargin=40, bottomMargin=40
    )
    elements = []

    # Стилі
    text_main = colors.HexColor("#1e293b")
    text_muted = colors.HexColor("#64748b")
    bg_header = colors.HexColor("#f1f5f9")
    border = colors.HexColor("#cbd5e1")
    accent = colors.HexColor("#3b82f6")

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', fontName='ArialCyr', fontSize=24, leading=28, textColor=text_main, spaceAfter=10)
    subtitle_style = ParagraphStyle('Sub', fontName='ArialCyr', fontSize=12, leading=15, textColor=text_muted, spaceAfter=20)
    heading_style = ParagraphStyle('Heading', fontName='ArialCyr', fontSize=16, leading=20, textColor=accent, spaceAfter=10, spaceBefore=20)
    normal_style = ParagraphStyle('Normal', fontName='ArialCyr', fontSize=11, leading=14, textColor=text_main)

    def draw_divider():
        line = Table([['']], colWidths=[515], rowHeights=[5])
        line.setStyle(TableStyle([('LINEBELOW', (0, 0), (-1, -1), 1, border)]))
        return line

    # Переклад періоду для заголовка
    period_names = {
        'weekly': 'Тижневий',
        'monthly': 'Місячний',
        'all_time': 'За весь час'
    }
    period_label = period_names.get(snapshot.period_type, 'Загальний')
    date_str = timezone.localtime().strftime("%d.%m.%Y %H:%M")

    # ================== РЕНДЕРИНГ ==================

    # Шапка звіту
    elements.append(Paragraph("Dental Clinic", title_style))
    elements.append(Paragraph(f"Аналітичний звіт: {period_label}", subtitle_style))
    elements.append(Paragraph(f"Сформовано: {date_str}", ParagraphStyle('Date', fontName='ArialCyr', fontSize=10, textColor=text_muted)))
    
    if snapshot.period_type != 'all_time':
        period_range = f"Період: {snapshot.start_date.strftime('%d.%m.%Y')} — {snapshot.end_date.strftime('%d.%m.%Y')}"
        elements.append(Paragraph(period_range, normal_style))

    elements.append(Spacer(1, 10))
    elements.append(draw_divider())

    # Ключові показники
    elements.append(Paragraph("Ключові показники", heading_style))
    
    # Розрахунок прийомів за період з JSON
    appointments_for_period = 0
    if snapshot.appointments_status_breakdown:
        appointments_for_period = sum(item.get('value', 0) for item in snapshot.appointments_status_breakdown)

    # Динамічна таблиця: Якщо за весь час, то 2 колонки, інакше 3
    if snapshot.period_type == 'all_time':
        overview_data = [
            ["Показник", "Значення"],
            ["Прибуток (грн)", f"{snapshot.total_revenue:,.2f}"],
            ["Пацієнти", str(snapshot.total_patients)],
            ["Прийоми", str(snapshot.total_appointments)],
            ["Кількість лікарів", str(snapshot.total_doctors)],
        ]
        overview_table = Table(overview_data, colWidths=[365, 150])
    else:
        overview_data = [
            ["Показник", "За період", "Загалом (весь час)"],
            ["Прибуток (грн)", f"{snapshot.revenue_for_period:,.2f}", f"{snapshot.total_revenue:,.2f}"],
            ["Пацієнти", str(snapshot.new_patients), str(snapshot.total_patients)],
            ["Прийоми", str(appointments_for_period), str(snapshot.total_appointments)], 
            ["Кількість лікарів", "—", str(snapshot.total_doctors)],
        ]
        overview_table = Table(overview_data, colWidths=[215, 150, 150])

    overview_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'ArialCyr'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BACKGROUND', (0, 0), (-1, 0), bg_header),
        ('TEXTCOLOR', (0, 0), (-1, 0), text_main),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, border),
    ]))
    elements.append(overview_table)

    # Популярні послуги
    if snapshot.top_services:
        elements.append(Paragraph("Популярні послуги", heading_style))
        services_data = [["Назва послуги", "Кількість надавань"]]
        
        for item in snapshot.top_services:
            services_data.append([item.get('name', 'Невідомо'), str(item.get('Кількість', 0))])
            
        services_table = Table(services_data, colWidths=[365, 150])
        services_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'ArialCyr'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BACKGROUND', (0, 0), (-1, 0), bg_header),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('LINEBELOW', (0, 0), (-1, -1), 0.5, border),
        ]))
        elements.append(services_table)

    # Розподіл статусів прийомів
    if snapshot.appointments_status_breakdown:
        elements.append(Paragraph("Статуси прийомів", heading_style))
        status_data = [["Статус", "Кількість"]]
        
        for item in snapshot.appointments_status_breakdown:
            status_data.append([item.get('name', 'Невідомо'), str(item.get('value', 0))])
            
        status_table = Table(status_data, colWidths=[365, 150])
        status_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'ArialCyr'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BACKGROUND', (0, 0), (-1, 0), bg_header),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('LINEBELOW', (0, 0), (-1, -1), 0.5, border),
        ]))
        elements.append(status_table)

    # Генерація документу
    doc.build(elements)
    filename = f"report_{snapshot.period_type}_{timezone.localtime().strftime('%Y%m%d_%H%M')}.pdf"
    
    return filename, ContentFile(pdf_buffer.getvalue())