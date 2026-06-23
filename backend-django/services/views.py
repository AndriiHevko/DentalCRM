from rest_framework import viewsets, permissions
from .models import Service
from .serializers import ServiceSerializer
from users.permissions import IsAdminOrReadOnly

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.select_related('specialty').order_by('name')
    serializer_class = ServiceSerializer
    permission_classes = [IsAdminOrReadOnly]
