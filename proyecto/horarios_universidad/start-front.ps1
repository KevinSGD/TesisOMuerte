# Ejecuta el frontend Vite en un terminal (PowerShell)
# Usar desde la raíz del repo: .\proyecto\horarios_universidad\start-front.ps1

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir
cd .\frontend
npm run dev -- --host 127.0.0.1
