"use client";

import { useState } from "react";
import { ScheduleEntry, ValidationResult, TIME_SLOTS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2, Trash2 } from "lucide-react";

interface ScheduleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry?: ScheduleEntry;
  day: string;
  timeSlotId: string;
  roomId: string;
  onSave: (data: Partial<ScheduleEntry>) => Promise<ValidationResult>;
  onDelete?: () => Promise<ValidationResult>;
}

const subjects = [
  "Programación I",
  "Programación II",
  "Bases de Datos",
  "Redes",
  "Sistemas Operativos",
  "Algoritmos",
  "Matemáticas I",
  "Matemáticas II",
  "Física",
  "Inglés Técnico",
  "Arquitectura de Computadores",
  "Ingeniería de Software",
  "Seguridad Informática",
  "Inteligencia Artificial",
  "Desarrollo Web",
];

const teachers = [
  "Prof. García",
  "Prof. Rodríguez",
  "Prof. Martínez",
  "Prof. López",
  "Prof. Hernández",
  "Prof. González",
  "Prof. Pérez",
  "Prof. Sánchez",
  "Prof. Ramírez",
  "Prof. Torres",
];

const groups = ["G1", "G2", "G3", "G4", "G5", "G6"];

export function ScheduleEditModal({
  isOpen,
  onClose,
  entry,
  day,
  timeSlotId,
  onSave,
  onDelete,
}: ScheduleEditModalProps) {
  const [subject, setSubject] = useState(entry?.subject || "");
  const [teacher, setTeacher] = useState(entry?.teacher || "");
  const [group, setGroup] = useState(entry?.group || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const timeSlot = TIME_SLOTS.find((t) => t.id === timeSlotId);

  const handleSave = async () => {
    if (!subject || !teacher || !group) {
      setResult({ valid: false, message: "Todos los campos son requeridos" });
      return;
    }

    setLoading(true);
    setResult(null);

    const res = await onSave({ subject, teacher, group });
    setResult(res);
    setLoading(false);

    if (res.valid) {
      setTimeout(() => {
        onClose();
        setResult(null);
      }, 1000);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setLoading(true);
    setResult(null);

    const res = await onDelete();
    setResult(res);
    setLoading(false);

    if (res.valid) {
      setTimeout(() => {
        onClose();
        setResult(null);
      }, 500);
    }
  };

  const resetForm = () => {
    setSubject(entry?.subject || "");
    setTeacher(entry?.teacher || "");
    setGroup(entry?.group || "");
    setResult(null);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {entry ? "Editar Clase" : "Agregar Nueva Clase"}
          </DialogTitle>
          <DialogDescription>
            {day} - {timeSlot?.label}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="subject">Asignatura</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar asignatura" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="teacher">Profesor</Label>
            <Select value={teacher} onValueChange={setTeacher}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar profesor" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="group">Grupo</Label>
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar grupo" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Validation Result */}
          {result && (
            <div
              className={`rounded-lg p-3 ${
                result.valid
                  ? "bg-success/10 border border-success/30"
                  : "bg-destructive/10 border border-destructive/30"
              }`}
            >
              <div className="flex items-start gap-2">
                {result.valid ? (
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                )}
                <div>
                  <p
                    className={`font-medium ${result.valid ? "text-success" : "text-destructive"}`}
                  >
                    {result.message}
                  </p>
                  {result.conflicts && result.conflicts.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {result.conflicts.map((conflict, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-destructive">•</span>
                          {conflict.reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {entry && onDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {entry ? "Guardar Cambios" : "Agregar Clase"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
