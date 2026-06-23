import datetime
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from users.models import User, Patient
from doctors.models import Doctor, Specialty, WorkSchedule
from services.models import Service


class DoctorsModuleTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin_user = User.objects.create_superuser(
            username='adminuser2',
            email='admin2@example.com',
            password='adminpass2',
            phone='+380501234572',
        )

        cls.doctor_user = User.objects.create_user(
            username='+380501234573',
            email='doc2@example.com',
            password='doctorpass2',
            phone='+380501234573',
            first_name='Petro',
            last_name='Doctor',
        )

        cls.specialty = Specialty.objects.create(name='Surgery', description='Oral surgery')
        cls.doctor = Doctor.objects.create(
            user=cls.doctor_user,
            full_name='Dr. Petro Sidorov',
            phone='+380501234573',
            email='doc2@example.com',
            specialty=cls.specialty,
            experience_years=12,
        )

        cls.service = Service.objects.create(
            name='Extraction',
            description='Tooth extraction',
            price='1200.00',
            duration_minutes=45,
            specialty=cls.specialty,
        )

        target_date = timezone.localtime() + datetime.timedelta(days=2)
        cls.target_date = target_date.date()
        WorkSchedule.objects.create(
            doctor=cls.doctor,
            day_of_week=cls.target_date.isoweekday(),
            start_time=datetime.time(hour=9, minute=0),
            end_time=datetime.time(hour=17, minute=0),
            lunch_start=datetime.time(hour=12, minute=0),
            lunch_end=datetime.time(hour=12, minute=45),
        )

    def setUp(self):
        self.client = APIClient()

    def test_doctor_availability_endpoint_returns_slots(self):
        self.client.force_authenticate(user=self.admin_user)

        url = reverse('doctors-availability', args=[self.doctor.id])
        response = self.client.get(
            url,
            {'date': self.target_date.isoformat(), 'service_id': self.service.id},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('available_slots', response.data)
        self.assertIsInstance(response.data['available_slots'], list)

    def test_doctor_search_and_list_endpoint_available_for_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('doctors-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertIn('results', response.data)
        self.assertTrue(any(item['full_name'] == self.doctor.full_name for item in response.data['results']))
