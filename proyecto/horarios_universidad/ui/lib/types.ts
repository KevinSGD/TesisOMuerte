export type RoomType = "lab" | "classroom";

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
  building?: string;
  floor?: number;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
}

export interface Subject {
  id: string;
  name: string;
  credits: number;
  groups: string[];
}

export interface Teacher {
  id: string;
  name: string;
  maxSubjects: number;
  assignedSubjects: string[];
}

export interface ScheduleEntry {
  id: string;
  roomId: string;
  day: string;
  timeSlotId: string;
  subject: string;
  teacher: string;
  group: string;
  color?: string;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
  conflicts?: {
    entry: ScheduleEntry;
    reason: string;
  }[];
}

export const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

export const TIME_SLOTS: TimeSlot[] = [
  { id: "1", startTime: "07:00", endTime: "08:00", label: "07:00 - 08:00" },
  { id: "2", startTime: "08:00", endTime: "09:00", label: "08:00 - 09:00" },
  { id: "3", startTime: "09:00", endTime: "10:00", label: "09:00 - 10:00" },
  { id: "4", startTime: "10:00", endTime: "11:00", label: "10:00 - 11:00" },
  { id: "5", startTime: "11:00", endTime: "12:00", label: "11:00 - 12:00" },
  { id: "6", startTime: "12:00", endTime: "13:00", label: "12:00 - 13:00" },
  { id: "7", startTime: "14:00", endTime: "15:00", label: "14:00 - 15:00" },
  { id: "8", startTime: "15:00", endTime: "16:00", label: "15:00 - 16:00" },
  { id: "9", startTime: "16:00", endTime: "17:00", label: "16:00 - 17:00" },
  { id: "10", startTime: "17:00", endTime: "18:00", label: "17:00 - 18:00" },
];
