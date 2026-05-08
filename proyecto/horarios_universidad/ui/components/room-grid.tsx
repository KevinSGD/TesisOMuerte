"use client";

import { Room, ScheduleEntry } from "@/lib/types";
import { RoomCard } from "./room-card";

interface RoomGridProps {
  rooms: Room[];
  schedule: ScheduleEntry[];
  title: string;
}

export function RoomGrid({ rooms, schedule, title }: RoomGridProps) {
  const today = new Date().toLocaleDateString("es-ES", { weekday: "long" });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  const getClassesToday = (roomId: string) => {
    return schedule.filter(
      (entry) => entry.roomId === roomId && entry.day === todayCapitalized
    ).length;
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm text-muted-foreground">
          {rooms.length}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            classesToday={getClassesToday(room.id)}
          />
        ))}
      </div>
    </section>
  );
}
