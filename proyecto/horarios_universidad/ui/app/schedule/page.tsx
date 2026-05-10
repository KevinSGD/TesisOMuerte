"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { ScheduleGrid } from "@/components/schedule-grid";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSchedule, runOptimizationAlgorithm } from "@/lib/schedule-store";
import { rooms } from "@/lib/data";
import { ScheduleEntry, ValidationResult } from "@/lib/types";
import { Play, Filter, RefreshCw } from "lucide-react";

export default function GlobalSchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [algorithmResult, setAlgorithmResult] =
    useState<ValidationResult | null>(null);

  useEffect(() => {
    setSchedule(getSchedule());
  }, []);

  const refreshSchedule = () => {
    setSchedule(getSchedule());
  };

  const handleRunAlgorithm = async () => {
    const result = await runOptimizationAlgorithm();
    setAlgorithmResult(result);
    refreshSchedule();

    setTimeout(() => {
      setAlgorithmResult(null);
    }, 5000);
  };

  const filteredSchedule = schedule.filter((entry) => {
    if (selectedType === "all") return true;
    const room = rooms.find((r) => r.id === entry.roomId);
    return room?.type === selectedType;
  });

  const totalClasses = filteredSchedule.length;
  const uniqueTeachers = new Set(filteredSchedule.map((s) => s.teacher)).size;
  const uniqueGroups = new Set(filteredSchedule.map((s) => s.group)).size;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Horario Global
            </h1>
            <p className="mt-2 text-muted-foreground">
              Vista semanal con días a la izquierda y horas en la parte superior.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={refreshSchedule}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={handleRunAlgorithm}>
              <Play className="h-4 w-4 mr-2" />
              Ejecutar algoritmo
            </Button>
          </div>
        </div>

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

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filtros:</span>
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de salón" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los salones</SelectItem>
              <SelectItem value="lab">Laboratorios</SelectItem>
              <SelectItem value="classroom">Salones de clase</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">{totalClasses}</p>
            <p className="text-sm text-muted-foreground">Clases programadas</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">
              {selectedType === "all"
                ? rooms.length
                : rooms.filter((room) => room.type === selectedType).length}
            </p>
            <p className="text-sm text-muted-foreground">Salones mostrados</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">
              {uniqueTeachers}
            </p>
            <p className="text-sm text-muted-foreground">Profesores</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">{uniqueGroups}</p>
            <p className="text-sm text-muted-foreground">Grupos</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Calendario semanal
          </h2>
          <ScheduleGrid schedule={filteredSchedule} />
        </div>
      </main>
    </div>
  );
}
