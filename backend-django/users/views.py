from rest_framework import viewsets, permissions, generics, filters
from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer, RegisterSerializer, ChangePasswordSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    CustomTokenObtainPairSerializer, PatientSerializer, VerifyEmailSerializer
)
from .permissions import _is_doctor, _is_admin
from .models import Patient
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenObtainPairView

User = get_user_model()


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['last_name', 'first_name', 'phone_number', 'email']
    ordering_fields = ['created_at', 'last_name', 'first_name']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['list', 'create', 'destroy']:
            return [permissions.IsAdminUser()]
        if self.action in ['retrieve', 'update', 'partial_update']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        user = self.request.user
        
        # Адміни та персонал бачать всіх пацієнтів
        if user.is_staff or user.is_superuser:
            return self.queryset
        
        # Лікарі бачать всіх пацієнтів
        if hasattr(user, 'doctor_profile'):
            return self.queryset
        
        # Звичайні користувачі бачать тільки себе
        if hasattr(user, 'patient_profile'):
            return self.queryset.filter(id=user.patient_profile.id)
        
        return self.queryset.none()
    
    def perform_destroy(self, instance):
        # При видаленні пацієнта, видалення і User

        # Збереження посилання на User перед видаленням Patient
        associated_user = instance.user 
        
        # Видалення Patient
        instance.delete() 
        
        # Якщо пацієнт був User, видалення і його
        if associated_user:
            associated_user.delete()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


class RegisterView(generics.CreateAPIView):
    # Реєстрація. Створює неактивного юзера і відправляє код на пошту.
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class VerifyEmailView(generics.GenericAPIView):
    # Підтвердження пошти. Активує юзера після реєстрації, генерує Patient та MedicalRecord
    serializer_class = VerifyEmailSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.save() 
        
        return Response(
            {"detail": "Пошту успішно підтверджено. Акаунт активовано, тепер ви можете увійти."}, 
            status=status.HTTP_200_OK
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenObtainPairView


class WebLoginView(TokenObtainPairView):
    # Лікарі та адміни = 403.

    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.user

        if _is_doctor(user):
            return Response(
                {'detail': 'Лікарі не можуть входити через веб-портал. '
                           'Використовуйте desktop-додаток.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class DesktopLoginView(TokenObtainPairView):
    # Адміни та пацієнти = 403.

    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.user

        if _is_doctor(user):
            return Response(serializer.validated_data, status=status.HTTP_200_OK)

        if _is_admin(user):
            return Response(
                {'detail': 'Адміністратори не можуть використовувати desktop-додаток.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(
            {'detail': 'Пацієнти не можуть входити через desktop-додаток.'},
            status=status.HTTP_403_FORBIDDEN,
        )
    
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"detail": "Refresh токен обов'язковий."}, status=status.HTTP_400_BAD_REQUEST)
                
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except TokenError:
            return Response({"detail": "Токен недійсний або вже відкликаний."}, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            if not self.object.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Невірний старий пароль."]}, status=status.HTTP_400_BAD_REQUEST)
            
            self.object.set_password(serializer.data.get("new_password"))
            self.object.save()
            return Response({"detail": "Пароль успішно змінено."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetRequestView(generics.GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        user = User.objects.filter(email=email).first()
        if user:
            print(f"✅ Користувача знайдено! Спроба відправити лист на {email}...")

            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            
            base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            reset_link = f"{base_url}/reset-password?uid={uid}&token={token}"

            try:
                send_mail(
                    subject='Dental Clinic: Відновлення паролю',
                    message=f'Для скидання паролю вашого акаунту перейдіть за цим посиланням:\n{reset_link}',
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@dentalclinic.ua'),
                    recipient_list=[email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Помилка відправки листа на {email}: {str(e)}")
                return Response(
                    {"detail": "Виникла помилка при відправці листа. Спробуйте пізніше."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        return Response(
            {"detail": "Якщо вказаний email існує в системі, на нього було відправлено інструкцію."},
            status=status.HTTP_200_OK
        )


class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uidb64 = serializer.validated_data['uidb64']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({"detail": "Ваш пароль було успішно змінено. Тепер ви можете увійти."}, status=status.HTTP_200_OK)

        return Response({"detail": "Посилання для скидання паролю недійсне або застаріло."}, status=status.HTTP_400_BAD_REQUEST)