from django.http import FileResponse
from rest_framework import generics, serializers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from .models import StatisticSnapshot
from .utils.pdf_report import generate_statistics_pdf

class StatisticsResponseSerializer(serializers.Serializer):
    overview = serializers.DictField()
    revenue_by_month = serializers.ListField()
    appointments_status = serializers.ListField()
    top_services = serializers.ListField()

class StatisticsAPIView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = StatisticsResponseSerializer

    def get(self, request, *args, **kwargs):
        # Читання параметру з URL ('monthly' за замовчуванням)
        period = request.query_params.get('period', 'monthly')
        
        latest = StatisticSnapshot.objects.filter(period_type=period).order_by('-start_date').first()
        
        if not latest:
            return Response({
                "overview": {
                    "total_revenue": 0, "revenue_for_period": 0,
                    "total_patients": 0, "new_patients": 0,
                    "total_doctors": 0, "total_appointments": 0
                },
                "revenue_by_month": [], "appointments_status": [], "top_services": []
            })

        # Останні 6 зрізів цього типу для графіка
        recent_snapshots = StatisticSnapshot.objects.filter(period_type=period).order_by('-start_date')[:6]
        recent_snapshots = reversed(list(recent_snapshots)) 

        revenue_by_time = []
        for snap in recent_snapshots:
            # Якщо тиждень - "День.Місяць", інакше "Місяць Рік"
            date_format = '%d.%m' if period == 'weekly' else '%b %Y'
            name = "За весь час" if period == 'all_time' else snap.start_date.strftime(date_format)
            revenue_by_time.append({
                "name": name, 
                "Прибуток": float(snap.revenue_for_period)
            })

        return Response({
            "overview": {
                "total_revenue": float(latest.total_revenue),
                "revenue_for_period": float(latest.revenue_for_period),
                "total_patients": latest.total_patients,
                "new_patients": latest.new_patients,
                "total_doctors": latest.total_doctors,
                "total_appointments": latest.total_appointments,
            },
            "revenue_by_month": revenue_by_time,
            "appointments_status": latest.appointments_status_breakdown,
            "top_services": latest.top_services
        })
    
class StatisticsExportPDFView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        period = request.query_params.get('period', 'monthly')
        
        # Свіжий зріз для обраного періоду
        snapshot = StatisticSnapshot.objects.filter(period_type=period).order_by('-start_date').first()
        
        if not snapshot:
            raise NotFound(detail=f"Статистика для періоду '{period}' ще не згенерована.")

        # Генерація PDF
        filename, pdf_file = generate_statistics_pdf(snapshot)
        
        if not pdf_file:
            return Response(
                {"detail": "Помилка генерації PDF-файлу. Перевірте наявність шрифтів."}, 
                status=500
            )

        # Відправлення файлу
        response = FileResponse(pdf_file, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response