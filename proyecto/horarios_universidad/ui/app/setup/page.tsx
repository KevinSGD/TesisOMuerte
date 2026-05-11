"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { SubjectsForm } from "@/components/subjects-form";
import { TeachersForm } from "@/components/teachers-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getSubjects,
  getTeachers,
  saveSubjects,
  saveTeachers,
  runOptimizationAlgorithm,
} from "@/lib/schedule-store";
import { Subject, Teacher, ValidationResult } from "@/lib/types";

export default function SetupPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [status, setStatus] = useState<ValidationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setSubjects(getSubjects());
    setTeachers(getTeachers());
  }, []);

  const handleSubjectsChange = (updatedSubjects: Subject[]) => {
    const validSubjectIds = new Set(updatedSubjects.map((subject) => subject.id));

    setSubjects(updatedSubjects);
    setTeachers((currentTeachers) =>
      currentTeachers.map((teacher) => ({
        ...teacher,
        assignedSubjects: teacher.assignedSubjects.filter((subjectId) =>
          validSubjectIds.has(subjectId)
        ),
      }))
    );
  };

  const handleSaveData = () => {
    saveSubjects(subjects);
    saveTeachers(teachers);
    setStatus({ valid: true, message: "Datos guardados localmente." });
  };

  const handleRunAlgorithm = async () => {
    setIsRunning(true);
    setStatus({ valid: true, message: "Enviando datos al algoritmo..." });
    saveSubjects(subjects);
    saveTeachers(teachers);

    try {
      const result = await runOptimizationAlgorithm();
      setStatus(result);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Registro de datos
            </h1>
            <p className="mt-2 text-muted-foreground">
              Crea materias y profesores para enviarlos al algoritmo.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={handleSaveData}>
              Guardar datos
            </Button>
            <Button
              type="button"
              onClick={handleRunAlgorithm}
              disabled={isRunning}
            >
              {isRunning ? "Ejecutando..." : "Enviar al algoritmo"}
            </Button>
          </div>
        </div>

        {status && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              status.valid
                ? "border border-success/30 bg-success/10 text-success"
                : "border border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {status.message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          <Card className="border border-border bg-card p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                Materias
              </h2>
              <p className="text-sm text-muted-foreground">
                Agrega el numero de materias y completa nombre, creditos y
                cantidad de grupos.
              </p>
            </div>
            <SubjectsForm
              value={subjects}
              onSubjectsChange={handleSubjectsChange}
            />
          </Card>

          <Card className="border border-border bg-card p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                Profesores
              </h2>
              <p className="text-sm text-muted-foreground">
                Crea profesores por ID y asigna materias previamente
                registradas.
              </p>
            </div>
            <TeachersForm
              subjects={subjects}
              value={teachers}
              onTeachersChange={setTeachers}
            />
          </Card>
        </div>
      </main>
    </div>
  );
}
