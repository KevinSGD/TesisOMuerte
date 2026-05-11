import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_BASE_URL = "https://tesisomuerte-production.up.railway.app";

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizePositiveInt(value: unknown, fallback: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.max(1, Math.trunc(numberValue));
}

function validateUiPayload(body: JsonObject) {
  if (body.use_ui_data !== true) {
    return { valid: true, body };
  }

  const materias = Array.isArray(body.materias) ? body.materias : [];
  const profesores = Array.isArray(body.profesores) ? body.profesores : [];

  if (!materias.length) {
    return { valid: false, message: "La API necesita al menos una materia." };
  }
  if (!profesores.length) {
    return { valid: false, message: "La API necesita al menos un profesor." };
  }

  const subjectIds = new Set<string>();
  const normalizedMaterias = [];

  for (const rawMateria of materias) {
    if (!isObject(rawMateria)) {
      return { valid: false, message: "Cada materia debe ser un objeto." };
    }

    const id = String(rawMateria.id ?? "").trim();
    const nombre = String(rawMateria.nombre ?? "").trim();
    const horas = normalizePositiveInt(
      rawMateria.horas ?? rawMateria.creditos,
      1
    );
    const grupos = normalizePositiveInt(rawMateria.grupos, 1);
    const categoria = String(rawMateria.categoria ?? "Software").trim();

    if (!/^\d+$/.test(id)) {
      return { valid: false, message: "Cada materia debe tener un ID numerico." };
    }
    if (subjectIds.has(id)) {
      return { valid: false, message: `El ID de materia ${id} esta repetido.` };
    }
    if (!nombre) {
      return { valid: false, message: "Cada materia debe tener nombre." };
    }

    subjectIds.add(id);
    normalizedMaterias.push({
      ...rawMateria,
      id,
      nombre,
      horas,
      creditos: horas,
      grupos,
      categoria,
    });
  }

  const coveredSubjects = new Set<string>();
  const normalizedProfesores = [];

  for (const rawProfesor of profesores) {
    if (!isObject(rawProfesor)) {
      return { valid: false, message: "Cada profesor debe ser un objeto." };
    }

    const codigo = String(rawProfesor.codigo ?? rawProfesor.id ?? "").trim();
    const nombre = String(rawProfesor.nombre ?? "").trim();
    const materiasProfesor = Array.isArray(rawProfesor.materias)
      ? rawProfesor.materias.map((materia) => String(materia).trim())
      : [];

    if (!codigo) {
      return { valid: false, message: "Cada profesor debe tener codigo." };
    }
    if (!nombre) {
      return { valid: false, message: "Cada profesor debe tener nombre." };
    }

    for (const materiaId of materiasProfesor) {
      if (!subjectIds.has(materiaId)) {
        return {
          valid: false,
          message: `El profesor ${nombre} tiene una materia asignada que no existe.`,
        };
      }
      coveredSubjects.add(materiaId);
    }

    normalizedProfesores.push({
      ...rawProfesor,
      codigo,
      nombre,
      materias: materiasProfesor,
      max_materias: normalizePositiveInt(rawProfesor.max_materias, 5),
    });
  }

  const missingSubject = normalizedMaterias.find(
    (materia) => !coveredSubjects.has(String(materia.id))
  );
  if (missingSubject) {
    return {
      valid: false,
      message: `La materia ${missingSubject.nombre} no tiene profesores asignados.`,
    };
  }

  return {
    valid: true,
    body: {
      ...body,
      materias: normalizedMaterias,
      profesores: normalizedProfesores,
      num_profes: Math.max(
        Number(body.num_profes) || 0,
        normalizedProfesores.length
      ),
    },
  };
}

function extractMessage(payload: unknown, fallback: string) {
  if (typeof payload === "string") return payload || fallback;
  if (!isObject(payload)) return fallback;

  const detail = payload.detail;
  const message = payload.message;
  const error = payload.error;

  if (typeof message === "string" && message.trim()) return message;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (typeof error === "string" && error.trim()) return error;

  return fallback;
}

function shouldTryAlternateEndpoint(payload: unknown) {
  const message = extractMessage(payload, "").toLowerCase();
  return (
    message.includes("requiere post") ||
    message.includes("requires post") ||
    message.includes("usa /docs")
  );
}

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
    redirect: "follow",
  });

  const text = await response.text();
  let payload: unknown = text;
  try {
    payload = JSON.parse(text);
  } catch {
    // Keep raw text as payload if not JSON.
  }

  return { response, payload };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isObject(body)) {
    return NextResponse.json(
      { ok: false, message: "Body invalido." },
      { status: 400 }
    );
  }

  const validation = validateUiPayload(body);
  if (!validation.valid) {
    return NextResponse.json(
      { ok: false, message: validation.message },
      { status: 400 }
    );
  }

  const baseUrl = process.env.ALGORITHM_API_URL || DEFAULT_BASE_URL;
  const apiHeader = process.env.ALGORITHM_API_HEADER || "x-api-key";
  const apiKey = process.env.ALGORITHM_API_KEY;
  const rootUrl = baseUrl.replace(/\/+$/, "");
  const urls = [`${rootUrl}/api/run`, `${rootUrl}/api/run/`];

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (apiKey) {
    headers[apiHeader] = apiKey;
  }

  try {
    let { response, payload } = await postJson(
      urls[0],
      headers,
      validation.body
    );

    if (
      response.ok &&
      isObject(payload) &&
      payload.ok === false &&
      shouldTryAlternateEndpoint(payload)
    ) {
      const alternate = await postJson(urls[1], headers, validation.body);
      response = alternate.response;
      payload = alternate.payload;
    }

    if (!response.ok || (isObject(payload) && payload.ok === false)) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          message: extractMessage(payload, "Error al ejecutar el algoritmo."),
          data: payload,
        },
        { status: response.ok ? 502 : response.status }
      );
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "No se pudo conectar con el algoritmo." },
      { status: 502 }
    );
  }
}
