from rest_framework import serializers
from .models import Service
from doctors.models import Specialty

class ServiceSerializer(serializers.ModelSerializer):
    # Повертання назви при GET
    specialty = serializers.CharField(source='specialty.name', read_only=True)
    
    # Поле для запису (POST/PUT), для ID спеціальності
    specialty_id = serializers.PrimaryKeyRelatedField(
        queryset=Specialty.objects.all(), 
        source='specialty', 
        write_only=True, 
        required=False, 
        allow_null=True
    )
    
    image_url = serializers.URLField(required=False, allow_blank=True)

    class Meta:
        model = Service
        fields = [
            'id',
            'name',
            'description',
            'price',
            'duration_minutes',
            'specialty',
            'specialty_id',
            'image_url',
            'image', 
        ]