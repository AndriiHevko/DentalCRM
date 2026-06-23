import random
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Specialty(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name}"


class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True)
    identification_number = models.CharField(max_length=6, unique=True, blank=True, editable=False)    
    specialty = models.ForeignKey(Specialty, on_delete=models.SET_NULL, null=True)
    experience_years = models.PositiveIntegerField(default=0)
    image_url = models.URLField(blank=True)
    image = models.ImageField(upload_to='doctors_images/', blank=True, null=True)

    def save(self, *args, **kwargs):
        # Якщо номера ще немає, то створення нового запису
        if not self.identification_number:
            while True:
                # 6 значне випадкове число
                new_id = str(random.randint(100000, 999999))
                # Перевірка на унікальність
                if not Doctor.objects.filter(identification_number=new_id).exists():
                    self.identification_number = new_id
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} ({self.specialty})"

class WorkSchedule(models.Model):
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='work_schedules')
    day_of_week = models.PositiveSmallIntegerField(choices=[
        (1, 'Monday'),
        (2, 'Tuesday'),
        (3, 'Wednesday'),
        (4, 'Thursday'),
        (5, 'Friday'),
        (6, 'Saturday'),
        (7, 'Sunday'),
    ])
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    # Поля для обідньої перерви
    lunch_start = models.TimeField(null=True, blank=True)
    lunch_end = models.TimeField(null=True, blank=True)

    class Meta:
        unique_together = ("doctor", "day_of_week", "start_time")

    def __str__(self):
        return f"{self.doctor.full_name} - {self.get_day_of_week_display()} ({self.start_time} - {self.end_time})"