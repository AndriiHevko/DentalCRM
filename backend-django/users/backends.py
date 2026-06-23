from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

UserModel = get_user_model()

class EmailOrPhoneModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)
        if username is None:
            return None
            
        try:
            # Пошук user за email, або за телефоном
            user = UserModel.objects.filter(
                Q(email__iexact=username) | Q(phone=username) | Q(username=username)
            ).distinct().first()
            if user is None:
                raise UserModel.DoesNotExist
            
        except UserModel.DoesNotExist:
            UserModel().set_password(password)
            return None
            
        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
