"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { ScheduleGrid } from "@/components/schedule-grid";
import { ScheduleEditModal } from "@/components/schedule-edit-modal";
import { Button } from "@/components/ui/button";
import {
  getRoomSchedule,
  getRoom,
  updateScheduleEntry,
  addScheduleEntry,
  deleteScheduleEntry,
  runOptimizationAlgorithm,
} from "@/lib/schedule-store";
import { ScheduleEntry, Room, ValidationResult } from "@/lib/types";
import {
  ArrowLeft,
  Monitor,
  DoorOpen,
  Users,
  Building,
  Play,
  Pencil,
} from "lucide-react";
import Link from "next/link";

export default function RoomSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    day: string;
    timeSlotId: string;
    entry?: ScheduleEntry;
  } | null>(null);
  const [algorithmResult, setAlgorithmResult] =
    useState<ValidationResult | null>(null);

  useEffect(() => {
    const roomData = getRoom(id);
    if (roomData) {
      setRoom(roomData);
      setSchedule(getRoomSchedule(id));
    }
  }, [id]);

  const refreshSchedule = () => {
    setSchedule(getRoomSchedule(id));
  };

  const handleCellClick = (
    day: string,
    timeSlotId: string,
    entry?: ScheduleEntry
  ) => {
    setSelectedCell({ day, timeSlotId, entry });
    setModalOpen(true);
  };

  const handleSave = async (
    data: Partial<ScheduleEntry>
  ): Promise<ValidationResult> => {
    if (!selectedCell) return { valid: false, message: "Error interno" };

    let result: ValidationResult;

    if (selectedCell.entry) {
      result = updateScheduleEntry(selectedCell.entry.id, data);
    } else {
      result = addScheduleEntry({
        roomId: id,
        day: selectedCell.day,
        timeSlotId: selectedCell.timeSlotId,
        subject: data.subject || "",
        teacher: data.teacher || "",
        group: data.group || "",
        color: "bg-primary/20 border-primary/40",
      });
    }

    if (result.valid) {
      refreshSchedule();
    }

    return result;
  };

  const handleDelete = async (): Promise<ValidationResult> => {
    if (!selectedCell?.entry) return { valid: false, message: "Error interno" };

    const result = deleteScheduleEntry(selectedCell.entry.id);
    if (result.valid) {
      refreshSchedule();
    }
    return result;
  };

  const handleRunAlgorithm = async () => {
    const result = await runOptimizationAlgorithm();
    setAlgorithmResult(result);
    refreshSchedule();

    setTimeout(() => {
      setAlgorithmResult(null);
    }, 5000);
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-muted-foreground">Salón no encontrado</p>
        </main>
      </div>
    );
  }

  const isLab = room.type === "lab";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Panel
        </Link>

        {/* Room Header */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`
                flex h-16 w-16 items-center justify-center rounded-xl
                ${isLab ? "bg-lab/20 text-lab" : "bg-classroom/20 text-classroom"}
              `}
            >
              {isLab ? (
                <Monitor className="h-8 w-8" />
              ) : (
                <DoorOpen className="h-8 w-8" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{room.name}</h1>
              <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    isLab
                      ? "bg-lab/20 text-lab"
                      : "bg-classroom/20 text-classroom"
                  }`}
                >
                  {isLab ? "Laboratorio" : "Salón de Clase"}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {room.capacity} personas
                </span>
                {room.building && (
                  <span className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {room.building} - Piso {room.floor}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={editMode ? "default" : "outline"}
              onClick={() => setEditMode(!editMode)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {editMode ? "Modo Edición Activo" : "Editar Horario"}
            </Button>
            <Button variant="outline" onClick={handleRunAlgorithm}>
              <Play className="h-4 w-4 mr-2" />
              Ejecutar Algoritmo
            </Button>
          </div>
        </div>

        {/* Algorithm Result */}
        {algorithmResult && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              algorithmResult.valid
                ? "bg-success/10 border border-success/30"
                : "bg-destructive/10 border border-destructive/30"
            }`}
          >
            <p
              className={`font-medium ${
                algorithmResult.valid ? "text-success" : "text-destructive"
              }`}
            >
              {algorithmResult.message}
            </p>
          </div>
        )}

        {/* Edit Mode Notice */}
        {editMode && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm text-foreground">
              <strong>Modo edición activo:</strong> Haz clic en cualquier celda
              para agregar o editar una clase. Los cambios se validarán
              automáticamente para evitar conflictos.
            </p>
          </div>
        )}

        {/* Schedule Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">
              {schedule.length}
            </p>
            <p className="text-sm text-muted-foreground">Clases totales</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">
              {new Set(schedule.map((s) => s.teacher)).size}
            </p>
            <p className="text-sm text-muted-foreground">Profesores</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">
              {new Set(schedule.map((s) => s.subject)).size}
            </p>
            <p className="text-sm text-muted-foreground">Asignaturas</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">
              {new Set(schedule.map((s) => s.group)).size}
            </p>
            <p className="text-sm text-muted-foreground">Grupos</p>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Horario Semanal
          </h2>
          <ScheduleGrid
            schedule={schedule}
            room={room}
            onCellClick={editMode ? handleCellClick : undefined}
            editable={editMode}
          />
        </div>

        {/* Edit Modal */}
        {selectedCell && (
          <ScheduleEditModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setSelectedCell(null);
            }}
            entry={selectedCell.entry}
            day={selectedCell.day}
            timeSlotId={selectedCell.timeSlotId}
            roomId={id}
            onSave={handleSave}
            onDelete={selectedCell.entry ? handleDelete : undefined}
          />
        )}
      </main>
    </div>
  );
}
