# Ejecuta la API en un terminal (PowerShell)
# Usar desde la raíz del repo: .\proyecto\horarios_universidad\start-api.ps1

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$venvActivate = Join-Path $scriptDir ".venv\Scripts\Activate.ps1"
$pythonExe = "python"
if (Test-Path $venvActivate) {
    . $venvActivate
    $pythonExe = Join-Path $scriptDir ".venv\Scripts\python.exe"
}

# Opcional: configurar variables de entorno necesarias (ejemplo con Railway DB)
# $env:DB_HOST = "..."
# $env:DB_PORT = "5432"
# $env:DB_NAME = "postgres"
# $env:DB_USER = "postgres"
# $env:DB_PASSWORD = "secret"
# $env:DB_SSLMODE = "require"
# Si tienes un endpoint remoto en Railway que ejecuta el algoritmo, define:
# $env:RAILWAY_RUN_URL = "https://your-railway-service/run"

& $pythonExe -m uvicorn scheduler.interfaces.api.main:app --reload --host 127.0.0.1 --port 8000 --app-dir "$scriptDir\src"
