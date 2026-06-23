import random
from django.db import transaction
from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from medical_records.serializers import MedicalRecordSerializer
from medical_records.models import MedicalRecord
from .models import Patient
from doctors.serializers import DoctorSerializer
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q


User = get_user_model()


class PatientSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True, required=False)
    username = serializers.CharField(source='user.username', read_only=True, required=False)
    
    class Meta:
        model = Patient
        fields = [
            'id',
            'first_name',
            'last_name', 
            'phone_number',
            'date_of_birth',
            'email',
            'address',
            'user_id',
            'username',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_active']


class UserSerializer(serializers.ModelSerializer):
    patient_profile = PatientSerializer(read_only=True)
    medical_record = MedicalRecordSerializer(read_only=True)
    
    doctor_profile = DoctorSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 
            'username', 
            'first_name', 
            'last_name', 
            'phone', 
            'email', 
            'date_of_birth', 
            'gender', 
            'address', 
            'patient_profile', 
            'medical_record',
            'doctor_profile',
            'is_staff'
        ]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    username = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ["username", "password", "first_name", "last_name", "phone", "email", "date_of_birth", "gender"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        phone = validated_data.get("phone")
        email = validated_data.get("email")
        validated_data["username"] = phone

        existing_user = User.objects.filter(Q(phone=phone) | Q(username=phone)).first()

        if existing_user:
            if existing_user.is_active:
                raise serializers.ValidationError({"phone": "Користувач з таким номером вже зареєстрований та активний."})
            else:
                existing_user.delete()

        patient = Patient.objects.filter(phone_number=phone).first()

        if patient:
            if patient.user is not None and patient.user.is_active:
                raise serializers.ValidationError({
                    "phone": "Цей номер телефону вже має створений онлайн-кабінет. Увійдіть у систему."
                })
            
            is_name_match = (
                patient.first_name.strip().lower() == validated_data.get("first_name", "").strip().lower() and
                patient.last_name.strip().lower() == validated_data.get("last_name", "").strip().lower()
            )

            if not is_name_match:
                raise serializers.ValidationError({
                    "non_field_errors": "Знайдено медичну картку за цим номером, але ім'я не збігається. Зверніться в Dental Clinic."
                })

        validated_data["is_active"] = False 
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        import random
        from django.core.cache import cache
        from django.core.mail import send_mail
        from django.conf import settings

        otp_code = str(random.randint(100000, 999999))
        cache.set(f'activation_otp_{user.email}', otp_code, timeout=600)

        subject = 'Підтвердження реєстрації в Dental Clinic'
        message = f'Вітаємо, {user.first_name}!\n\nВаш код для підтвердження реєстрації: {otp_code}\nКод дійсний 10 хвилин.'
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            user.delete()
            raise serializers.ValidationError({"email": "Помилка відправки листа. Перевірте email."})

        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password = serializers.CharField(required=True, min_length=8)
    uidb64 = serializers.CharField(required=True)
    token = serializers.CharField(required=True)


def get_user_role(user) -> str:
    # Роль користувача admin / doctor / user.
    if user.is_staff or user.is_superuser:
        return 'admin'
    if hasattr(user, 'doctor_profile'):
        return 'doctor'
    return 'user'


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    # поле 'role' у payload токена та відповіді на логін.
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = get_user_role(user)
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = get_user_role(self.user)
        return data


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    code = serializers.CharField(required=True, max_length=6)

    def validate(self, data):
        email = data.get('email')
        code = data.get('code')

        saved_code = cache.get(f'activation_otp_{email}')

        if not saved_code:
            raise serializers.ValidationError({"code": "Код недійсний або його час дії (10 хв) минув."})
        
        if saved_code != code:
            raise serializers.ValidationError({"code": "Неправильний код підтвердження."})

        return data

    def save(self):
        email = self.validated_data['email']
        user = User.objects.get(email=email)
        
        user.is_active = True
        user.save()
        
        cache.delete(f'activation_otp_{email}')

        patient = Patient.objects.filter(phone_number=user.phone).first()
        
        if patient:
            patient.user = user
            if not patient.email:
                patient.email = user.email
            if user.date_of_birth and not patient.date_of_birth:
                patient.date_of_birth = user.date_of_birth
            patient.save()
        else:
            patient = Patient.objects.create(
                user=user,
                first_name=user.first_name,
                last_name=user.last_name,
                phone_number=user.phone,
                email=user.email,
                date_of_birth=user.date_of_birth,
            )
            MedicalRecord.objects.create(patient=patient)

        return user