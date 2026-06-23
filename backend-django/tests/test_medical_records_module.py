from django.db import IntegrityError
from django.test import TestCase
from django.contrib.auth import get_user_model
from users.models import Patient
from doctors.models import Doctor, Specialty
from services.models import Service
from medical_records.models import MedicalRecord, TreatmentRecord, Tooth

User = get_user_model()


class MedicalRecordsModuleTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='+380501234575',
            email='patient2@example.com',
            password='patientpass2',
            phone='+380501234575',
            first_name='Sergii',
            last_name='Patient',
        )

        cls.patient = Patient.objects.create(
            user=cls.user,
            first_name='Sergii',
            last_name='Patient',
            phone_number='+380501234575',
            email='patient2@example.com',
        )

        cls.specialty = Specialty.objects.create(name='Prosthetics', description='Dental prosthetics')
        cls.doctor = Doctor.objects.create(
            user=User.objects.create_user(
                username='+380501234576',
                email='doctor3@example.com',
                password='doctorpass3',
                phone='+380501234576',
                first_name='Natalia',
                last_name='Dentist',
            ),
            full_name='Dr. Natalia Bondar',
            phone='+380501234576',
            email='doctor3@example.com',
            specialty=cls.specialty,
            experience_years=8,
        )

        cls.service = Service.objects.create(
            name='Crown',
            description='Crown installation',
            price='2500.00',
            duration_minutes=90,
            specialty=cls.specialty,
        )

        cls.record = MedicalRecord.objects.create(patient=cls.patient, notes='Initial record')

    def test_medical_record_str_returns_patient_name(self):
        expected = f"MedicalRecord: {self.patient.first_name} {self.patient.last_name}"
        self.assertEqual(str(self.record), expected)

    def test_treatment_record_can_attach_service_and_doctor(self):
        treatment = TreatmentRecord.objects.create(
            medical_record=self.record,
            doctor=self.doctor,
            diagnosis='Routine crown fitting',
            notes='Everything looks healthy',
        )
        treatment.services.set([self.service])

        self.assertEqual(treatment.services.count(), 1)
        self.assertEqual(treatment.services.first(), self.service)
        self.assertEqual(str(treatment), f"Treatment by {self.doctor} for {self.record.patient.full_name} on {treatment.date}")

    def test_tooth_unique_together_constraint_raises_integrity_error(self):
        Tooth.objects.create(
            medical_record=self.record,
            tooth_number=11,
            status='filling',
            notes='New filling',
        )

        with self.assertRaises(IntegrityError):
            Tooth.objects.create(
                medical_record=self.record,
                tooth_number=11,
                status='caries',
                notes='Duplicate tooth entry',
            )
