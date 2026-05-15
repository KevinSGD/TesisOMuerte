# src/scheduler/interfaces/api/main.py
import json
import os
from pathlib import Path
from typing import Any, List
from urllib.parse import quote_plus

from dotenv import load_dotenv
import requests
from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

PROJECT_ROOT = Path(__file__).resolve().parents[4]
load_dotenv(PROJECT_ROOT / ".env")

from scheduler.application.data_builder import build_data_from_ui
from scheduler.application.services.run_pipeline import run_pipeline
from scheduler.config.settings import DEFAULT_CONFIG
from scheduler.infrastructure.database import create_db_session, get_db, init_db, is_database_configured
from scheduler.infrastructure.models import Materia, Profesor
from scheduler.interfaces.api.schemas import (
    MateriaCreate,
    MateriaResponse,
    ProfesorCreate,
    ProfesorResponse,
    DataSaveRequest,
    VerifyRequest,
)

app = FastAPI()
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    init_db()
except Exception as e:
    print(f"Warning: Could not initialize database: {e}")


def build_database_url() -> str:
    host = (os.getenv("DB_HOST") or "").strip()
    port = (os.getenv("DB_PORT") or "5432").strip()
    name = (os.getenv("DB_NAME") or "").strip()
    user = (os.getenv("DB_USER") or "").strip()
    password = os.getenv("DB_PASSWORD") or ""
    sslmode = (os.getenv("DB_SSLMODE") or "require").strip()

    if not all([host, name, user, password]):
        return ""

    safe_user = quote_plus(user)
    safe_password = quote_plus(password)
    return f"postgresql+psycopg2://{safe_user}:{safe_password}@{host}:{port}/{name}?sslmode={sslmode}"


class RunRequest(BaseModel):
    seed: int = 42
    num_profes: int = DEFAULT_CONFIG["num_profes"]
    num_salones_comunes: int = DEFAULT_CONFIG["num_salones_comunes"]
    num_salones_pc: int = DEFAULT_CONFIG["num_salones_pc"]
    use_ui_data: bool = False
    materias: list[dict[str, Any]] = Field(default_factory=list)
    profesores: list[dict[str, Any]] = Field(default_factory=list)


DATABASE_URL = os.getenv("DATABASE_URL") or build_database_url()
engine = create_engine(DATABASE_URL, pool_pre_ping=True) if DATABASE_URL else None


@api_router.get("/health")
def health():
    return {"ok": True, "service": "scheduler-api"}


@api_router.get("/db/health")
def db_health():
    if not engine:
        return {"ok": False, "db": "not_configured"}
    try:
        with engine.connect() as conn:
            conn.execute(text("select 1"))
        return {"ok": True, "db": "up"}
    except SQLAlchemyError as e:
        return {"ok": False, "db": "down", "detail": str(e)}


@api_router.get("/run")
def run_help():
    return {"ok": False, "detail": "Este endpoint requiere POST con JSON. Usa /docs para probarlo."}


@api_router.post("/run")
def run(payload: RunRequest):
    cfg = DEFAULT_CONFIG.copy()
    cfg.update({
        "seed": payload.seed,
        "num_profes": payload.num_profes,
        "num_salones_comunes": payload.num_salones_comunes,
        "num_salones_pc": payload.num_salones_pc,
    })

    try:
        railway_run_url = (os.getenv("RAILWAY_RUN_URL") or "").strip()
        if railway_run_url:
            payload_json = {
                "seed": payload.seed,
                "num_profes": payload.num_profes,
                "num_salones_comunes": payload.num_salones_comunes,
                "num_salones_pc": payload.num_salones_pc,
                "use_ui_data": payload.use_ui_data,
                "materias": payload.materias,
                "profesores": payload.profesores,
            }
            try:
                resp = requests.post(railway_run_url, json=payload_json, timeout=60)
                resp.raise_for_status()
                try:
                    return resp.json()
                except ValueError:
                    return {"ok": True, "detail": "Delegated run completed, no JSON returned."}
            except requests.RequestException as e:
                raise HTTPException(status_code=502, detail=f"Error delegando a Railway: {e}") from e

        data = None
        if payload.use_ui_data:
            data = build_data_from_ui(cfg, payload.materias, payload.profesores)

        result = run_pipeline(cfg, data=data)
        df_asig = result.pop("df_asig", None)

        response = {"ok": result.get("status") in {"OPTIMAL", "FEASIBLE"}, **result}
        if df_asig is not None:
            response["df_asig_rows"] = int(len(df_asig))
            response["df_asig_preview"] = df_asig.fillna("").to_dict(orient="records")

        return response
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error ejecutando pipeline: {exc}") from exc


# ─── Endpoints de base de datos ───

