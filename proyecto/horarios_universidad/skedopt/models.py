from django.db import models


class Area(models.Model):
    nombre = models.CharField(max_length=255)

    class Meta:
        db_table = "areas"


class Profesor(models.Model):
    nombre_completo = models.CharField(max_length=255)
    activo = models.SmallIntegerField(default=1)

    class Meta:
        db_table = "profesores"


class Materia(models.Model):
    codigo = models.CharField(max_length=100, unique=True)
    nombre = models.CharField(max_length=255)
    area = models.ForeignKey(
        Area, on_delete=models.PROTECT, db_column="area_id", related_name="materias"
    )

    class Meta:
        db_table = "materias"
