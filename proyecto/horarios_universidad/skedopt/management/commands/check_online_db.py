"""
Comprueba que Django use Postgres (Supabase) y no SQLite, y que se pueda leer/escribir.

Uso:  python manage.py check_online_db
"""

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Verifica conexión a la base online y cuenta filas en areas/profesores/materias"

    def handle(self, *args, **options):
        db = settings.DATABASES["default"]
        engine = db["ENGINE"]

        if engine.endswith("sqlite3"):
            self.stdout.write(
                self.style.ERROR(
                    "Estás en SQLite (archivo local). No es Supabase.\n"
                    "Creá un archivo .env junto a manage.py con:\n"
                    "  DB_HOST=db.TU-PROYECTO.supabase.co\n"
                    "  DB_PASSWORD=...\n"
                    "  (y DB_USER, DB_NAME si hace falta)\n"
                    "Luego: python manage.py migrate"
                )
            )
            return

        self.stdout.write(self.style.SUCCESS(f"Motor: {engine}"))
        self.stdout.write(f"HOST: {db.get('HOST')}")
        self.stdout.write(f"NAME: {db.get('NAME')}")

        try:
            connection.ensure_connection()
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Conexión falló: {e}"))
            return

        self.stdout.write(self.style.SUCCESS("Conexión OK."))

        from skedopt.models import Area, Materia, Profesor

        self.stdout.write(f"areas:      {Area.objects.count()} filas")
        self.stdout.write(f"profesores: {Profesor.objects.count()} filas")
        self.stdout.write(f"materias:   {Materia.objects.count()} filas")
        self.stdout.write(
            self.style.SUCCESS(
                "\nSi los números suben después de optimizar, Supabase está guardando bien."
            )
        )
