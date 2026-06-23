from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ServiceViewSet

router = DefaultRouter()
router.register(r'services', ServiceViewSet, basename='services')

urlpatterns = [
    path('', include(router.urls)),
]