from unittest.mock import patch
from django.test import TestCase
from django.urls import reverse
from django.core.cache import cache
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from users.models import Patient

User = get_user_model()


class UsersModuleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username='adminuser',
            email='admin@example.com',
            password='adminpass',
            phone='+380501234567',
        )

    @patch('django.core.mail.send_mail')
    def test_user_registration_and_verify_email_creates_patient(self, mocked_send_mail):
        mocked_send_mail.return_value = 1

        payload = {
            'first_name': 'Oksana',
            'last_name': 'Ivanova',
            'phone': '+380501234570',
            'email': 'oksana@example.com',
            'password': 'strongpassword',
        }

        register_url = reverse('register')
        response = self.client.post(register_url, payload, format='json')

        self.assertEqual(response.status_code, 201)
        guest_user = User.objects.get(email='oksana@example.com')
        self.assertFalse(guest_user.is_active)
        self.assertTrue(mocked_send_mail.called)

        activation_key = cache.get(f'activation_otp_{guest_user.email}')
        self.assertIsNotNone(activation_key)

        verify_url = reverse('verify-email')
        verify_response = self.client.post(
            verify_url,
            {'email': guest_user.email, 'code': activation_key},
            format='json'
        )

        self.assertEqual(verify_response.status_code, 200)
        guest_user.refresh_from_db()
        self.assertTrue(guest_user.is_active)
        self.assertTrue(Patient.objects.filter(user=guest_user).exists())

    def test_profile_endpoint_returns_authenticated_user_data(self):
        self.client.force_authenticate(user=self.admin_user)

        profile_url = reverse('profile')
        response = self.client.get(profile_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['email'], self.admin_user.email)
        self.assertEqual(response.data['phone'], self.admin_user.phone)

    def test_admin_can_list_patients(self):
        Patient.objects.create(
            first_name='Maria',
            last_name='Petrenko',
            phone_number='+380501234571',
            email='maria@example.com',
        )

        self.client.force_authenticate(user=self.admin_user)
        url = reverse('patients-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertIn('results', response.data)
        self.assertGreaterEqual(len(response.data['results']), 1)
