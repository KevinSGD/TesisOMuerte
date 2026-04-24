# src/scheduler/interfaces/api/main.py
import os
from fastapi import FastAPI
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

app = FastAPI()

def build_database_url() -> str:
    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    sslmode = os.getenv("DB_SSLMODE", "require")

    if not all([host, name, user, password]):
        return ""

    return f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{name}?sslmode={sslmode}"

DATABASE_URL = os.getenv("DATABASE_URL") or build_database_url()
engine = create_engine(DATABASE_URL, pool_pre_ping=True) if DATABASE_URL else None

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