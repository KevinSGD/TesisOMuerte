import json
from pathlib import Path

from django.conf import settings
from django.contrib import messages
from django.http import FileResponse, Http404
from django.shortcuts import redirect, render
from django.views.decorators.http import require_GET, require_POST

from core.data_builder import nombre_area_desde_categoria_ui
from skedopt.models import Area, Materia, Profesor
from skedopt.schedule_grid import construir_tabla_horario


# =========================================
# 🟢 VISTA PRINCIPAL
# =========================================
def index(request):
    return render(
        request,
        "skedopt/index.html",
        {
            "last_excel_basename": request.session.get("last_excel_basename"),
            "tiene_horario_tabla": bool(request.session.get("horario_tabla")),
        },
    )


# =========================================
# 🟢 NUEVA VISTA RESULTADO
# =========================================
def resultado(request):
    return render(request, "skedopt/resultado.html")


# =========================================
# 🟢 VER HORARIO
# =========================================
@require_GET
def horario_clases(request):
    data = request.session.get("horario_tabla")

    if not data or not data.get("filas"):
        messages.warning(
            request,
            "No hay horario en sesión. Ejecuta primero la optimización.",
        )
        return redirect("skedopt:index")

    nombre = (request.GET.get("nombre") or "").strip() or "Estudiante"

    return render(
        request,
        "skedopt/horario_clases.html",
        {
            "nombre": nombre,
            "dias": data["dias"],
            "filas": data["filas"],
            "last_excel_basename": request.session.get("last_excel_basename"),
        },
    )


# =========================================
# 🔥 OPTIMIZACIÓN + GUARDADO EN BD
# =========================================
@require_POST
def optimize(request):
    from core.config import DEFAULT_CONFIG
    from core.data_builder import build_data_from_ui
    from core.pipeline import run_pipeline

    raw_mat = request.POST.get("materias") or "[]"
    raw_prof = request.POST.get("profesores") or "[]"

    try:
        tiempo_ms = int(request.POST.get("tiempo_ms") or "30000")
    except ValueError:
        tiempo_ms = 30000

    try:
        materias_list = json.loads(raw_mat)
        profes_list = json.loads(raw_prof)
    except json.JSONDecodeError:
        messages.error(request, "JSON inválido.")
        return redirect("skedopt:index")

    # =========================================
    # Guardar materias/profesores en BD (misma lógica de área que la UI / optimizador)
    # =========================================
    try:
        for prof in profes_list:
            nombre = (prof.get("nombre") or "").strip()
            if not nombre:
                continue
            if Profesor.objects.filter(nombre_completo=nombre).exists():
                continue
            Profesor.objects.create(nombre_completo=nombre, activo=1)

        for mat in materias_list:
            nombre = (mat.get("nombre") or "").strip()
            if not nombre:
                continue
            codigo = mat.get("codigo")
            if not codigo:
                codigo = f"MAT_{abs(hash(nombre)) % 10000}"
            area_nombre = nombre_area_desde_categoria_ui(mat.get("categoria"))
            area_obj, _ = Area.objects.get_or_create(nombre=area_nombre)
            if Materia.objects.filter(codigo=codigo).exists():
                continue
            Materia.objects.create(codigo=codigo, nombre=nombre, area=area_obj)

    except Exception as e:
        messages.error(request, f"Error guardando en BD: {e}")
        return redirect("skedopt:index")

    # =========================================
    # 🔧 EJECUTAR MODELO
    # =========================================
    cfg = DEFAULT_CONFIG.copy()
    cfg["max_time_seconds"] = max(1, tiempo_ms // 1000)

    out_dir = str(settings.HORARIOS_OUTPUT_DIR)

    try:
        data = build_data_from_ui(cfg, materias_list, profes_list)
    except ValueError as e:
        messages.error(request, str(e))
        return redirect("skedopt:index")

    cfg["num_profes"] = len(data["profesores"])

    try:
        result = run_pipeline(cfg, data=data, output_dir=out_dir)
    except Exception as e:
        messages.error(request, f"Error en modelo: {e}")
        return redirect("skedopt:index")

    status = result.get("status", "")

    # guardar excel
    excel_path = result.get("excel_path")
    if excel_path:
        request.session["last_excel_basename"] = Path(excel_path).name

    # guardar tabla
    if status in ("OPTIMAL", "FEASIBLE"):
        tabla = construir_tabla_horario(
            result.get("df_asig"), cfg["bloques_por_dia"]
        )
        if tabla:
            request.session["horario_tabla"] = tabla

    # 🔥 REDIRECCIÓN FINAL
    return redirect("/horario/")


# =========================================
# 📥 DESCARGAR EXCEL
# =========================================
def download_last(request):
    basename = request.session.get("last_excel_basename")

    if not basename:
        raise Http404("No hay archivo reciente.")

    folder = Path(settings.HORARIOS_OUTPUT_DIR).resolve()
    path = (folder / basename).resolve()

    if not path.is_file():
        raise Http404("Archivo no encontrado.")

    try:
        path.relative_to(folder)
    except ValueError:
        raise Http404("Ruta no válida.")

    return FileResponse(path.open("rb"), as_attachment=True, filename=basename)