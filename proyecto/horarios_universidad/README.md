# Horarios Universidad

Generador de horarios académicos con backend en FastAPI y frontend en Vue 3.

## Estructura

- `src/scheduler/config`: configuración
- `src/scheduler/application`: casos de uso y ensamblaje de datos
- `src/scheduler/infrastructure`: OR-Tools y exportadores
- `src/scheduler/interfaces`: API y CLI
- `frontend/`: aplicación Vue + Vite

## Requisitos

- Python 3.10+
- Node.js 18+
- npm

## Instalación (Windows / PowerShell)

Desde `proyecto/horarios_universidad`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -U pip
pip install -r requirements.txt
pip install -e .
```

Luego instala dependencias del frontend:

```powershell
cd frontend
npm install
cd ..
```

## Ejecutar backend

Desde `proyecto/horarios_universidad` en un terminal PowerShell:

```powershell
.\start-api.ps1
```

Esto inicia FastAPI en:

- `http://127.0.0.1:8000`
- Swagger UI: `http://127.0.0.1:8000/docs`
- Healthcheck: `http://127.0.0.1:8000/health`

Si usas base de datos, define las variables de entorno en el mismo terminal antes de ejecutar el script:

```powershell
$env:DB_HOST = "..."
$env:DB_PORT = "5432"
$env:DB_NAME = "postgres"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "..."
$env:DB_SSLMODE = "require"
```

## Ejecutar frontend

Desde `proyecto/horarios_universidad` en otro terminal PowerShell:

```powershell
.\start-front.ps1
```

Esto inicia Vite y abre la interfaz en un puerto local, normalmente:

- `http://127.0.0.1:5173` (o el siguiente puerto libre)

## Flujo de uso

1. Inicia el backend con `start-api.ps1`.
2. Inicia el frontend con `start-front.ps1`.
3. Abre la URL local que indique Vite y usa la aplicación.

## Notas

- El frontend se comunica con el backend a través del proxy de Vite.
- No es necesario un archivo `.env.example` para ejecutar el proyecto.
