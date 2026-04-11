# PostgreSQL: si hubo INSERT manuales con id fijo, la secuencia puede quedar
# desincronizada y el siguiente INSERT intenta duplicar la PK (p. ej. id=1).

from django.db import migrations


def sync_sequences(apps, schema_editor):
    conn = schema_editor.connection
    if conn.vendor != "postgresql":
        return
    with conn.cursor() as cursor:
        for table in ("areas", "profesores", "materias"):
            cursor.execute(f"SELECT COALESCE(MAX(id), 0) FROM {table}")
            max_id = cursor.fetchone()[0]
            cursor.execute(
                "SELECT pg_get_serial_sequence(%s, 'id')",
                [table],
            )
            row = cursor.fetchone()
            seq = row[0] if row else None
            if not seq:
                continue
            if max_id == 0:
                cursor.execute("SELECT setval(%s, 1, false)", [seq])
            else:
                cursor.execute("SELECT setval(%s, %s, true)", [seq, max_id])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("skedopt", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(sync_sequences, noop_reverse),
    ]
