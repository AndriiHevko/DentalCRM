from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, RegisterView, ProfileView, LogoutView,
    ChangePasswordView, PasswordResetRequestView, PasswordResetConfirmView,
    WebLoginView, DesktopLoginView, PatientViewSet, VerifyEmailView
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'patients', PatientViewSet, basename='patients')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('login/', WebLoginView.as_view(), name='web_login'),
    path('desktop/login/', DesktopLoginView.as_view(), name='desktop_login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('password-change/', ChangePasswordView.as_view(), name='password_change'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]
