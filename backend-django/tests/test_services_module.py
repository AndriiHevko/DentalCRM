from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from users.models import User
from doctors.models import Specialty
from services.models import Service


class ServicesModuleTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin_user = User.objects.create_superuser(
            username='adminuser3',
            email='admin3@example.com',
            password='adminpass3',
            phone='+380501234574',
        )

        cls.specialty = Specialty.objects.create(
            name='Orthodontics',
            description='Alignment and braces',
        )

    def setUp(self):
        self.client = APIClient()

    def test_admin_can_create_service_via_api(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('services-list')

        payload = {
            'name': 'Braces Consultation',
            'description': 'Initial orthodontic consultation',
            'price': '900.00',
            'duration_minutes': 60,
            'specialty': self.specialty.id,
        }

        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['name'], 'Braces Consultation')

    def test_anonymous_can_list_services_but_cannot_create(self):
        Service.objects.create(
            name='Checkup',
            description='Routine dental checkup',
            price='300.00',
            duration_minutes=30,
            specialty=self.specialty,
        )

        list_url = reverse('services-list')
        list_response = self.client.get(list_url)
        self.assertEqual(list_response.status_code, 200)
        self.assertIn('results', list_response.data)
        self.assertGreaterEqual(len(list_response.data['results']), 1)

        create_payload = {
            'name': 'X-ray',
            'description': 'Dental x-ray analysis',
            'price': '450.00',
            'duration_minutes': 20,
            'specialty': self.specialty.id,
        }
        create_response = self.client.post(list_url, create_payload, format='json')
        self.assertEqual(create_response.status_code, 401)
