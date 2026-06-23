from rest_framework.routers import DefaultRouter
from .views import MedicalRecordViewSet, TreatmentRecordViewSet
from django.urls import path, include

router = DefaultRouter()
router.register(r'medical-records', MedicalRecordViewSet, basename='medical-records')
router.register(r'treatments', TreatmentRecordViewSet, basename='treatments')

urlpatterns = [
    path('', include(router.urls)),
]
