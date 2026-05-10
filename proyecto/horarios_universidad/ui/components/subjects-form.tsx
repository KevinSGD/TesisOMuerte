"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { Subject } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Edit2, Trash2, Plus, X } from "lucide-react";

interface SubjectsFormProps {
  value?: Subject[];
  onSubjectsChange: (subjects: Subject[]) => void;
}

export function SubjectsForm({ value = [], onSubjectsChange }: SubjectsFormProps) {
  const [numSubjects, setNumSubjects] = useState<number>(value.length);
  const [subjects, setSubjects] = useState<Subject[]>(value);

  useEffect(() => {
    setSubjects(value);
    setNumSubjects(value.length);
  }, [value]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    credits: "",
    group: "",
  });

  const syncSubjects = (updated: Subject[]) => {
    setSubjects(updated);
    setNumSubjects(updated.length);
    onSubjectsChange(updated);
  };

  const ensureSubjectsCount = (count: number) => {
    if (count > subjects.length) {
      const newSubjects = Array(count - subjects.length)
        .fill(null)
        .map((_, index) => ({
          id: `subject-${Date.now()}-${index}`,
          name: "",
          credits: 0,
          groups: [],
        }));
      syncSubjects([...subjects, ...newSubjects]);
    } else if (count < subjects.length) {
      syncSubjects(subjects.slice(0, count));
    }
  };

  const handleNumSubjectsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const count = Math.max(0, Number(e.target.value) || 0);
    setNumSubjects(count);
  };

  const generateSubjectSlots = () => {
    ensureSubjectsCount(numSubjects);
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    syncSubjects(
      subjects.map((subject) =>
        subject.id === id ? { ...subject, ...updates } : subject
      )
    );
  };

  const removeSubject = (id: string) => {
    syncSubjects(subjects.filter((subject) => subject.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setFormData({ name: "", credits: "", group: "" });
    }
  };

  const startEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setFormData({
      name: subject.name,
      credits: String(subject.credits),
      group: "",
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    const credits = Number(formData.credits) || 0;
    updateSubject(editingId, { name: formData.name, credits });

    if (formData.group.trim()) {
      const subject = subjects.find((item) => item.id === editingId);
      if (subject && !subject.groups.includes(formData.group.trim())) {
        updateSubject(editingId, {
          groups: [...subject.groups, formData.group.trim()],
        });
      }
    }

    setEditingId(null);
    setFormData({ name: "", credits: "", group: "" });
  };

  const addGroup = (subjectId: string) => {
    const group = formData.group.trim();
    if (!group) return;
    const subject = subjects.find((item) => item.id === subjectId);
    if (!subject || subject.groups.includes(group)) return;
    updateSubject(subjectId, { groups: [...subject.groups, group] });
    setFormData({ ...formData, group: "" });
  };

  const removeGroup = (subjectId: string, group: string) => {
    const subject = subjects.find((item) => item.id === subjectId);
    if (!subject) return;
    updateSubject(subjectId, {
      groups: subject.groups.filter((current) => current !== group),
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-[240px_1fr] items-end">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Número de materias
            </label>
            <Input
              type="number"
              min={0}
              value={numSubjects}
              onChange={handleNumSubjectsChange}
              placeholder="Ingrese número de materias"
            />
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <p className="text-sm text-muted-foreground">
              Cada materia puede tener créditos y varios grupos.
            </p>
            <Button type="button" size="sm" onClick={generateSubjectSlots} className="max-w-fit">
              Generar espacios
            </Button>
          </div>
        </div>
      </Card>

      {subjects.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Materias registradas
          </h2>
          {subjects.map((subject) => (
            <Card
              key={subject.id}
              className="border border-border bg-secondary/30 p-5"
            >
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Nombre</p>
                    <p className="text-sm font-medium text-foreground">
                      {subject.name || "Sin nombre"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Créditos</p>
                    <p className="text-sm font-medium text-foreground">
                      {subject.credits}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Grupos</p>
                    <p className="text-sm font-medium text-foreground">
                      {subject.groups.length}
                    </p>
                  </div>
                </div>

                {subject.groups.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {subject.groups.map((group) => (
                      <button
                        key={group}
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        onClick={() => removeGroup(subject.id, group)}
                      >
                        {group}
                        <X className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(subject)}
                    className="gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeSubject(subject.id)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </div>

                {editingId === subject.id && (
                  <div className="space-y-4 rounded-lg border border-border bg-background/80 p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Nombre de la materia
                        </label>
                        <Input
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Ej: Matemáticas I"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Créditos
                        </label>
                        <Input
                          type="number"
                          value={formData.credits}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              credits: e.target.value,
                            })
                          }
                          placeholder="Ej: 4"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Agregar grupo
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          value={formData.group}
                          onChange={(e) =>
                            setFormData({ ...formData, group: e.target.value })
                          }
                          placeholder="Ej: Grupo A"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addGroup(subject.id)}
                        >
                          <Plus className="h-4 w-4" />
                          Agregar grupo
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cerrar
                      </Button>
                      <Button size="sm" onClick={saveEdit}>
                        Guardar cambios
                      </Button>
                    </div>
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
