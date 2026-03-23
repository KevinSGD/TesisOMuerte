import random

def norm(txt: str) -> str:
    return (
        txt.lower()
        .replace("á", "a")
        .replace("é", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ú", "u")
        .strip()
    )

def build_data(cfg):
    random.seed(cfg["seed"])

    # Catálogo base (puedes ampliar)
    asignaturas = [
        ("Lógica de Programación", 3, "Desarrollo de Software"),
        ("Programación Orientada a Objetos", 3, "Desarrollo de Software"),
        ("Estructura de Datos", 3, "Desarrollo de Software"),
        ("Taller de Programación", 2, "Desarrollo de Software"),
        ("Ingeniería Web I", 3, "Desarrollo de Software"),
        ("Ingeniería Web II", 3, "Desarrollo de Software"),
        ("Computación Móvil", 3, "Desarrollo de Software"),
        ("Desarrollo de Software Seguro", 3, "Desarrollo de Software"),
        ("Procesos de Software", 2, "Desarrollo de Software"),
        ("Ingeniería de Requisitos de Software", 2, "Desarrollo de Software"),
        ("Análisis y Diseño del Software", 4, "Desarrollo de Software"),
        ("Patrones y Metodologías de la Construcción del Software", 3, "Desarrollo de Software"),
        ("Arquitectura del Software", 4, "Desarrollo de Software"),
        ("Estándares y Métricas de Calidad del Software", 3, "Desarrollo de Software"),
        ("Pruebas de Software", 3, "Desarrollo de Software"),
        ("Gerencia de Proyectos de Software", 3, "Desarrollo de Software"),
        ("Orientación a la Ingeniería", 1, "Desarrollo de Software"),

        ("Arquitectura de Hardware", 3, "Infraestructura TI"),
        ("Infraestructura Tecnológica I", 3, "Infraestructura TI"),
        ("Infraestructura Tecnológica II", 3, "Infraestructura TI"),
        ("Sistemas Operativos", 3, "Infraestructura TI"),
        ("Sistemas Distribuidos", 3, "Infraestructura TI"),

        ("Gestión de Bases de Datos", 4, "Ciencia de Datos"),
        ("Inteligencia de Negocios", 3, "Ciencia de Datos"),
        ("Sistemas Transaccionales", 4, "Ciencia de Datos"),

        ("Comunicación Oral y Escrita", 2, "Humanidades"),
        ("Cátedra Manuela Beltrán", 1, "Humanidades"),
        ("Filosofía", 2, "Humanidades"),
        ("Ética", 2, "Humanidades"),

        ("Matemáticas Básicas", 3, "Ciencias Básicas"),
        ("Cálculo Diferencial", 3, "Ciencias Básicas"),
        ("Cálculo Integral", 3, "Ciencias Básicas"),
        ("Física Mecánica", 3, "Ciencias Básicas"),
        ("Física Electromagnética", 3, "Ciencias Básicas"),

        ("Proyecto de Investigación I", 2, "Investigación"),
        ("Proyecto de Investigación II", 2, "Investigación"),
        ("Proyecto de Investigación III", 2, "Investigación"),
        ("Proyecto de Investigación IV", 2, "Investigación"),
        ("Contabilidad General", 2, "Investigación"),
        ("Práctica Empresarial", 3, "Investigación"),

        ("Inglés Inicial", 1, "Idiomas"),
        ("Inglés Básico I", 1, "Idiomas"),
        ("Inglés Básico II", 1, "Idiomas"),
        ("Inglés Preintermedio", 1, "Idiomas"),
        ("Inglés Intermedio", 1, "Idiomas"),
        ("Inglés Intermedio Alto", 1, "Idiomas"),
        ("Inglés Avanzado", 1, "Idiomas"),
        ("Electiva I", 2, "Electivas"),
        ("Electiva II", 2, "Electivas"),
        ("Electiva III", 2, "Electivas"),
    ]

    materias = [a[0] for a in asignaturas]
    creditos = [a[1] for a in asignaturas]
    areas = [a[2] for a in asignaturas]
    num_cursos = len(asignaturas)

    # Clasificación tipo materia
    virtuales = {
        "ingles inicial", "ingles basico i", "ingles basico ii", "ingles preintermedio",
        "ingles intermedio", "ingles intermedio alto", "ingles avanzado",
        "contabilidad general", "proyecto de investigacion ii", "proyecto de investigacion iii",
        "proyecto de investigacion iv", "practica empresarial", "electiva i", "electiva ii", "electiva iii"
    }

    humanidades_comun = {
        "comunicacion oral y escrita", "catedra manuela beltran", "etica", "filosofia"
    }

    tipo_materia = {}
    for c, nom in enumerate(materias):
        nn = norm(nom)
        area_n = norm(areas[c])

        if nn in virtuales:
            tipo_materia[c] = "virtual"
        elif nn == "proyecto de investigacion i":
            tipo_materia[c] = "presencial_comun"
        elif nn in humanidades_comun:
            tipo_materia[c] = "presencial_comun"
        elif area_n == "ciencias basicas":
            tipo_materia[c] = "presencial_comun"
        else:
            tipo_materia[c] = "presencial_pc"

    cursos_activos = [c for c in range(num_cursos) if tipo_materia[c] != "virtual"]

    # Profesores
    profesores = [f"Prof_{i+1:02d}" for i in range(cfg["num_profes"])]

    # Salones
    num_salones = cfg["num_salones_comunes"] + cfg["num_salones_pc"]
    salones = [f"Salon_{i+1:02d}" for i in range(num_salones)]

    tipo_salon = {}
    capacidad_salon = {}
    for s in range(num_salones):
        if s < cfg["num_salones_comunes"]:
            tipo_salon[s] = "comun"
        else:
            tipo_salon[s] = "pc"
        capacidad_salon[s] = 25

    return {
        "asignaturas": asignaturas,
        "materias": materias,
        "creditos": creditos,
        "areas": areas,
        "num_cursos": num_cursos,
        "tipo_materia": tipo_materia,
        "cursos_activos": cursos_activos,
        "profesores": profesores,          # <-- clave que faltaba
        "salones": salones,                # <-- clave que usa model_builder
        "tipo_salon": tipo_salon,          # <-- clave que usa model_builder
        "capacidad_salon": capacidad_salon,# <-- clave que usa model_builder
        "num_salones": num_salones,        # <-- clave que usa model_builder
    }