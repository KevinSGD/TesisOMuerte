import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_BASE_URL = "https://tesisomuerte-production.up.railway.app";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, message: "Body invalido." },
      { status: 400 }
    );
  }

  const baseUrl = process.env.ALGORITHM_API_URL || DEFAULT_BASE_URL;
  const apiHeader = process.env.ALGORITHM_API_HEADER || "x-api-key";
  const apiKey = process.env.ALGORITHM_API_KEY;
  const url = `${baseUrl.replace(/\/+$/, "")}/api/run/`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (apiKey) {
    headers[apiHeader] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await response.text();
    let payload: unknown = text;
    try {
      payload = JSON.parse(text);
    } catch {
      // Keep raw text as payload if not JSON.
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          message:
            typeof payload === "string"
              ? payload
              : (payload as { detail?: string }).detail ||
                "Error al ejecutar el algoritmo.",
          data: payload,
        },
        { status: response.status }
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