@api_router.post("/save-data")
def save_data(payload: DataSaveRequest):
    """Guardar materias y profesores en la base de datos"""
    try:
        if not is_database_configured():
            return {"ok": True, "detail": "Base de datos no configurada. Se omite el guardado."}

        db = create_db_session()
        if db is None:
            return {"ok": True, "detail": "Base de datos no configurada. Se omite el guardado."}

        try:
            if payload.clear_existing:
                db.query(Profesor).delete()
                db.query(Materia).delete()
                db.commit()

            id_mapping = {}  # nombre → db_id

            for mat in payload.materias:
                existing = db.query(Materia).filter_by(nombre=mat.nombre).first()
                if existing:
                    id_mapping[mat.nombre] = existing.id
                else:
                    new_materia = Materia(
                        nombre=mat.nombre,
                        creditos=mat.creditos,
                        grupos=mat.grupos,
                        categoria=mat.categoria,
                    )
                    db.add(new_materia)
                    db.flush()
                    id_mapping[mat.nombre] = new_materia.id

            db.commit()

            for prof in payload.profesores:
                existing = db.query(Profesor).filter_by(codigo=prof.codigo).first()
                if existing:
                    continue

                # Resolve materia list: prefer materia_ids, fall back to materia_id
                raw_ids = list(prof.materia_ids) if prof.materia_ids else (
                    [prof.materia_id] if prof.materia_id else []
                )

                first_materia_id = None
                materia_names = []

                for mid in raw_ids:
                    if isinstance(mid, str):
                        db_id = id_mapping.get(mid)
                        if db_id:
                            if first_materia_id is None:
                                first_materia_id = db_id
                            materia_names.append(mid)
                    elif isinstance(mid, int):
                        if first_materia_id is None:
                            first_materia_id = mid
                        mat = db.query(Materia).filter_by(id=mid).first()
                        if mat:
                            materia_names.append(mat.nombre)

                if first_materia_id is None:
                    continue

                new_profesor = Profesor(
                    nombre=prof.nombre,
                    codigo=prof.codigo,
                    materia_id=first_materia_id,
                    materia_ids_json=json.dumps(materia_names, ensure_ascii=False),
                )
                db.add(new_profesor)

            db.commit()
            return {"ok": True, "detail": "Datos guardados exitosamente"}
        finally:
            db.close()
    except Exception as e:
        if 'db' in locals() and db is not None:
            db.rollback()
            db.close()
        raise HTTPException(status_code=400, detail=f"Error guardando datos: {str(e)}") from e


@api_router.get("/materias", response_model=List[MateriaResponse])
def get_materias(db: Session = Depends(get_db)):
    try:
        return db.query(Materia).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error recuperando materias: {str(e)}") from e


@api_router.get("/profesores", response_model=List[ProfesorResponse])
def get_profesores(db: Session = Depends(get_db)):
    try:
        return db.query(Profesor).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error recuperando profesores: {str(e)}") from e


@api_router.delete("/clear-data")
def clear_data(db: Session = Depends(get_db)):
    try:
        db.query(Profesor).delete()
        db.query(Materia).delete()
        db.commit()
        return {"ok": True, "detail": "Datos eliminados exitosamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error eliminando datos: {str(e)}") from e


@api_router.post("/verify")
def verify_schedule(payload: VerifyRequest):
    """Verificar conflictos en el horario: mismo profesor o salón en el mismo bloque."""
    conflicts = []
    dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

    prof_slots: dict = {}
    salon_slots: dict = {}

    for e in payload.eventos:
        day_name = dias[e.dayIndex] if 0 <= e.dayIndex < len(dias) else f"Día {e.dayIndex+1}"
        bloque = e.hourIndex + 1

        # Conflicto de profesor
        if e.profesorId is not None:
            pkey = (str(e.profesorId), e.dayIndex, e.hourIndex)
            if pkey in prof_slots:
                conflicts.append({
                    "type": "profesor",
                    "severity": "error",
                    "message": f"Profesor duplicado — {day_name}, bloque {bloque}",
                    "evento_a": prof_slots[pkey].id,
                    "evento_b": e.id,
                })
            else:
                prof_slots[pkey] = e

        # Conflicto de salón
        salon = (e.salon or "").strip()
        if salon:
            skey = (salon, e.dayIndex, e.hourIndex)
            if skey in salon_slots:
                conflicts.append({
                    "type": "salon",
                    "severity": "error",
                    "message": f"Salón '{salon}' ocupado dos veces — {day_name}, bloque {bloque}",
                    "evento_a": salon_slots[skey].id,
                    "evento_b": e.id,
                })
            else:
                salon_slots[skey] = e

    return {
        "ok": True,
        "conflict_count": len(conflicts),
        "conflicts": conflicts,
    }


app.include_router(api_router)
