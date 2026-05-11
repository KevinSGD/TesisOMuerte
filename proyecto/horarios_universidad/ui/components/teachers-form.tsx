"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Subject, Teacher } from "@/lib/types";

interface TeachersFormProps {
  subjects: Subject[];
  value?: Teacher[];
  onTeachersChange: (teachers: Teacher[]) => void;
}

function createTeacher(index: number): Teacher {
  return {
    id: String(index + 1),
    name: "",
    maxSubjects: 5,
    assignedSubjects: [],
  };
}

export function TeachersForm({
  subjects,
  value = [],
  onTeachersChange,
}: TeachersFormProps) {
  const [numTeachers, setNumTeachers] = useState<string>(
    value.length ? String(value.length) : ""
  );

  useEffect(() => {
    setNumTeachers(value.length ? String(value.length) : "");
  }, [value.length]);

  const availableSubjects = useMemo(
    () => subjects.filter((subject) => subject.name.trim()),
    [subjects]
  );

  const syncTeachers = (updated: Teacher[]) => {
    onTeachersChange(updated);
    setNumTeachers(updated.length ? String(updated.length) : "");
  };

  const ensureTeachersCount = (count: string) => {
    const safeCount = Math.max(0, Number(count) || 0);

    if (safeCount > value.length) {
      const newTeachers = Array.from(
        { length: safeCount - value.length },
        (_, index) => createTeacher(value.length + index)
      );
      syncTeachers([...value, ...newTeachers]);
      return;
    }

    syncTeachers(value.slice(0, safeCount));
  };

  const handleNumTeachersChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNumTeachers(e.target.value);
  };

  const updateTeacher = (id: string, updates: Partial<Teacher>) => {
    syncTeachers(
      value.map((teacher) =>
        teacher.id === id ? { ...teacher, ...updates } : teacher
      )
    );
  };

  const updateTeacherId = (currentId: string, nextId: string) => {
    const cleanId = nextId.trim();
    if (!cleanId) {
      updateTeacher(currentId, { id: nextId });
      return;
    }

    const duplicated = value.some(
      (teacher) => teacher.id !== currentId && teacher.id === cleanId
    );
    if (duplicated) return;

    syncTeachers(
      value.map((teacher) =>
        teacher.id === currentId ? { ...teacher, id: cleanId } : teacher
      )
    );
  };

  const addTeacher = () => {
    syncTeachers([...value, createTeacher(value.length)]);
  };

  const removeTeacher = (id: string) => {
    syncTeachers(value.filter((teacher) => teacher.id !== id));
  };

  const toggleSubject = (teacher: Teacher, subjectId: string) => {
    const alreadyAssigned = teacher.assignedSubjects.includes(subjectId);
    const assignedSubjects = alreadyAssigned
      ? teacher.assignedSubjects.filter((id) => id !== subjectId)
      : [...teacher.assignedSubjects, subjectId].slice(
          0,
          Math.max(1, teacher.maxSubjects)
        );

    updateTeacher(teacher.id, { assignedSubjects });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="grid gap-4 sm:grid-cols-[220px_1fr_auto] sm:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Numero de profesores
            </label>
            <Input
              type="number"
              min={0}
              value={numTeachers}
              onChange={handleNumTeachersChange}
              placeholder="Ej: 10"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Cada profesor puede recibir hasta el maximo de materias definido.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => ensureTeachersCount(numTeachers)}
          >
            Generar campos
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Profesores y asignaciones
          </h3>
          <p className="text-sm text-muted-foreground">
            {value.length} profesores registrados.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addTeacher}>
          <Plus className="h-4 w-4" />
          Agregar profesor
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-6 text-sm text-muted-foreground">
          Ingresa un numero de profesores y pulsa Generar campos para empezar.
        </div>
      ) : (
        <div className="space-y-4">
          {value.map((teacher, index) => (
            <Card
              key={`${teacher.id}-${index}`}
              className="border border-border bg-secondary/20 p-4"
            >
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground">
                  Registro de profesor
                </p>
                <p className="text-xs text-muted-foreground">
                  {teacher.name.trim() || `Pendiente por nombrar #${index + 1}`}
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-[150px_minmax(180px,1fr)_130px_auto] lg:items-end">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    ID profesor
                  </label>
                  <Input
                    value={teacher.id}
                    onChange={(e) => updateTeacherId(teacher.id, e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Nombre
                  </label>
                  <Input
                    value={teacher.name}
                    onChange={(e) =>
                      updateTeacher(teacher.id, { name: e.target.value })
                    }
                    placeholder="Ej: Ana Perez"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Max. materias
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={teacher.maxSubjects}
                    onChange={(e) => {
                      const maxSubjects = Math.max(
                        1,
                        Number(e.target.value) || 1
                      );
                      updateTeacher(teacher.id, {
                        maxSubjects,
                        assignedSubjects: teacher.assignedSubjects.slice(
                          0,
                          maxSubjects
                        ),
                      });
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeTeacher(teacher.id)}
                  aria-label={`Eliminar profesor ${index + 1}`}
                  title="Eliminar profesor"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-foreground">
                  Materias asignadas ({teacher.assignedSubjects.length} /{" "}
                  {teacher.maxSubjects})
                </p>

                {availableSubjects.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border bg-background p-3 text-sm text-muted-foreground">
                    Registra primero materias con nombre para poder asignarlas.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {availableSubjects.map((subject) => {
                      const isSelected = teacher.assignedSubjects.includes(
                        subject.id
                      );
                      const isAtLimit =
                        !isSelected &&
                        teacher.assignedSubjects.length >= teacher.maxSubjects;

                      return (
                        <button
                          key={subject.id}
                          type="button"
                          disabled={isAtLimit}
                          onClick={() => toggleSubject(teacher, subject.id)}
                          className={`rounded-md border p-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            isSelected
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-background text-muted-foreground hover:border-primary/60"
                          }`}
                        >
                          <span className="block font-medium">
                            {subject.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {subject.credits} creditos | {subject.groups} grupos
                            | {subject.category}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
