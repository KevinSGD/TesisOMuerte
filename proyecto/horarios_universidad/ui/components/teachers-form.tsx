"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Check, Trash2, UserPlus } from "lucide-react";
import { Subject, Teacher } from "@/lib/types";

interface TeachersFormProps {
  subjects: Subject[];
  value?: Teacher[];
  onTeachersChange: (teachers: Teacher[]) => void;
}

export function TeachersForm({
  subjects,
  value = [],
  onTeachersChange,
}: TeachersFormProps) {
  const [teachers, setTeachers] = useState<Teacher[]>(value);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setTeachers(value);
  }, [value]);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    selectedSubjects: [] as string[],
  });

  const syncTeachers = (updated: Teacher[]) => {
    setTeachers(updated);
    onTeachersChange(updated);
  };

  const addTeacher = () => {
    const newTeacher: Teacher = {
      id: `teacher-${Date.now()}`,
      name: "",
      maxSubjects: 5,
      assignedSubjects: [],
    };
    syncTeachers([...teachers, newTeacher]);
    setEditingId(newTeacher.id);
    setFormData({ id: newTeacher.id, name: "", selectedSubjects: [] });
  };

  const editTeacher = (teacher: Teacher) => {
    setEditingId(teacher.id);
    setFormData({
      id: teacher.id,
      name: teacher.name,
      selectedSubjects: teacher.assignedSubjects,
    });
  };

  const saveTeacher = () => {
    if (!formData.id.trim()) return;
    const updated = teachers.map((teacher) =>
      teacher.id === formData.id
        ? {
            ...teacher,
            name: formData.name,
            assignedSubjects: formData.selectedSubjects,
          }
        : teacher
    );
    syncTeachers(updated);
    setEditingId(null);
    setFormData({ id: "", name: "", selectedSubjects: [] });
  };

  const removeTeacher = (id: string) => {
    syncTeachers(teachers.filter((teacher) => teacher.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setFormData({ id: "", name: "", selectedSubjects: [] });
    }
  };

  const toggleSubject = (subjectId: string) => {
    setFormData((current) => {
      const assigned = current.selectedSubjects.includes(subjectId)
        ? current.selectedSubjects.filter((id) => id !== subjectId)
        : [...current.selectedSubjects, subjectId].slice(0, 5);
      return { ...current, selectedSubjects: assigned };
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border bg-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Profesores y asignaciones
            </h2>
            <p className="text-sm text-muted-foreground">
              Crea profesores y asígnales hasta 5 materias ya registradas.
            </p>
          </div>
          <Button type="button" size="sm" onClick={addTeacher} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Agregar profesor
          </Button>
        </div>
      </Card>

      {teachers.length === 0 && (
        <Card className="border border-border bg-secondary/30 p-6 text-sm text-muted-foreground">
          No hay profesores definidos. Crea uno para asignar materias.
        </Card>
      )}

      {teachers.map((teacher) => (
        <Card key={teacher.id} className="border border-border bg-secondary/30 p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">ID</p>
              <p className="text-sm font-medium text-foreground">
                {teacher.id}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nombre</p>
              <p className="text-sm font-medium text-foreground">
                {teacher.name || "Sin nombre"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Materias asignadas</p>
              <p className="text-sm font-medium text-foreground">
                {teacher.assignedSubjects.length} / {teacher.maxSubjects}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {teacher.assignedSubjects.map((subjectId) => {
              const subject = subjects.find((item) => item.id === subjectId);
              return (
                <div
                  key={subjectId}
                  className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  {subject?.name || subjectId}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => editTeacher(teacher)}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => removeTeacher(teacher.id)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>

          {editingId === teacher.id && (
            <div className="mt-6 rounded-lg border border-border bg-background/80 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    ID del profesor
                  </label>
                  <Input
                    value={formData.id}
                    onChange={(e) =>
                      setFormData({ ...formData, id: e.target.value })
                    }
                    placeholder="Ej: prof-123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nombre
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ej: Ana Pérez"
                  />
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-foreground mb-2">
                  Asignar materias (máximo 5)
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {subjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Registra primero las materias para poder asignarlas.
                    </p>
                  ) : (
                    subjects.map((subject) => {
                      const isSelected = formData.selectedSubjects.includes(subject.id);
                      return (
                        <button
                          key={subject.id}
                          type="button"
                          onClick={() => toggleSubject(subject.id)}
                          className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-background text-muted-foreground hover:border-primary/60"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-medium">{subject.name || "Materia sin nombre"}</p>
                              <p className="text-xs text-muted-foreground">
                                {subject.credits} créditos
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingId(null)}
                >
                  Cancelar
                </Button>
                <Button size="sm" onClick={saveTeacher}>
                  Guardar profesor
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
