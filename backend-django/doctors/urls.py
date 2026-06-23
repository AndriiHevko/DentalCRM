from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import DoctorViewSet, SpecialtyViewSet, WorkScheduleViewSet

router = DefaultRouter()
router.register(r'doctors', DoctorViewSet, basename='doctors')
router.register(r'specialties', SpecialtyViewSet, basename='specialties')
router.register(r'work-schedules', WorkScheduleViewSet, basename='work-schedules') # ДОДАНО

urlpatterns = [
    path('', include(router.urls)),
]