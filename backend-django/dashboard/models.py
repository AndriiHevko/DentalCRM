from django.db import models

class StatisticSnapshot(models.Model):
    period_type = models.CharField(max_length=10, default='monthly')
    start_date = models.DateField()
    end_date = models.DateField()

    # Глобальні метрики (за весь час на момент збереження)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_patients = models.PositiveIntegerField(default=0)
    total_doctors = models.PositiveIntegerField(default=0)
    total_appointments = models.PositiveIntegerField(default=0)

    # Метрики суто за цей період (за місяць)
    revenue_for_period = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    new_patients = models.PositiveIntegerField(default=0)

    # Аналітика (зберігання даних у JSON)
    appointments_status_breakdown = models.JSONField(default=list, blank=True)
    top_services = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('period_type', 'start_date', 'end_date')
        ordering = ['-start_date']

    def __str__(self):
        return f"Stats {self.start_date.strftime('%B %Y')}"