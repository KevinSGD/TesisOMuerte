"use client";

import { ScheduleEntry, Room } from "@/lib/types";
import { Plus } from "lucide-react";

interface ScheduleCellProps {
  entry?: ScheduleEntry;
  room?: Room;
  onClick?: () => void;
  editable?: boolean;
}

export function ScheduleCell({ entry, onClick, editable }: ScheduleCellProps) {
  if (!entry) {
    return (
      <div
        onClick={onClick}
        className={`
          flex min-h-[70px] items-center justify-center rounded-lg border border-dashed border-border/50
          bg-secondary/20 transition-all duration-200
          ${editable ? "cursor-pointer hover:border-primary/50 hover:bg-primary/5" : ""}
        `}
      >
        {editable && <Plus className="h-4 w-4 text-muted-foreground/50" />}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        min-h-[70px] rounded-lg border-l-4 p-2 transition-all duration-200
        ${entry.color || "bg-primary/20 border-primary/40"}
        ${editable ? "cursor-pointer hover:scale-[1.02] hover:shadow-md" : ""}
      `}
    >
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-semibold text-foreground line-clamp-1">
          {entry.subject}
        </p>
        <p className="text-[10px] text-muted-foreground line-clamp-1">
          {entry.teacher}
        </p>
        <p className="text-[10px] font-medium text-primary">{entry.group}</p>
      </div>
    </div>
  );
}
