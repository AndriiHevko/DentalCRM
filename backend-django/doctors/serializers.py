from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Doctor, Specialty, WorkSchedule

User = get_user_model()

class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = ['id', 'name', 'description']

class WorkScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkSchedule
        fields = ['id', 'doctor', 'day_of_week', 'start_time', 'end_time', 'lunch_start', 'lunch_end']

class DoctorSerializer(serializers.ModelSerializer):
    specialty = SpecialtySerializer(read_only=True)
    specialty_id = serializers.PrimaryKeyRelatedField(
        queryset=Specialty.objects.all(), source='specialty', write_only=True
    )
    work_schedules = WorkScheduleSerializer(many=True, read_only=True)
    
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    identification_number = serializers.CharField(read_only=True)

    class Meta:
        model = Doctor
        fields = [
            'id', 'full_name', 'phone', 'email', 'identification_number',
            'specialty', 'specialty_id', 'experience_years', 
            'image_url', 'image',
            'work_schedules', 'password', 
        ]

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
             raise serializers.ValidationError({"password": "Пароль є обов'язковим для створення лікаря."})
        phone = validated_data.get('phone')
        email = validated_data.get('email')
        full_name = validated_data.get('full_name', '')
        
        name_parts = full_name.split()
        first_name = name_parts[0] if name_parts else ''
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ''

        user = User.objects.create_user(
            username=phone,
            phone=phone,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        doctor = Doctor.objects.create(user=user, **validated_data)
        return doctor

    @transaction.atomic
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        
        instance.full_name = validated_data.get('full_name', instance.full_name)
        instance.phone = validated_data.get('phone', instance.phone)
        instance.email = validated_data.get('email', instance.email)
        instance.experience_years = validated_data.get('experience_years', instance.experience_years)
        
        if 'specialty' in validated_data:
            instance.specialty = validated_data['specialty']
            
        if 'image' in validated_data:
            instance.image = validated_data['image']
        if 'image_url' in validated_data:
            instance.image_url = validated_data['image_url']
            
        instance.save()

        user = instance.user
        if user:
            user.username = instance.phone 
            user.phone = instance.phone
            user.email = instance.email
            
            name_parts = instance.full_name.split()
            user.first_name = name_parts[0] if name_parts else ''
            user.last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ''
            
            if password: 
                user.set_password(password)
            user.save()

        return instance