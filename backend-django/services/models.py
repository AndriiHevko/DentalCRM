from django.db import models
from doctors.models import Specialty

class Service(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_minutes = models.PositiveIntegerField()
    specialty = models.ForeignKey(Specialty, on_delete=models.SET_NULL,
                                  null=True, related_name='services')
    
    image_url = models.URLField(blank=True)
    # Завантаження зображення
    image = models.ImageField(upload_to='services_images/', blank=True, null=True)

    def __str__(self):
        return f"{self.name}"