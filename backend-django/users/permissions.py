from rest_framework import permissions


def _is_doctor(user) -> bool:
    return hasattr(user, 'doctor_profile')


def _is_admin(user) -> bool:
    return bool(user.is_staff or user.is_superuser)


class IsAdminOrReadOnly(permissions.BasePermission):
    # Read-only для всіх
    # зміна (POST, PUT, PATCH, DELETE) тільки адміністратори
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and _is_admin(request.user))


class IsWebUser(permissions.BasePermission):
    # Доступ лише пацієнтам (не Doctor, не Admin).
    message = 'Доступ дозволено лише пацієнтам через веб-портал.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return not _is_doctor(user) and not _is_admin(user)


class IsDoctor(permissions.BasePermission):
    # Доступ лише лікарям (мають doctor_profile).
    message = 'Доступ дозволено лише лікарям.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return _is_doctor(user)


class IsDoctorOrAdmin(permissions.BasePermission):
    # Доступ лише лікарям або адміністраторам.
    message = 'Доступ дозволено лише лікарям та адміністраторам.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return _is_doctor(user) or _is_admin(user)
