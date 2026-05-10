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
  const getEntries = (day: string, timeSlotId: string) => {
    return schedule.filter(
      (entry) => entry.day === day && entry.timeSlotId === timeSlotId
    );
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1000px]">
        {/* Header */}
        <div className="grid grid-cols-[140px_repeat(10,1fr)] gap-1">
          <div className="rounded-lg bg-secondary p-3 text-center text-sm font-medium text-muted-foreground">
            Día / Hora
          </div>
          {TIME_SLOTS.map((slot) => (
            <div
              key={slot.id}
              className="rounded-lg bg-secondary p-3 text-center text-sm font-medium text-foreground"
            >
              {slot.startTime}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="mt-1 space-y-1">
          {DAYS.map((day) => (
            <div
              key={day}
              className="grid grid-cols-[140px_repeat(10,1fr)] gap-1"
            >
              <div className="flex items-center rounded-lg bg-secondary/50 p-2 text-sm font-medium text-muted-foreground">
                {day}
              </div>
              {TIME_SLOTS.map((slot) => {
                const entries = getEntries(day, slot.id);
                return (
                  <ScheduleCell
                    key={`${day}-${slot.id}`}
                    entry={entries[0]}
                    entries={entries}
                    room={room}
                    onClick={
                      editable
                        ? () => onCellClick?.(day, slot.id, entries[0])
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
