import os
import warnings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

try:
    from dotenv import load_dotenv

    load_dotenv(BASE_DIR / ".env")
except ImportError:
    pass

SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-dev-cambiar-en-produccion",
)

DEBUG = True

ALLOWED_HOSTS = ["127.0.0.1", "localhost"]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "skedopt",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "horarios_site.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "horarios_site.wsgi.application"

# Base de datos: con variables de entorno todos usan la misma BD online sin tocar código.
# Copiá .env.example → .env y completá valores (Supabase: Settings → Database).
# Si no hay DB_HOST, se usa SQLite local solo para pruebas rápidas (datos distintos al equipo).
_db_host = (os.environ.get("DB_HOST") or "").strip()
if _db_host:
    DATABASES = {
        "default": {
            "ENGINE": os.environ.get(
                "DB_ENGINE", "django.db.backends.postgresql"
            ),
            "NAME": os.environ.get("DB_NAME", "postgres"),
            "USER": os.environ.get("DB_USER", "postgres"),
            "PASSWORD": os.environ.get("DB_PASSWORD", ""),
            "HOST": _db_host,
            "PORT": os.environ.get("DB_PORT", "5432"),
            "OPTIONS": {"sslmode": os.environ.get("DB_SSLMODE", "require")},
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
    warnings.warn(
        "Base de datos: SQLite local (no hay DB_HOST en .env). "
        "Eso NO es Supabase: cada PC tiene su propio archivo y el equipo no ve esos datos. "
        "Para compartir la misma base, creá .env con DB_HOST, DB_USER y DB_PASSWORD del proyecto Supabase.",
        UserWarning,
        stacklevel=1,
    )

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "es-co"

TIME_ZONE = "America/Bogota"

USE_I18N = True

USE_TZ = True

STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

HORARIOS_OUTPUT_DIR = BASE_DIR / "outputs"
