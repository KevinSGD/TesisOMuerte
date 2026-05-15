-- ============================================================================
-- Railway PostgreSQL schema for Horarios Universidad (TesisOMuerte)
-- ============================================================================
-- This script is idempotent and can be executed multiple times.
-- Core app tables used today: materias, profesores.
-- Extra tables included for end-to-end Railway efficiency tests:
--   - profesor_materias
--   - ejecuciones_algoritmo
--   - horario_eventos
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS materias (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    creditos INTEGER NOT NULL DEFAULT 1 CHECK (creditos BETWEEN 1 AND 4),
    grupos INTEGER NOT NULL DEFAULT 1 CHECK (grupos >= 1),
    categoria TEXT NOT NULL CHECK (length(btrim(categoria)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profesores (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL CHECK (length(btrim(nombre)) > 0),
    codigo TEXT NOT NULL UNIQUE CHECK (length(btrim(codigo)) > 0),
    materia_id BIGINT NOT NULL REFERENCES materias(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_materias_categoria ON materias(categoria);
CREATE INDEX IF NOT EXISTS idx_profesores_materia_id ON profesores(materia_id);

-- Optional many-to-many assignment support for future UI/API growth.
CREATE TABLE IF NOT EXISTS profesor_materias (
    profesor_id BIGINT NOT NULL REFERENCES profesores(id) ON DELETE CASCADE,
    materia_id BIGINT NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
    es_principal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (profesor_id, materia_id)
);

CREATE INDEX IF NOT EXISTS idx_profesor_materias_materia_id ON profesor_materias(materia_id);

-- Execution trace for comparing performance when running fully on Railway.
CREATE TABLE IF NOT EXISTS ejecuciones_algoritmo (
    id BIGSERIAL PRIMARY KEY,
    trace_id TEXT UNIQUE,
    source TEXT NOT NULL DEFAULT 'local_backend'
        CHECK (source IN ('local_backend', 'delegated_railway', 'unknown')),
    status TEXT NOT NULL DEFAULT 'UNKNOWN',
    message TEXT,
    seed INTEGER,
    num_profes INTEGER,
    num_salones_comunes INTEGER,
    num_salones_pc INTEGER,
    use_ui_data BOOLEAN NOT NULL DEFAULT false,
    duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
    excel_path TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ejecuciones_algoritmo_started_at ON ejecuciones_algoritmo(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ejecuciones_algoritmo_status ON ejecuciones_algoritmo(status);
CREATE INDEX IF NOT EXISTS idx_ejecuciones_algoritmo_source ON ejecuciones_algoritmo(source);

-- Schedule results produced by the algorithm.
CREATE TABLE IF NOT EXISTS horario_eventos (
    id BIGSERIAL PRIMARY KEY,
    ejecucion_id BIGINT NOT NULL REFERENCES ejecuciones_algoritmo(id) ON DELETE CASCADE,
    materia_id BIGINT NOT NULL REFERENCES materias(id) ON DELETE RESTRICT,
    profesor_id BIGINT NOT NULL REFERENCES profesores(id) ON DELETE RESTRICT,
    dia SMALLINT NOT NULL CHECK (dia BETWEEN 0 AND 6),
    bloque SMALLINT NOT NULL CHECK (bloque BETWEEN 0 AND 23),
    salon TEXT NOT NULL CHECK (length(btrim(salon)) > 0),
    grupo INTEGER NOT NULL DEFAULT 1 CHECK (grupo >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (ejecucion_id, dia, bloque, salon)
);

CREATE INDEX IF NOT EXISTS idx_horario_eventos_ejecucion_id ON horario_eventos(ejecucion_id);
CREATE INDEX IF NOT EXISTS idx_horario_eventos_materia_id ON horario_eventos(materia_id);
CREATE INDEX IF NOT EXISTS idx_horario_eventos_profesor_id ON horario_eventos(profesor_id);
CREATE INDEX IF NOT EXISTS idx_horario_eventos_slot ON horario_eventos(dia, bloque);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_materias_set_updated_at'
    ) THEN
        CREATE TRIGGER trg_materias_set_updated_at
            BEFORE UPDATE ON materias
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_profesores_set_updated_at'
    ) THEN
        CREATE TRIGGER trg_profesores_set_updated_at
            BEFORE UPDATE ON profesores
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

COMMIT;

