from django.urls import path, include
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

schema_view = get_schema_view(
    openapi.Info(
        title="Clinic API",
        default_version="v1",
        description="Dental Clinic Backend",
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/', include('users.urls')),
    path('api/', include('medical_records.urls')),
    path('api/', include('doctors.urls')),
    path('api/', include('services.urls')),
    path('api/', include('appointments.urls')),
    path('api/', include('invoices.urls')),
    path('api/', include('dashboard.urls')),

    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)