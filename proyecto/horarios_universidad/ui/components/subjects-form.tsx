"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Subject } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const SUBJECT_CATEGORIES = ["Software", "Humanidades", "Ciencias Basicas"];

interface SubjectsFormProps {
  value?: Subject[];
  onSubjectsChange: (subjects: Subject[]) => void;
}

function createSubject(index: number, subjects: Subject[]): Subject {
  const usedIds = new Set(subjects.map((subject) => subject.id));
  let nextId = index + 1;
  while (usedIds.has(String(nextId))) nextId += 1;

  return {
    id: String(nextId),
    name: "",
    credits: 0,
    groups: 0,
    category: "Software",
  };
}

function normalizeSubject(subject: Subject, index: number): Subject {
  const rawGroups = subject.groups;
  const groups = Array.isArray(rawGroups)
    ? rawGroups.length || 1
    : Math.max(1, Number(rawGroups) || 1);

  return {
    ...subject,
    id: /^\d+$/.test(subject.id) ? subject.id : String(index + 1),
    groups: Number(subject.groups) > 0 ? groups : 0,
    category: subject.category || "Software",
  };
}

export function SubjectsForm({
  value = [],
  onSubjectsChange,
}: SubjectsFormProps) {
  const [numSubjects, setNumSubjects] = useState<string>(
    value.length ? String(value.length) : ""
  );

  useEffect(() => {
    setNumSubjects(value.length ? String(value.length) : "");
  }, [value.length]);

  const completeSubjects = useMemo(
    () => value.filter((subject) => subject.name.trim() && subject.groups > 0),
    [value]
  );

  const syncSubjects = (updated: Subject[]) => {
    onSubjectsChange(updated);
    setNumSubjects(updated.length ? String(updated.length) : "");
  };

  const ensureSubjectsCount = (count: string) => {
    const safeCount = Math.max(0, Number(count) || 0);

    if (safeCount > value.length) {
      const newSubjects = Array.from(
        { length: safeCount - value.length },
        (_, index) => createSubject(value.length + index, value)
      );
      syncSubjects([...value, ...newSubjects]);
      return;
    }

    syncSubjects(value.slice(0, safeCount));
  };

  const handleNumSubjectsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNumSubjects(e.target.value);
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    syncSubjects(
      value.map((subject) =>
        subject.id === id ? { ...subject, ...updates } : subject
      )
    );
  };

  const addSubject = () => {
    syncSubjects([...value, createSubject(value.length, value)]);
  };

  const removeSubject = (id: string) => {
    syncSubjects(value.filter((subject) => subject.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="grid gap-4 sm:grid-cols-[220px_1fr_auto] sm:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Numero de materias
            </label>
            <Input
              type="number"
              min={0}
              value={numSubjects}
              onChange={handleNumSubjectsChange}
              placeholder="Ej: 6"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Se generan campos para nombre, creditos y cantidad de grupos.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => ensureSubjectsCount(numSubjects)}
          >
            Generar campos
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Materias registradas
          </h3>
          <p className="text-sm text-muted-foreground">
            {completeSubjects.length} de {value.length} materias tienen nombre y
            cantidad de grupos.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addSubject}>
          <Plus className="h-4 w-4" />
          Agregar materia
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-6 text-sm text-muted-foreground">
          Ingresa un numero de materias y pulsa Generar campos para empezar.
        </div>
      ) : (
        <div className="space-y-4">
          {value.map((rawSubject, index) => {
            const subject = normalizeSubject(rawSubject, index);

            return (
              <Card
                key={subject.id}
                className="border border-border bg-secondary/20 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Registro de materia
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {subject.name.trim() ||
                        `Pendiente por nombrar #${index + 1}`}
                    </p>
                  </div>
                </div>
              <div className="grid gap-4 xl:grid-cols-[80px_minmax(180px,1.2fr)_110px_120px_160px_auto] xl:items-end">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    ID
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={subject.id}
                    onChange={(e) =>
                      updateSubject(subject.id, {
                        id: String(Math.max(1, Number(e.target.value) || 1)),
                      })
                    }
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Nombre de la materia
                  </label>
                  <Input
                    value={subject.name}
                    onChange={(e) =>
                      updateSubject(subject.id, { name: e.target.value })
                    }
                    placeholder="Ej: Matematicas I"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Creditos
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={subject.credits || ""}
                    onChange={(e) =>
                      updateSubject(subject.id, {
                        credits: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    placeholder="4"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Cant. grupos
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={subject.groups || ""}
                    onChange={(e) =>
                      updateSubject(subject.id, {
                        groups: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Categoria
                  </label>
                  <select
                    value={subject.category}
                    onChange={(e) =>
                      updateSubject(subject.id, { category: e.target.value })
                    }
                    className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {SUBJECT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeSubject(subject.id)}
                  aria-label={`Eliminar materia ${index + 1}`}
                  title="Eliminar materia"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
