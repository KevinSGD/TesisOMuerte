# src/scheduler/interfaces/api/main.py
import os
from pathlib import Path
from typing import Any
from urllib.parse import quote_plus

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from scheduler.application.data_builder import build_data_from_ui
from scheduler.application.services.run_pipeline import run_pipeline
from scheduler.config.settings import DEFAULT_CONFIG

PROJECT_ROOT = Path(__file__).resolve().parents[4]
load_dotenv(PROJECT_ROOT / ".env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


@app.get("/health")
def health():
    return {"ok": True, "service": "scheduler-api"}


@app.get("/db/health")
def db_health():
    if not engine:
        return {"ok": False, "db": "not_configured"}
    try:
        with engine.connect() as conn:
            conn.execute(text("select 1"))
        return {"ok": True, "db": "up"}
    except SQLAlchemyError as e:
        return {"ok": False, "db": "down", "detail": str(e)}


@app.get("/run")
def run_help():
    return {
        "ok": False,
        "detail": "Este endpoint requiere POST con JSON. Usa /docs para probarlo.",
    }


@app.post("/run")
def run(payload: RunRequest):
    cfg = DEFAULT_CONFIG.copy()
    cfg.update(
        {
            "seed": payload.seed,
            "num_profes": payload.num_profes,
            "num_salones_comunes": payload.num_salones_comunes,
            "num_salones_pc": payload.num_salones_pc,
        }
    )

    try:
        data = None
        if payload.use_ui_data:
            data = build_data_from_ui(cfg, payload.materias, payload.profesores)

        result = run_pipeline(cfg, data=data)
        df_asig = result.pop("df_asig", None)

        response = {
            "ok": result.get("status") in {"OPTIMAL", "FEASIBLE"},
            **result,
        }
        if df_asig is not None:
            response["df_asig_rows"] = int(len(df_asig))
            response["df_asig_preview"] = df_asig.head(20).fillna("").to_dict(orient="records")

        return response
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error ejecutando pipeline: {exc}") from exc