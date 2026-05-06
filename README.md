# TesisOMuerte

Proyecto de horarios universitarios con API en FastAPI y frontend en Vue.

## Arranque rápido

Abre dos terminales PowerShell desde la raíz del repositorio: `C:\Users\kevin\Documents\TesisOMuerte`.

### 1. Instalar y preparar el entorno Python

```powershell
python -m venv .venv
. .venv/Scripts/Activate.ps1
python -m pip install -r proyecto/horarios_universidad/requirements.txt
```

### 2. Configurar variables de entorno de la API

Si usas la base remota:

```powershell
$env:DB_HOST = "db.oxaqiqqkzxktwnbyfavv.supabase.co"
$env:DB_PORT = "5432"
$env:DB_NAME = "postgres"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "<tu_password>"
$env:DB_SSLMODE = "require"
```

Si el motor del horario vive en Railway, define el endpoint que recibe el `POST /run`.

```powershell
$env:RAILWAY_RUN_URL = "https://<tu-servicio>/run"
```

Nota: `tesisomuerte.railway.internal` solo funciona dentro de Railway. Si arrancas la API en tu PC, necesitas una URL pública del servicio de Railway, no la interna.

### 3. Levantar la API

```powershell
.\proyecto\horarios_universidad\start-api.ps1
```

Verificación rápida:

```powershell
c:/Users/kevin/Documents/TesisOMuerte/.venv/Scripts/python.exe -c "import urllib.request;print(urllib.request.urlopen('http://127.0.0.1:8000/health').read().decode())"
```

### 4. Levantar el frontend

En otro terminal:

```powershell
cd proyecto/horarios_universidad/frontend
npm install
npm run dev -- --host 127.0.0.1
```

Abrir en el navegador:

```text
http://127.0.0.1:5173/
```

## Scripts útiles

- `proyecto/horarios_universidad/start-api.ps1`: arranca la API.
- `proyecto/horarios_universidad/start-front.ps1`: arranca el frontend.
- `proyecto/horarios_universidad/README_START.md`: guía detallada paso a paso.

## Endpoints

- `GET /health`: verifica que la API esté viva.
- `GET /db/health`: verifica conexión a base de datos.
- `POST /run`: genera el horario. Si `RAILWAY_RUN_URL` existe, la API delega la ejecución al servicio remoto.
