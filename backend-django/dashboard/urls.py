from django.urls import path
from .views import StatisticsAPIView, StatisticsExportPDFView

urlpatterns = [
    path('statistics/', StatisticsAPIView.as_view(), name='statistics'),
]

urlpatterns = [
    path('statistics/', StatisticsAPIView.as_view(), name='statistics'),
    path('statistics/export/pdf/', StatisticsExportPDFView.as_view(), name='statistics-export-pdf'),
]