"use client";

import { ScheduleEntry, ValidationResult, Room, TIME_SLOTS, DAYS } from "./types";
import { colors, initialSchedule, rooms } from "./data";

// Simulated in-memory store
let scheduleData: ScheduleEntry[] = [...initialSchedule];

const TIME_SLOT_IDS = new Set(TIME_SLOTS.map((slot) => slot.id));
const DEFAULT_PAYLOAD = {
  seed: 42,
  num_profes: 20,
  num_salones_comunes: 8,
  num_salones_pc: 12,
  use_ui_data: false,
  materias: [] as Record<string, unknown>[],
  profesores: [] as Record<string, unknown>[],
};

export function getSchedule(): ScheduleEntry[] {
  return scheduleData;
}

export function getRoomSchedule(roomId: string): ScheduleEntry[] {
  return scheduleData.filter((entry) => entry.roomId === roomId);
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.find((room) => room.id === roomId);
}

export function updateScheduleEntry(
  entryId: string,
  updates: Partial<ScheduleEntry>
): ValidationResult {
  const entryIndex = scheduleData.findIndex((e) => e.id === entryId);
  if (entryIndex === -1) {
    return { valid: false, message: "Entrada no encontrada" };
  }

  const entry = scheduleData[entryIndex];
  const updatedEntry = { ...entry, ...updates };

  // Validate the change
  const validation = validateScheduleChange(updatedEntry, entryId);

  if (validation.valid) {
    scheduleData[entryIndex] = updatedEntry;
  }

  return validation;
}

export function addScheduleEntry(
  entry: Omit<ScheduleEntry, "id">
): ValidationResult {
  const newEntry: ScheduleEntry = {
    ...entry,
    id: `${entry.roomId}-${entry.day}-${entry.timeSlotId}-${Date.now()}`,
  };

  const validation = validateScheduleChange(newEntry, null);

  if (validation.valid) {
    scheduleData.push(newEntry);
  }

  return validation;
}

export function deleteScheduleEntry(entryId: string): ValidationResult {
  const entryIndex = scheduleData.findIndex((e) => e.id === entryId);
  if (entryIndex === -1) {
    return { valid: false, message: "Entrada no encontrada" };
  }

  scheduleData.splice(entryIndex, 1);
  return { valid: true, message: "Entrada eliminada correctamente" };
}

function normalizeDay(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const normalized = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const map: Record<string, (typeof DAYS)[number]> = {
    lunes: "Lunes",
    martes: "Martes",
    miercoles: "Miércoles",
    jueves: "Jueves",
    viernes: "Viernes",
    sabado: "Sábado",
  };
  return map[normalized] ?? (DAYS as readonly string[]).find((d) => d === raw) ?? null;
}

function normalizeBlock(value: unknown): string | null {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const id = String(Math.trunc(num));
  return TIME_SLOT_IDS.has(id) ? id : null;
}

function pickAssignments(payload: unknown): Record<string, unknown>[] {
  if (!payload || typeof payload !== "object") return [];
  const data = payload as Record<string, unknown>;
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (Array.isArray(data.df_asig)) return data.df_asig as Record<string, unknown>[];
  if (Array.isArray(data.assignments)) return data.assignments as Record<string, unknown>[];
  const nested = data.result ?? data.data;
  if (nested && typeof nested === "object") {
    const nestedObj = nested as Record<string, unknown>;
    if (Array.isArray(nestedObj.df_asig)) return nestedObj.df_asig as Record<string, unknown>[];
    if (Array.isArray(nestedObj.assignments)) return nestedObj.assignments as Record<string, unknown>[];
  }
  return [];
}

function hashColorKey(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index] ?? "bg-primary/20 border-primary/40";
}

function mapRoomId(salonRaw: unknown, numSalonesComunes: number): string {
  const raw = String(salonRaw ?? "").trim();
  const match = raw.match(/(\d+)/);
  const fallback = rooms[0]?.id ?? "lab-1";
  if (!match) return fallback;
  const index = Number.parseInt(match[1], 10);
  if (!Number.isFinite(index) || index < 1) return fallback;
  if (index <= numSalonesComunes) {
    return `classroom-${index}`;
  }
  const labIndex = index - numSalonesComunes;
  const labId = `lab-${labIndex}`;
  if (rooms.find((room) => room.id === labId)) return labId;
  return rooms.find((room) => room.type === "lab")?.id ?? fallback;
}

