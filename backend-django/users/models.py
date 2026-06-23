from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError


class User(AbstractUser):
    # Авторизація. Patient через OneToOneField
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
    ]
    
    phone = models.CharField(
        max_length=20, 
        unique=True,
        help_text="Номер телефону використовується як username"
    )
    email = models.EmailField(max_length=100, unique=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=1, 
        choices=GENDER_CHOICES, 
        blank=True, 
        null=True
    )
    address = models.CharField(max_length=250, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['phone']),
            models.Index(fields=['email']),
        ]

    def __str__(self):
        return f"{self.get_full_name()} ({self.phone})"

    def get_full_name(self):
        # Повне ім'я користувача
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name or self.username

    def save(self, *args, **kwargs):
        # Номер телефону завжди відповідає username
        if self.phone:
            self.username = self.phone
            
        super().save(*args, **kwargs)

        # Синхронізація даних до Patient
        if hasattr(self, 'patient_profile') and not getattr(self, '_syncing', False):
            patient = self.patient_profile
            patient._syncing = True 
            patient.first_name = self.first_name
            patient.last_name = self.last_name
            patient.phone_number = self.phone
            patient.email = self.email
            patient.date_of_birth = self.date_of_birth
            patient.address = self.address
            
            patient.save()
            
            delattr(patient, '_syncing')


class Patient(models.Model):
    # Пацієнт. Може існувати без User, але якщо User є - синхронізує дані.
    user = models.OneToOneField(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='patient_profile',
        help_text="Облік користувача (опціональний)"
    )
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone_number = models.CharField(
        max_length=20, 
        unique=True,
        help_text="Унікальний номер телефону пацієнта"
    )
    
    date_of_birth = models.DateField(null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    address = models.CharField(max_length=250, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    is_active = models.BooleanField(
        default=True,
        help_text="Чи активний пацієнт в системі"
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Patients"
        indexes = [
            models.Index(fields=['phone_number']),
            models.Index(fields=['user']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.phone_number})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        # Синхронізація даних до User
        if self.user and not getattr(self, '_syncing', False):
            user = self.user
            user._syncing = True 
            user.first_name = self.first_name
            user.last_name = self.last_name
            user.phone = self.phone_number
            user.username = self.phone_number

            if self.email:  
                user.email = self.email
                
            user.date_of_birth = self.date_of_birth
            user.address = self.address
            
            user.save()
            
            delattr(user, '_syncing')