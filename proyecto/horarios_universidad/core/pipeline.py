from ortools.sat.python import cp_model
from core.data_builder import build_data
from core.solver_runner import solve
from core.extractor import extract
from core.excel_exporter import export_excel

def run_pipeline(cfg):
    data = build_data(cfg)
    sol = solve(cfg, data)

    status_txt = {
        cp_model.OPTIMAL: "OPTIMAL",
        cp_model.FEASIBLE: "FEASIBLE",
        cp_model.INFEASIBLE: "INFEASIBLE",
        cp_model.MODEL_INVALID: "MODEL_INVALID",
        cp_model.UNKNOWN: "UNKNOWN",
    }.get(sol["status"], str(sol["status"]))

    if sol["status"] not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {
            "status": status_txt,
            "message": "No se encontró solución factible.",
            "excel_path": None,
            "df_asig": None
        }

    df_asig, df_cal, df_uso = extract(sol, cfg)
    excel_path = export_excel(df_asig, df_cal, df_uso, sol, data)

    return {
        "status": status_txt,
        "message": "Horario generado correctamente.",
        "excel_path": excel_path,
        "df_asig": df_asig
    }