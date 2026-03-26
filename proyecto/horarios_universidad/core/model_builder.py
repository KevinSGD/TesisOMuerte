import random
from collections import defaultdict
from ortools.sat.python import cp_model


def build_model(cfg, data):
    random.seed(cfg["seed"])
    model = cp_model.CpModel()

    # =========================
    # Parámetros base
    # =========================
    NUM_PROFES = cfg["num_profes"]
    NUM_DIAS = cfg["num_dias"]
    BLOQUES_POR_DIA = cfg["bloques_por_dia"]
    NUM_BLOQUES = NUM_DIAS * BLOQUES_POR_DIA
    MAX_CLASES_PROFE_DIA = cfg["max_clases_profe_dia"]
    MAX_CLASES_PROFE_SEMANA = cfg["max_clases_profe_semana"]

    materias = data["materias"]
    creditos = data["creditos"]
    areas = data["areas"]
    cursos_activos = data["cursos_activos"]
    tipo_materia = data["tipo_materia"]

    profesores = data["profesores"]
    salones = data["salones"]
    tipo_salon = data["tipo_salon"]
    capacidad_salon = data["capacidad_salon"]
    NUM_SALONES = data["num_salones"]

    NUM_CURSOS = data["num_cursos"]

    # =========================
    # Helpers
    # =========================
    def day_hour_to_b(d, h):
        return d * BLOQUES_POR_DIA + h

    def nrm(t):
        return (
            t.lower()
            .replace("á", "a")
            .replace("é", "e")
            .replace("í", "i")
            .replace("ó", "o")
            .replace("ú", "u")
            .strip()
        )

    # =========================
    # N2: Grupos por asignatura
    # - Modo UI: grupos definidos en data["Gc_override"]
    # - Modo automático: 10 disciplinares aleatorias con 3 grupos; resto con 1 o 2
    # =========================
    G = []
    Gc = [0] * NUM_CURSOS
    cursos_con_3 = set()

    if data.get("Gc_override") is not None:
        gcv = data["Gc_override"]
        for c in cursos_activos:
            gnum = int(gcv[c])
            if gnum < 1:
                raise ValueError(f"Curso {c}: número de grupos debe ser ≥ 1.")
            Gc[c] = gnum
            if gnum >= 3:
                cursos_con_3.add(c)
            for gi in range(gnum):
                G.append((c, gi))
    else:
        AREAS_DISCIPLINARES = {
            "desarrollo de software",
            "ciencia de datos",
            "infraestructura ti",
            "disciplinar",
            "disciplinares",
        }

        disciplinares = [c for c in cursos_activos if nrm(areas[c]) in AREAS_DISCIPLINARES]
        n_3 = min(10, len(disciplinares))
        cursos_con_3 = set(random.sample(disciplinares, n_3)) if n_3 > 0 else set()

        for c in cursos_activos:
            if c in cursos_con_3:
                gnum = 3
            else:
                gnum = random.choice([1, 2])
            Gc[c] = gnum
            for gi in range(gnum):
                G.append((c, gi))

    NUM_GRUPOS = len(G)

    # =========================
    # Elegibilidad profesor-curso
    # - Modo UI: data["candidatos_override"][c] = set de índices de profesor
    # - Modo automático: subconjunto aleatorio K por curso
    # =========================
    candidatos_por_curso = {}

    if data.get("candidatos_override") is not None:
        ovr = data["candidatos_override"]
        for c in cursos_activos:
            raw = ovr.get(c, set())
            s = set(raw) if not isinstance(raw, set) else set(raw)
            if not s:
                raise ValueError(f"Curso {c} sin profesores elegibles.")
            candidatos_por_curso[c] = s
    else:
        K = cfg["k_candidatos"]
        for c in cursos_activos:
            candidatos_por_curso[c] = set(random.sample(range(NUM_PROFES), min(K, NUM_PROFES)))

        aparece = {p: 0 for p in range(NUM_PROFES)}
        for c in cursos_activos:
            for p in candidatos_por_curso[c]:
                aparece[p] += 1
        faltantes = [p for p, cnt in aparece.items() if cnt == 0]
        for p in faltantes:
            c = random.choice(cursos_activos)
            candidatos_por_curso[c].add(p)

    # =========================
    # Restricción INFRA
    # - Profesor infra exclusivo para materias infra I/II
    # - Salón infra especial (primer pc) reservado para infra
    # =========================
    # detecta materias de infraestructura (las 2 primeras si hay >=2)
    idx_infra = [i for i, m in enumerate(materias) if "infraestructura" in nrm(m)]
    C_INFRA = set(idx_infra[:2]) if len(idx_infra) >= 2 else set(idx_infra)

    # profesor infra (índice 0 = Prof_01)
    p_infra = 0

    # salón infra especial = primer salón pc
    salones_pc = [s for s in range(NUM_SALONES) if tipo_salon[s] == "pc"]
    s_infra = salones_pc[0] if salones_pc else None

    # exclusividad profesor infra
    if C_INFRA:
        # fuera de infraestructura, p_infra no dicta
        for c in cursos_activos:
            if c not in C_INFRA and p_infra in candidatos_por_curso[c]:
                candidatos_por_curso[c].remove(p_infra)
                if len(candidatos_por_curso[c]) == 0:
                    candidatos_por_curso[c].add(random.randrange(NUM_PROFES))

        # en infraestructura, p_infra debe estar elegible
        for c in C_INFRA:
            if c in cursos_activos:
                candidatos_por_curso[c].add(p_infra)

    # reconstruir preferencias con candidatos finales (IMPORTANTE)
    pref = {
        (p, c): random.randint(0, 10)
        for c in cursos_activos
        for p in candidatos_por_curso[c]
    }

    # =========================
    # Capacidad y salones permitidos por grupo
    # =========================
    estudiantes_grupo = {(c, gi): random.randint(20, 25) for (c, gi) in G}

    salones_permitidos_grupo = {}
    podas = 0
    total_checks = 0

    for (c, gi) in G:
        permitidos = []
        tm = tipo_materia[c]

        for s in range(NUM_SALONES):
            total_checks += 1
            ts = tipo_salon[s]

            # tipo de salón
            if tm == "presencial_comun" and ts != "comun":
                podas += 1
                continue
            if tm == "presencial_pc" and ts != "pc":
                podas += 1
                continue

            # capacidad
            if estudiantes_grupo[(c, gi)] > capacidad_salon[s]:
                podas += 1
                continue

            permitidos.append(s)

        # regla salón infra
        if s_infra is not None:
            if c in C_INFRA:
                if (
                    s_infra not in permitidos
                    and tipo_salon[s_infra] == "pc"
                    and estudiantes_grupo[(c, gi)] <= capacidad_salon[s_infra]
                ):
                    permitidos.append(s_infra)
            else:
                permitidos = [s for s in permitidos if s != s_infra]

        if not permitidos:
            raise ValueError(
                f"Sin salón factible para {materias[c]}-G{gi+1} "
                f"(tipo={tm}, est={estudiantes_grupo[(c, gi)]})"
            )

        salones_permitidos_grupo[(c, gi)] = permitidos

    # =========================
    # Variables
    # =========================
    y = {}      # profesor por grupo
    z = {}      # patrón de 3 créditos
    start = {}  # inicios de sesión
    x = {}      # ocupación por bloque

    for (c, gi) in G:
        for p in candidatos_por_curso[c]:
            y[(p, c, gi)] = model.NewBoolVar(f"y_p{p}_c{c}_g{gi}")

    for (c, gi) in G:
        if creditos[c] == 3:
            z[(c, gi)] = model.NewBoolVar(f"z_c{c}_g{gi}")

    inicios_por_L = {
        1: list(range(BLOQUES_POR_DIA)),
        2: list(range(BLOQUES_POR_DIA - 1)),
        3: list(range(BLOQUES_POR_DIA - 2)),
    }

    def create_start_vars(L, c, gi, tag):
        for p in candidatos_por_curso[c]:
            for d in range(NUM_DIAS):
                for h in inicios_por_L[L]:
                    for s in salones_permitidos_grupo[(c, gi)]:
                        start[(L, tag, p, c, gi, d, h, s)] = model.NewBoolVar(
                            f"st_L{L}_t{tag}_p{p}_c{c}_g{gi}_d{d}_h{h}_s{s}"
                        )

    for (c, gi) in G:
        cr = creditos[c]
        if cr == 4:
            create_start_vars(2, c, gi, 1)
            create_start_vars(2, c, gi, 2)
        elif cr == 3:
            create_start_vars(3, c, gi, 1)
            create_start_vars(2, c, gi, 1)
            create_start_vars(1, c, gi, 2)
        elif cr == 2:
            create_start_vars(2, c, gi, 1)
        else:
            create_start_vars(1, c, gi, 1)

    # =========================
    # Restricciones
    # =========================
    # (R1) un profesor por grupo
    for (c, gi) in G:
        model.Add(sum(y[(p, c, gi)] for p in candidatos_por_curso[c]) == 1)

    # Forzar profesor infra en cursos de infraestructura
    if C_INFRA:
        for c in C_INFRA:
            if c in cursos_activos:
                for gi in range(Gc[c]):
                    if (p_infra, c, gi) in y:
                        model.Add(y[(p_infra, c, gi)] == 1)

    def sum_starts(L, c, gi, tag):
        terms = []
        for p in candidatos_por_curso[c]:
            for d in range(NUM_DIAS):
                for h in inicios_por_L[L]:
                    for s in salones_permitidos_grupo[(c, gi)]:
                        key = (L, tag, p, c, gi, d, h, s)
                        if key in start:
                            terms.append(start[key])
        return sum(terms) if terms else 0

    day_sel = {}

    def build_day_sel(L, c, gi, tag):
        for d in range(NUM_DIAS):
            v = model.NewBoolVar(f"daySel_L{L}_t{tag}_c{c}_g{gi}_d{d}")
            day_sel[(L, tag, c, gi, d)] = v

            terms = []
            for p in candidatos_por_curso[c]:
                for h in inicios_por_L[L]:
                    for s in salones_permitidos_grupo[(c, gi)]:
                        key = (L, tag, p, c, gi, d, h, s)
                        if key in start:
                            terms.append(start[key])

            model.Add(v == (sum(terms) if terms else 0))

    # (R2) estructura por créditos + separación de días cuando aplica
    for (c, gi) in G:
        cr = creditos[c]

        if cr == 4:
            model.Add(sum_starts(2, c, gi, 1) == 1)
            model.Add(sum_starts(2, c, gi, 2) == 1)
            build_day_sel(2, c, gi, 1)
            build_day_sel(2, c, gi, 2)
            for d in range(NUM_DIAS):
                model.Add(day_sel[(2, 1, c, gi, d)] + day_sel[(2, 2, c, gi, d)] <= 1)

        elif cr == 3:
            zcg = z[(c, gi)]
            model.Add(sum_starts(3, c, gi, 1) == zcg)
            model.Add(sum_starts(2, c, gi, 1) == 1 - zcg)
            model.Add(sum_starts(1, c, gi, 2) == 1 - zcg)
            build_day_sel(2, c, gi, 1)
            build_day_sel(1, c, gi, 2)
            for d in range(NUM_DIAS):
                model.Add(day_sel[(2, 1, c, gi, d)] + day_sel[(1, 2, c, gi, d)] <= 1 + zcg)

        elif cr == 2:
            model.Add(sum_starts(2, c, gi, 1) == 1)
            build_day_sel(2, c, gi, 1)

        else:
            model.Add(sum_starts(1, c, gi, 1) == 1)
            build_day_sel(1, c, gi, 1)

    # (R3) consistencia profesor en todas las sesiones del grupo
    starts_by_pcg = defaultdict(list)
    for key, st in start.items():
        L, tag, p, c, gi, d, h, s = key
        starts_by_pcg[(p, c, gi)].append(st)

    for (c, gi) in G:
        cr = creditos[c]
        for p in candidatos_por_curso[c]:
            ypcg = y[(p, c, gi)]
            ts = sum(starts_by_pcg[(p, c, gi)]) if starts_by_pcg[(p, c, gi)] else 0

            if cr == 4:
                model.Add(ts == 2 * ypcg)
            elif cr in (1, 2):
                model.Add(ts == ypcg)
            else:
                zcg = z[(c, gi)]
                w = model.NewBoolVar(f"w_p{p}_c{c}_g{gi}")
                model.Add(w <= ypcg)
                model.Add(w <= zcg)
                model.Add(w >= ypcg + zcg - 1)
                model.Add(ts == 2 * ypcg - w)

    # (R4) construir x por cobertura de starts
    cover = defaultdict(list)
    for (L, tag, p, c, gi, d, h0, s), st in start.items():
        for off in range(L):
            b = day_hour_to_b(d, h0 + off)
            cover[(p, c, gi, b, s)].append(st)

    for key, lst in cover.items():
        p, c, gi, b, s = key
        x[key] = model.NewBoolVar(f"x_p{p}_c{c}_g{gi}_b{b}_s{s}")
        model.Add(sum(lst) == x[key])

    # Índices auxiliares
    x_by_prof_block = defaultdict(list)
    x_by_prof_course_block = defaultdict(list)
    x_by_room_block = defaultdict(list)
    x_by_prof_day = defaultdict(list)
    x_by_prof = defaultdict(list)
    x_by_room = defaultdict(list)

    for (p, c, gi, b, s), xv in x.items():
        x_by_prof_block[(p, b)].append(xv)
        x_by_prof_course_block[(p, c, b)].append(xv)
        x_by_room_block[(s, b)].append(xv)
        x_by_prof_day[(p, b // BLOQUES_POR_DIA)].append(xv)
        x_by_prof[p].append(xv)
        x_by_room[s].append(xv)

    # (R5) no solape profesor
    for p in range(NUM_PROFES):
        for b in range(NUM_BLOQUES):
            lst = x_by_prof_block.get((p, b), [])
            if lst:
                model.Add(sum(lst) <= 1)

    # N1 explícita (redundante pero pedida): no mismo profesor+curso simultáneo
    for p in range(NUM_PROFES):
        for c in cursos_activos:
            for b in range(NUM_BLOQUES):
                lst = x_by_prof_course_block.get((p, c, b), [])
                if lst:
                    model.Add(sum(lst) <= 1)

    # (R6) no solape salón
    for s in range(NUM_SALONES):
        for b in range(NUM_BLOQUES):
            lst = x_by_room_block.get((s, b), [])
            if lst:
                model.Add(sum(lst) <= 1)

    # (R7) carga máxima profesor diaria/semanal
    for p in range(NUM_PROFES):
        for d in range(NUM_DIAS):
            lst = x_by_prof_day.get((p, d), [])
            if lst:
                model.Add(sum(lst) <= MAX_CLASES_PROFE_DIA)

    for p in range(NUM_PROFES):
        lst = x_by_prof.get(p, [])
        model.Add((sum(lst) if lst else 0) <= MAX_CLASES_PROFE_SEMANA)

    # =========================
    # Objetivo
    # =========================
    total_expr = sum(x.values()) if x else 0

    carga_p = {}
    for p in range(NUM_PROFES):
        carga_p[p] = model.NewIntVar(0, NUM_BLOQUES, f"cargaP_{p}")
        model.Add(carga_p[p] == (sum(x_by_prof[p]) if x_by_prof[p] else 0))

    max_carga_p = model.NewIntVar(0, NUM_BLOQUES, "max_carga_p")
    min_carga_p = model.NewIntVar(0, NUM_BLOQUES, "min_carga_p")
    for p in range(NUM_PROFES):
        model.Add(carga_p[p] <= max_carga_p)
        model.Add(carga_p[p] >= min_carga_p)

    target = model.NewIntVar(0, NUM_BLOQUES, "target")
    model.AddDivisionEquality(target, total_expr, NUM_PROFES)

    dev = []
    for p in range(NUM_PROFES):
        dvar = model.NewIntVar(0, NUM_BLOQUES, f"devP_{p}")
        model.Add(carga_p[p] - target <= dvar)
        model.Add(target - carga_p[p] <= dvar)
        dev.append(dvar)

    # IMPORTANTE: .get() evita KeyError si algo cambia en candidatos
    pref_expr = sum(pref.get((p, c), 0) * yv for (p, c, gi), yv in y.items()) if y else 0

    model.Minimize(
        200 * (max_carga_p - min_carga_p)
        + 20 * sum(dev)
        - 1 * pref_expr
    )

    meta = {
        "G": G,
        "Gc": Gc,
        "y": y,
        "x": x,
        "z": z,
        "materias": materias,
        "areas": areas,
        "creditos": creditos,
        "tipo_materia": tipo_materia,
        "cursos_activos": cursos_activos,
        "profesores": profesores,
        "salones": salones,
        "tipo_salon": tipo_salon,
        "capacidad_salon": capacidad_salon,
        "estudiantes_grupo": estudiantes_grupo,
        "num_bloques": NUM_BLOQUES,
        "bloques_por_dia": BLOQUES_POR_DIA,
        "num_grupos": NUM_GRUPOS,
        "cursos_con_3": sorted(list(cursos_con_3)),
        "C_INFRA": sorted(list(C_INFRA)),
        "p_infra": p_infra,
        "s_infra": s_infra,
        "podas": podas,
        "total_checks": total_checks,
    }

    return model, meta