function buildScheduleFromApi(
  payload: unknown,
  numSalonesComunes: number
): ScheduleEntry[] {
  const rows = pickAssignments(payload);
  return rows
    .map((row, idx) => {
      const day = normalizeDay(row["Día"] ?? row["dia"] ?? row["day"]);
      const block = normalizeBlock(row["Bloque"] ?? row["bloque"] ?? row["block"]);
      if (!day || !block) return null;
      const subject = String(row["Materia"] ?? row["materia"] ?? row["subject"] ?? "").trim();
      const teacher = String(row["Profesor"] ?? row["profesor"] ?? row["teacher"] ?? "").trim();
      const group = String(row["Curso"] ?? row["curso"] ?? row["group"] ?? row["grupo"] ?? "").trim();
      const roomId = mapRoomId(row["Salón"] ?? row["Salon"] ?? row["room"], numSalonesComunes);
      const color = hashColorKey(`${subject}|${teacher}|${group}`);
      return {
        id: `${roomId}-${day}-${block}-${idx}`,
        roomId,
        day,
        timeSlotId: block,
        subject: subject || "Materia",
        teacher: teacher || "Profesor",
        group: group || "Grupo",
        color,
      } satisfies ScheduleEntry;
    })
    .filter((entry): entry is ScheduleEntry => Boolean(entry));
}

function validateScheduleChange(
  entry: ScheduleEntry,
  excludeId: string | null
): ValidationResult {
  const conflicts: { entry: ScheduleEntry; reason: string }[] = [];

  // Check for room conflicts (same room, same day, same time)
  const roomConflict = scheduleData.find(
    (e) =>
      e.id !== excludeId &&
      e.roomId === entry.roomId &&
      e.day === entry.day &&
      e.timeSlotId === entry.timeSlotId
  );

  if (roomConflict) {
    conflicts.push({
      entry: roomConflict,
      reason: `El salón ya está ocupado por "${roomConflict.subject}" con ${roomConflict.teacher}`,
    });
  }

  // Check for teacher conflicts (same teacher, same day, same time, different room)
  const teacherConflict = scheduleData.find(
    (e) =>
      e.id !== excludeId &&
      e.teacher === entry.teacher &&
      e.day === entry.day &&
      e.timeSlotId === entry.timeSlotId &&
      e.roomId !== entry.roomId
  );

  if (teacherConflict) {
    conflicts.push({
      entry: teacherConflict,
      reason: `${entry.teacher} ya tiene clase en ${getRoom(teacherConflict.roomId)?.name || teacherConflict.roomId}`,
    });
  }

  // Check for group conflicts (same group, same day, same time, different room)
  const groupConflict = scheduleData.find(
    (e) =>
      e.id !== excludeId &&
      e.group === entry.group &&
      e.day === entry.day &&
      e.timeSlotId === entry.timeSlotId &&
      e.roomId !== entry.roomId
  );

  if (groupConflict) {
    conflicts.push({
      entry: groupConflict,
      reason: `El grupo ${entry.group} ya tiene clase de "${groupConflict.subject}" en ${getRoom(groupConflict.roomId)?.name || groupConflict.roomId}`,
    });
  }

  if (conflicts.length > 0) {
    return {
      valid: false,
      message: "Se encontraron conflictos en el horario",
      conflicts,
    };
  }

  return { valid: true, message: "Cambio válido" };
}

export async function runOptimizationAlgorithm(): Promise<ValidationResult> {
  try {
    const response = await fetch("/api/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(DEFAULT_PAYLOAD),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || (data && data.ok === false)) {
      return {
        valid: false,
        message:
          data?.message || `Error al ejecutar el algoritmo (HTTP ${response.status}).`,
      };
    }

    const schedule = buildScheduleFromApi(data, DEFAULT_PAYLOAD.num_salones_comunes);
    if (!schedule.length) {
      return {
        valid: false,
        message: "La API no devolvió asignaciones válidas.",
      };
    }

    scheduleData = schedule;
    return {
      valid: true,
      message: data?.message || "Algoritmo ejecutado correctamente.",
    };
  } catch (error) {
    return {
      valid: false,
      message: "No se pudo conectar con el algoritmo en la nube.",
    };
  }
}
