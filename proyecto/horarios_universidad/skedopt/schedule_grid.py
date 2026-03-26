from collections import defaultdict

DIAS_TABLA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]


def _hora_a_ampm(h: int) -> str:
    h = int(h) % 24
    if h == 0:
        return "12 am"
    if 1 <= h <= 11:
        return f"{h} am"
    if h == 12:
        return "12 pm"
    return f"{h - 12} pm"


def etiqueta_franja(bloque_1based: int, hora_inicio: int = 6) -> str:
    h0 = hora_inicio + bloque_1based - 1
    h1 = h0 + 1
    return f"{_hora_a_ampm(h0)} - {_hora_a_ampm(h1)}"


def construir_tabla_horario(df_asig, bloques_por_dia: int, hora_inicio: int = 6):
    """
    Devuelve dict JSON-friendly: { "dias": [...], "filas": [ { "hora", "dias": { "Lunes": "txt"|"" } } ] }
    Solo se rellenan Lunes–Viernes si el dataframe tiene datos; Sábado queda vacío salvo que exista en df.
    """
    if df_asig is None or getattr(df_asig, "empty", True):
        return None

    celdas = defaultdict(list)
    for _, r in df_asig.iterrows():
        d = str(r["Día"]).strip()
        b = int(r["Bloque"])
        mat = str(r["Materia"]).strip().upper()
        salon = str(r["Salón"]).strip()
        texto = f"{mat}\n({salon})"
        celdas[(d, b)].append(texto)

    filas = []
    for b in range(1, bloques_por_dia + 1):
        por_dia = {}
        for dia in DIAS_TABLA:
            items = celdas.get((dia, b), [])
            if items:
                unicos = []
                for it in items:
                    if it not in unicos:
                        unicos.append(it)
                por_dia[dia] = "\n\n".join(unicos)
            else:
                por_dia[dia] = ""
        filas.append({
            "hora": etiqueta_franja(b, hora_inicio),
            "celdas": [por_dia[d] for d in DIAS_TABLA],
        })

    return {"dias": list(DIAS_TABLA), "filas": filas}
