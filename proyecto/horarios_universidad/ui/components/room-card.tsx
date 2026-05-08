"use client";

import Link from "next/link";
import { Room } from "@/lib/types";
import { Monitor, DoorOpen, Users } from "lucide-react";

interface RoomCardProps {
  room: Room;
  classesToday?: number;
}

export function RoomCard({ room, classesToday = 0 }: RoomCardProps) {
  const isLab = room.type === "lab";

  return (
    <Link href={`/room/${room.id}`}>
      <div
        className={`
          group relative overflow-hidden rounded-xl border-2 p-5
          transition-all duration-300 ease-out
          hover:scale-[1.02] hover:shadow-xl
          ${
            isLab
              ? "border-lab/30 bg-lab/5 hover:border-lab/60 hover:bg-lab/10"
              : "border-classroom/30 bg-classroom/5 hover:border-classroom/60 hover:bg-classroom/10"
          }
        `}
      >
        {/* Decorative corner accent */}
        <div
          className={`
            absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20
            transition-opacity duration-300 group-hover:opacity-40
            ${isLab ? "bg-lab" : "bg-classroom"}
          `}
        />

        <div className="relative flex flex-col gap-3">
          {/* Icon and Type Badge */}
          <div className="flex items-center justify-between">
            <div
              className={`
                flex h-10 w-10 items-center justify-center rounded-lg
                ${isLab ? "bg-lab/20 text-lab" : "bg-classroom/20 text-classroom"}
              `}
            >
              {isLab ? (
                <Monitor className="h-5 w-5" />
              ) : (
                <DoorOpen className="h-5 w-5" />
              )}
            </div>
            <span
              className={`
                rounded-full px-2 py-0.5 text-xs font-medium
                ${isLab ? "bg-lab/20 text-lab" : "bg-classroom/20 text-classroom"}
              `}
            >
              {isLab ? "Lab" : "Aula"}
            </span>
          </div>

          {/* Room Name */}
          <h3 className="text-lg font-semibold text-foreground">{room.name}</h3>

          {/* Details */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{room.capacity}</span>
            </div>
            {room.building && (
              <span className="text-xs">
                {room.building} - Piso {room.floor}
              </span>
            )}
          </div>

          {/* Classes indicator */}
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isLab ? "bg-lab" : "bg-classroom"}`}
                style={{ width: `${Math.min((classesToday / 10) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {classesToday} clases hoy
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
