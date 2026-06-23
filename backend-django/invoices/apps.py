import os
from django.apps import AppConfig
from django.conf import settings

class InvoicesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'invoices'

    def ready(self):
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        
        font_path = os.path.join(settings.BASE_DIR, 'static', 'fonts', 'arial.ttf')
        if os.path.exists(font_path):
            try:
                pdfmetrics.registerFont(TTFont('ArialCyr', font_path))
            except Exception as e:
                print(f"Помилка завантаження шрифту: {e}")