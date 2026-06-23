from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from .models import MedicalRecord, TreatmentRecord, Tooth
from .serializers import MedicalRecordSerializer, TreatmentRecordSerializer, ToothSerializer, DentalChartSerializer
from .permissions import IsDoctorOrAdminOrOwner


class MedicalRecordViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctorOrAdminOrOwner]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return MedicalRecord.objects.none()
        user = self.request.user

        if user.is_staff or user.is_superuser:
            return MedicalRecord.objects.all().order_by('-created_at')

        if hasattr(user, 'doctor_profile'):
            return MedicalRecord.objects.all().order_by('-created_at')

        # Повернення medical record пацієнта
        if hasattr(user, 'patient_profile'):
            return MedicalRecord.objects.filter(patient=user.patient_profile).order_by('-created_at')
        
        return MedicalRecord.objects.none()

    @action(detail=False, methods=['get'], url_path=r'by_patient/(?P<patient_id>\d+)')
    def by_patient(self, request, patient_id=None):
        if getattr(self, 'swagger_fake_view', False):
            return Response()
        
        try:
            medical_record = self.get_queryset().get(patient_id=patient_id)
            serializer = self.get_serializer(medical_record)
            return Response(serializer.data)
        except MedicalRecord.DoesNotExist:
            raise NotFound(detail="No MedicalRecord matches the given patient.")

    @action(detail=False, methods=['get', 'post', 'put'], url_path=r'patient/(?P<patient_id>\d+)/dental-chart')
    def patient_dental_chart(self, request, patient_id=None):
        if getattr(self, 'swagger_fake_view', False):
            return Response()
            
        try:
            # Пошук medical record за ID пацієнта, якщо немає, то створення нового
            medical_record, created = MedicalRecord.objects.get_or_create(patient_id=patient_id)
        except Exception:
            return Response(
                {"detail": "Пацієнта з таким ID не знайдено."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        if request.method == 'GET':
            teeth = medical_record.teeth.all()
            serializer = ToothSerializer(teeth, many=True)
            return Response(serializer.data)

        elif request.method in ['POST', 'PUT']:
            serializer = DentalChartSerializer(medical_record, data=request.data)
            if serializer.is_valid():
                serializer.save()
                teeth = medical_record.teeth.all()
                response_serializer = ToothSerializer(teeth, many=True)
                return Response(response_serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TreatmentRecordViewSet(viewsets.ModelViewSet):
    serializer_class = TreatmentRecordSerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctorOrAdminOrOwner]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return TreatmentRecord.objects.none()
        user = self.request.user
        
        if user.is_staff or user.is_superuser or hasattr(user, 'doctor_profile'):
            return TreatmentRecord.objects.all().order_by('-date', '-id')
        if hasattr(user, 'patient_profile'):
            return TreatmentRecord.objects.filter(medical_record__patient=user.patient_profile).order_by('-date', '-id')
        return TreatmentRecord.objects.none()

    def perform_create(self, serializer):
        treatment = serializer.save()

        med_record = treatment.medical_record
        med_record.save()