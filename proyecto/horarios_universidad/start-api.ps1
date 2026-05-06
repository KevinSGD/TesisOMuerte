# Ejecuta la API en un terminal (PowerShell)
# Usar desde la raíz del repo: .\proyecto\horarios_universidad\start-api.ps1

# Activa venv (ajusta si tu venv está en otra ruta)
$venv = "c:/Users/kevin/Documents/TesisOMuerte/.venv/Scripts/Activate.ps1"
if (Test-Path $venv) { . $venv }

# Opcional: configurar variables de entorno necesarias (ejemplo con Railway DB)
# $env:DB_HOST = "..."
# $env:DB_PORT = "5432"
# $env:DB_NAME = "postgres"
# $env:DB_USER = "postgres"
# $env:DB_PASSWORD = "secret"
# $env:DB_SSLMODE = "require"
# Si tienes un endpoint remoto en Railway que ejecuta el algoritmo, define:
# $env:RAILWAY_RUN_URL = "https://your-railway-service/run"

# Ejecutar uvicorn (app-dir apunta a src)
c:/Users/kevin/Documents/TesisOMuerte/.venv/Scripts/python.exe -m uvicorn scheduler.interfaces.api.main:app --reload --host 127.0.0.1 --port 8000 --app-dir c:/Users/kevin/Documents/TesisOMuerte/proyecto/horarios_universidad/src
