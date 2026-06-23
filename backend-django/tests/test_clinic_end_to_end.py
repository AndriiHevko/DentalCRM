import datetime
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from users.models import User, Patient
from doctors.models import Doctor, Specialty, WorkSchedule
from services.models import Service
from appointments.models import Appointment


class ClinicBackendTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin_user = User.objects.create_superuser(
            username='adminuser',
            email='admin@example.com',
            password='adminpass',
            phone='+380501234567',
        )

        cls.doctor_user = User.objects.create_user(
            username='+380501234568',
            email='doctor@example.com',
            password='doctorpass',
            phone='+380501234568',
            first_name='Ivan',
            last_name='Doc',
        )

        cls.patient_user = User.objects.create_user(
            username='+380501234569',
            email='patient@example.com',
            password='patientpass',
            phone='+380501234569',
            first_name='Anna',
            last_name='Patient',
        )

        cls.specialty = Specialty.objects.create(
            name='Therapy',
            description='General dental therapy',
        )

        cls.doctor = Doctor.objects.create(
            user=cls.doctor_user,
            full_name='Dr. Ivan Petrenko',
            phone='+380501234568',
            email='doctor@example.com',
            specialty=cls.specialty,
            experience_years=7,
        )

        cls.patient = Patient.objects.create(
            user=cls.patient_user,
            first_name='Anna',
            last_name='Patient',
            phone_number='+380501234569',
            email='patient@example.com',
        )

        cls.service = Service.objects.create(
            name='Cleaning',
            description='Routine dental cleaning',
            price='500.00',
            duration_minutes=30,
            specialty=cls.specialty,
        )

        target_date = timezone.localtime() + datetime.timedelta(days=1)
        cls.target_date = target_date.date()
        cls.schedule = WorkSchedule.objects.create(
            doctor=cls.doctor,
            day_of_week=cls.target_date.isoweekday(),
            start_time=datetime.time(hour=9, minute=0),
            end_time=datetime.time(hour=18, minute=0),
            lunch_start=datetime.time(hour=13, minute=0),
            lunch_end=datetime.time(hour=14, minute=0),
        )

    def setUp(self):
        self.client = APIClient()

    def test_doctor_identification_number_is_assigned(self):
        self.assertIsNotNone(self.doctor.identification_number)
        self.assertEqual(len(self.doctor.identification_number), 6)
        self.assertTrue(self.doctor.identification_number.isdigit())

    def test_patient_cannot_create_appointment_inside_45_minute_buffer(self):
        self.client.force_authenticate(user=self.patient_user)

        appointment_datetime = timezone.now() + datetime.timedelta(minutes=30)
        payload = {
            'doctor_id': self.doctor.id,
            'service': self.service.id,
            'appointment_datetime': appointment_datetime.isoformat(),
        }

        url = reverse('appointments-list')
        response = self.client.post(url, payload, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('45 хвилин', str(response.data))

    def test_patient_me_endpoint_returns_only_own_appointments(self):
        appointment_datetime = datetime.datetime.combine(
            self.target_date,
            datetime.time(hour=10, minute=0),
            tzinfo=timezone.get_current_timezone(),
        )

        Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            service=self.service,
            appointment_datetime=appointment_datetime,
            status='scheduled',
        )

        self.client.force_authenticate(user=self.patient_user)
        url = reverse('appointments-me')
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['doctor_name'], self.doctor.full_name)
        self.assertEqual(response.data['results'][0]['status'], 'scheduled')

    def test_create_and_update_appointment_flow(self):
        self.client.force_authenticate(user=self.admin_user)

        appointment_datetime = datetime.datetime.combine(
            self.target_date,
            datetime.time(hour=11, minute=0),
            tzinfo=timezone.get_current_timezone(),
        )

        create_payload = {
            'patient': self.patient.id,
            'doctor': self.doctor.id,
            'service': self.service.id,
            'appointment_datetime': appointment_datetime.isoformat(),
        }

        create_url = reverse('appointments-list')
        create_response = self.client.post(create_url, create_payload, format='json')

        self.assertEqual(create_response.status_code, 201)
        appointment_id = create_response.data['id']
        self.assertEqual(create_response.data['status'], 'scheduled')

        detail_url = reverse('appointments-detail', args=[appointment_id])
        update_payload = {'status': 'done'}
        update_response = self.client.patch(detail_url, update_payload, format='json')

        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.data['status'], 'done')

        fetch_response = self.client.get(detail_url)
        self.assertEqual(fetch_response.status_code, 200)
        self.assertEqual(fetch_response.data['id'], appointment_id)
        self.assertEqual(fetch_response.data['doctor_name'], self.doctor.full_name)
        self.assertEqual(fetch_response.data['patient_name'], f'{self.patient.first_name} {self.patient.last_name}')
