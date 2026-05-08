# Ejecuta la API en un terminal (PowerShell)
# Usar desde la raíz del repo: .\proyecto\horarios_universidad\start-api.ps1

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$venvPython = Join-Path $scriptDir ".venv\Scripts\python.exe"
$pythonExe = $null
if (Test-Path $venvPython) {
    $pythonExe = $venvPython
} else {
    $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonCmd) {
        $pythonExe = "python"
    } elseif (Get-Command py -ErrorAction SilentlyContinue) {
        $pythonExe = "py"
    } else {
        Write-Error "No se encontro Python. Instala Python o activa un entorno virtual en .venv."
        exit 1
    }
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
