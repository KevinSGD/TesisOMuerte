"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { GlobalScheduleView } from "@/components/global-schedule-view";
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
import { ScheduleEntry, DAYS, ValidationResult } from "@/lib/types";
import { Play, Filter, Download, RefreshCw } from "lucide-react";

export default function GlobalSchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("Lunes");
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

  const filteredRooms = rooms.filter((room) => {
    if (selectedType === "all") return true;
    return room.type === selectedType;
  });

  const filteredSchedule = schedule.filter((entry) => {
    const room = rooms.find((r) => r.id === entry.roomId);
    if (selectedType !== "all" && room?.type !== selectedType) return false;
    return entry.day === selectedDay;
  });

  // Stats
  const totalClasses = filteredSchedule.length;
  const uniqueTeachers = new Set(filteredSchedule.map((s) => s.teacher)).size;
  const uniqueGroups = new Set(filteredSchedule.map((s) => s.group)).size;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Horario Global
            </h1>
            <p className="mt-2 text-muted-foreground">
              Vista general de todos los salones y sus horarios asignados
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={refreshSchedule}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={handleRunAlgorithm}>
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

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filtros:</span>
          </div>
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Día" />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((day) => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        {/* Day Tabs */}
        <div className="mb-6 flex gap-1 overflow-x-auto pb-2">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`
                whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium
                transition-colors duration-200
                ${
                  selectedDay === day
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                }
              `}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">{totalClasses}</p>
            <p className="text-sm text-muted-foreground">
              Clases el {selectedDay}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">
              {filteredRooms.length}
            </p>
            <p className="text-sm text-muted-foreground">Salones activos</p>
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

        {/* Global Schedule Grid */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Vista de {selectedDay} -{" "}
            {selectedType === "all"
              ? "Todos los salones"
              : selectedType === "lab"
                ? "Laboratorios"
                : "Salones de clase"}
          </h2>
          <GlobalScheduleView
            schedule={filteredSchedule}
            rooms={filteredRooms}
            day={selectedDay}
          />
        </div>
      </main>
    </div>
  );
}
