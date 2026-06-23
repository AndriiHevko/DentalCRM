import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent


load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.getenv('SECRET_KEY', 'fallback-secret-key')
DEBUG = os.getenv('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'users',
    'doctors',
    'medical_records',
    'services',
    'appointments',
    'invoices',
    'dashboard',

    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt.token_blacklist',
    'drf_yasg',
    'corsheaders',
    'django_filters',
    'django_apscheduler',
    'django_extensions',
]

AUTH_USER_MODEL = 'users.User'

AUTHENTICATION_BACKENDS = [
    'users.backends.EmailOrPhoneModelBackend',
    'django.contrib.auth.backends.ModelBackend',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]

ROOT_URLCONF = 'clinic.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'clinic.wsgi.application'



DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}



AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Europe/Kyiv'
USE_I18N = True
USE_TZ = True



STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],

    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # ОБОВ'ЯЗКОВО РОЗКОМЕНТУВАТИ!
    # Налаштування Throttling (обмеження кількості запитів до API,
    # Також обмежує частоту запитів на ендпоінт авторизації, захищаючи від brute-force.)

    # 'DEFAULT_THROTTLE_CLASSES': (
    #     'rest_framework.throttling.AnonRateThrottle',
    #     'rest_framework.throttling.UserRateThrottle',
    # ),
    # 'DEFAULT_THROTTLE_RATES': {
    #     # 'anon': '60/hour',
    #     # 'user': '1000/hour',
    #     # 'login': '20/minute',
    # },
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
}

CORS_ALLOW_CREDENTIALS = True

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'AUTH_HEADER_TYPES': ('Bearer',),
}


SWAGGER_SETTINGS = {
    'USE_SESSION_AUTH': False,
    'JSON_EDITOR': True,
}


DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Email backend — outputs emails to the console during development
# EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

STATIC_URL = 'static/'
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]

# Налаштування для реальної відправки листів через Gmail
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = f"Dental Clinic <{EMAIL_HOST_USER}>"

# URL фронтенду для формування посилань у листах
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

GRAPH_MODELS = {
  'GRAPHVIZ_DOT': r'D:\Graphviz\bin\dot.exe'
}