"use client";

import Link from "next/link";
import { ScheduleEntry, TIME_SLOTS, Room } from "@/lib/types";

interface GlobalScheduleViewProps {
  schedule: ScheduleEntry[];
  rooms: Room[];
  day: string;
}

export function GlobalScheduleView({
  schedule,
  rooms,
  day,
}: GlobalScheduleViewProps) {
  const getEntry = (roomId: string, timeSlotId: string) => {
    return schedule.find(
      (entry) =>
        entry.roomId === roomId &&
        entry.day === day &&
        entry.timeSlotId === timeSlotId
    );
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1200px]">
        {/* Header - Time slots */}
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `150px repeat(${TIME_SLOTS.length}, 1fr)`,
          }}
        >
          <div className="rounded-lg bg-secondary p-2 text-center text-sm font-medium text-muted-foreground">
            Salón / Hora
          </div>
          {TIME_SLOTS.map((slot) => (
            <div
              key={slot.id}
              className="rounded-lg bg-secondary p-2 text-center text-xs font-medium text-foreground"
            >
              {slot.startTime}
            </div>
          ))}
        </div>

        {/* Rooms rows */}
        <div className="mt-1 space-y-1">
          {rooms.map((room) => {
            const isLab = room.type === "lab";
            return (
              <div
                key={room.id}
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `150px repeat(${TIME_SLOTS.length}, 1fr)`,
                }}
              >
                {/* Room name */}
                <Link
                  href={`/room/${room.id}`}
                  className={`
                    flex items-center rounded-lg p-2 text-sm font-medium
                    transition-colors duration-200 hover:opacity-80
                    ${
                      isLab
                        ? "bg-lab/10 text-lab border border-lab/20"
                        : "bg-classroom/10 text-classroom border border-classroom/20"
                    }
                  `}
                >
                  {room.name}
                </Link>

                {/* Time slots */}
                {TIME_SLOTS.map((slot) => {
                  const entry = getEntry(room.id, slot.id);
                  return (
                    <div
                      key={`${room.id}-${slot.id}`}
                      className={`
                        min-h-[50px] rounded-lg text-[10px] transition-all duration-200
                        ${
                          entry
                            ? `${entry.color || "bg-primary/20 border-primary/40"} border-l-2 p-1.5`
                            : "bg-secondary/30 border border-border/30"
                        }
                      `}
                    >
                      {entry && (
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                          <p className="font-semibold text-foreground line-clamp-1">
                            {entry.subject}
                          </p>
                          <p className="text-muted-foreground line-clamp-1">
                            {entry.teacher}
                          </p>
                          <p className="font-medium text-primary">
                            {entry.group}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
