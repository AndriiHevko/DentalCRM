from rest_framework import permissions

class IsDoctorOrAdminOrOwner(permissions.BasePermission):
    # Patient → тільки свої medical records
    # Doctor → всі medical records
    # Admin → всі medical records

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if hasattr(request.user, 'doctor_profile'):
            return True

        if request.user.is_staff or request.user.is_superuser:
            return True

        if hasattr(obj, 'patient'):
            return obj.patient.user == request.user
        elif hasattr(obj, 'medical_record'):
            return obj.medical_record.patient.user == request.user
        return False
