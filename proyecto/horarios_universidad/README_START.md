Guía rápida para arrancar el proyecto (API + Front) — pasos exactos

Resumen: Abrir dos terminales (PowerShell). En uno arrancar la API; en otro el frontend.

1) Preparar entorno Python (solo la primera vez)

PowerShell (desde la raíz del repo C:\Users\kevin\Documents\TesisOMuerte):

```
# Crear virtualenv (si no existe)
python -m venv .venv

# Activar
. .venv/Scripts/Activate.ps1

# Instalar dependencias
python -m pip install -r proyecto/horarios_universidad/requirements.txt
```

2) Variables de entorno importantes

- Si usas la base de datos remota (Railway/Supabase), exporta estas variables en el terminal donde arrancarás la API (PowerShell):

```
$env:DB_HOST = "db.oxaqiqqkzxktwnbyfavv.supabase.co"
$env:DB_PORT = "5432"
$env:DB_NAME = "postgres"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "<tu_db_password>"
$env:DB_SSLMODE = "require"
```

- Si quieres delegar la ejecución del algoritmo a un servicio Railway (recomendado según tu setup), añade la URL que Railway te dé (endpoint que ejecuta el pipeline) así:

```
$env:RAILWAY_RUN_URL = "https://<tu-servicio-railway>/run"
```

3) Arrancar la API (nuevo terminal PowerShell)

Desde la raíz del repo:

```
# Ejecuta el script que prepara venv y arranca uvicorn
.\proyecto\horarios_universidad\start-api.ps1
```

Alternativa (comandos explícitos):

```
. .venv/Scripts/Activate.ps1
c:/Users/kevin/Documents/TesisOMuerte/.venv/Scripts/python.exe -m uvicorn scheduler.interfaces.api.main:app --reload --host 127.0.0.1 --port 8000 --app-dir c:/Users/kevin/Documents/TesisOMuerte/proyecto/horarios_universidad/src
```

Comprobar:

```
# En otro terminal o usando curl/Python
python -c "import urllib.request;print(urllib.request.urlopen('http://127.0.0.1:8000/health').read().decode())"
```

4) Arrancar Frontend (otro terminal PowerShell)

```
.\proyecto\horarios_universidad\start-front.ps1
```

Acceder en el navegador: http://127.0.0.1:5173/

5) Conexión front ↔ api

- El frontend por defecto hace peticiones basadas en la configuración en `frontend/src` (si necesitas cambiar el `API_BASE` o `services/api.js`, edítalo para apuntar a `http://127.0.0.1:8000`).

6) Si deseas que el algoritmo se ejecute en Railway y no localmente

- Configura `RAILWAY_RUN_URL` con la URL pública del servicio Railway que ejecuta el pipeline.
- Cuando `RAILWAY_RUN_URL` esté definido, la API `POST /run` delegará la petición a esa URL y devolverá la respuesta del servicio remoto.

Notas finales

- Si actualizas `requirements.txt`, vuelve a ejecutar `python -m pip install -r proyecto/horarios_universidad/requirements.txt`.
- Los scripts `start-api.ps1` y `start-front.ps1` son para usarse en terminales separados; así quedará más ordenado.

Si quieres, puedo:
- Añadir un `Makefile` o `psake` para aún más automatización.
- Actualizar el frontend para forzar `API_BASE` desde una `env` o `.env` en `frontend`.
- Añadir validaciones para comprobar que `RAILWAY_RUN_URL` está resolviendo correctamente antes de aceptar UI requests.
