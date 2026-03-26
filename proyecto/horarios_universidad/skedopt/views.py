import json
from pathlib import Path

from django.conf import settings
from django.contrib import messages
from django.http import FileResponse, Http404
from django.shortcuts import redirect, render
from django.views.decorators.http import require_GET, require_POST

from skedopt.schedule_grid import construir_tabla_horario


def index(request):
    return render(
        request,
        "skedopt/index.html",
        {
            "last_excel_basename": request.session.get("last_excel_basename"),
            "tiene_horario_tabla": bool(request.session.get("horario_tabla")),
        },
    )


@require_GET
def horario_clases(request):
    data = request.session.get("horario_tabla")
    if not data or not data.get("filas"):
        messages.warning(
            request,
            "No hay horario en sesión. Ejecuta primero la optimización desde el inicio.",
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
        messages.error(request, "JSON inválido en materias o profesores.")
        return redirect("skedopt:index")

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
        messages.error(request, f"Error al ejecutar el modelo: {e}")
        return redirect("skedopt:index")

    status = result.get("status", "")
    msg = result.get("message", "")
    text = f"Estado: {status}. {msg}"
    if status in ("OPTIMAL", "FEASIBLE"):
        messages.success(request, text)
    else:
        messages.warning(request, text)

    excel_path = result.get("excel_path")
    if excel_path:
        request.session["last_excel_basename"] = Path(excel_path).name

    if status in ("OPTIMAL", "FEASIBLE"):
        tabla = construir_tabla_horario(
            result.get("df_asig"), cfg["bloques_por_dia"]
        )
        if tabla:
            request.session["horario_tabla"] = tabla

    return redirect("skedopt:index")


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
