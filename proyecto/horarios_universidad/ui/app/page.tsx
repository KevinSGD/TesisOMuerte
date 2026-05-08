"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { RoomGrid } from "@/components/room-grid";
import { rooms } from "@/lib/data";
import { getSchedule } from "@/lib/schedule-store";
import { ScheduleEntry } from "@/lib/types";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function HomePage() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setSchedule(getSchedule());
  }, []);

  const labs = rooms.filter((room) => room.type === "lab");
  const classrooms = rooms.filter((room) => room.type === "classroom");

  const filteredLabs = labs.filter((room) =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredClassrooms = classrooms.filter((room) =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Panel de Control
          </h1>
          <p className="mt-2 text-muted-foreground">
            Gestiona los horarios de los 23 espacios educativos de la
            institución
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-lab/20">
                <span className="text-2xl font-bold text-lab">15</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Laboratorios de Sistemas
                </p>
                <p className="text-lg font-semibold text-foreground">
                  Disponibles
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-classroom/20">
                <span className="text-2xl font-bold text-classroom">8</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Salones Normales</p>
                <p className="text-lg font-semibold text-foreground">
                  Disponibles
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                <span className="text-2xl font-bold text-primary">
                  {schedule.length}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clases Asignadas</p>
                <p className="text-lg font-semibold text-foreground">
                  Esta Semana
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar salón..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Room Grids */}
        <div className="space-y-10">
          <RoomGrid
            rooms={filteredLabs}
            schedule={schedule}
            title="Laboratorios de Sistemas"
          />
          <RoomGrid
            rooms={filteredClassrooms}
            schedule={schedule}
            title="Salones de Clase"
          />
        </div>
      </main>
    </div>
  );
}
