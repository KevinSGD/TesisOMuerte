"use client";

import { ScheduleEntry, TIME_SLOTS, DAYS, Room } from "@/lib/types";
import { ScheduleCell } from "./schedule-cell";

interface ScheduleGridProps {
  schedule: ScheduleEntry[];
  room?: Room;
  onCellClick?: (day: string, timeSlotId: string, entry?: ScheduleEntry) => void;
  editable?: boolean;
}

export function ScheduleGrid({
  schedule,
  room,
  onCellClick,
  editable = false,
}: ScheduleGridProps) {
  const getEntry = (day: string, timeSlotId: string) => {
    return schedule.find(
      (entry) => entry.day === day && entry.timeSlotId === timeSlotId
    );
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        {/* Header */}
        <div className="grid grid-cols-[100px_repeat(6,1fr)] gap-1">
          <div className="rounded-lg bg-secondary p-3 text-center text-sm font-medium text-muted-foreground">
            Hora
          </div>
          {DAYS.map((day) => (
            <div
              key={day}
              className="rounded-lg bg-secondary p-3 text-center text-sm font-medium text-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="mt-1 space-y-1">
          {TIME_SLOTS.map((slot) => (
            <div
              key={slot.id}
              className="grid grid-cols-[100px_repeat(6,1fr)] gap-1"
            >
              <div className="flex items-center justify-center rounded-lg bg-secondary/50 p-2 text-xs text-muted-foreground">
                {slot.label}
              </div>
              {DAYS.map((day) => {
                const entry = getEntry(day, slot.id);
                return (
                  <ScheduleCell
                    key={`${day}-${slot.id}`}
                    entry={entry}
                    room={room}
                    onClick={
                      editable
                        ? () => onCellClick?.(day, slot.id, entry)
                        : undefined
                    }
                    editable={editable}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
