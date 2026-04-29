# Horarios Universidad

Estructura profesional del generador de horarios, separada por capas y sin Django.

## Estructura

- `src/scheduler/config`: configuracion
- `src/scheduler/application`: casos de uso y ensamblaje de datos
- `src/scheduler/infrastructure`: OR-Tools y exportadores
- `src/scheduler/interfaces`: entrada CLI (sin interfaz grafica)

## Requisitos

- Python 3.10+
- (Opcional) Node.js 18+ para el frontend (`frontend/`)

## Instalación (Windows / PowerShell)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -U pip
pip install -r requirements.txt
pip install -e .
```

## Variables de entorno (API / Base de datos)

- Crea tu archivo `.env` desde el ejemplo:

```powershell
Copy-Item .env.example .env
```

- La API soporta configurar la conexión con:
  - `DATABASE_URL` (recomendado), o
  - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSLMODE`

## Ejecutar CLI (motor)

```bash
python -m scheduler.interfaces.cli.main
```

## Ejecutar API (FastAPI)

Desde la raíz del repo (con el entorno virtual activo):

```bash
uvicorn scheduler.interfaces.api.main:app --reload --port 8000
```

- Healthcheck: `GET /health`
- Swagger UI: `GET /docs`

## Ejecutar Frontend (Vue + Vite)

```bash
cd frontend
npm install
npm run dev
```
