# Horarios Universidad

Estructura profesional del generador de horarios, separada por capas y sin Django.

## Estructura

- `src/scheduler/config`: configuracion
- `src/scheduler/application`: casos de uso y ensamblaje de datos
- `src/scheduler/infrastructure`: OR-Tools y exportadores
- `src/scheduler/interfaces`: entrada CLI (sin interfaz grafica)

## Ejecutar CLI

```bash
python -m scheduler.interfaces.cli.main
```
