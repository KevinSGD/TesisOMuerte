import { Room, ScheduleEntry } from "./types";

// 15 Labs de sistemas
const labs: Room[] = Array.from({ length: 15 }, (_, i) => ({
  id: `lab-${i + 1}`,
  name: `Lab ${i + 1}`,
  type: "lab" as const,
  capacity: 30,
  building: "Edificio A",
  floor: Math.ceil((i + 1) / 5),
}));

// 8 Salones normales
const classrooms: Room[] = Array.from({ length: 8 }, (_, i) => ({
  id: `classroom-${i + 1}`,
  name: `Salón ${i + 1}`,
  type: "classroom" as const,
  capacity: 40,
  building: "Edificio B",
  floor: Math.ceil((i + 1) / 4),
}));

export const rooms: Room[] = [...labs, ...classrooms];

export const subjects = [
  "Programación I",
  "Programación II",
  "Bases de Datos",
  "Redes",
  "Sistemas Operativos",
  "Algoritmos",
  "Matemáticas I",
  "Matemáticas II",
  "Física",
  "Inglés Técnico",
  "Arquitectura de Computadores",
  "Ingeniería de Software",
  "Seguridad Informática",
  "Inteligencia Artificial",
  "Desarrollo Web",
];

export const teachers = [
  "Prof. García",
  "Prof. Rodríguez",
  "Prof. Martínez",
  "Prof. López",
  "Prof. Hernández",
  "Prof. González",
  "Prof. Pérez",
  "Prof. Sánchez",
  "Prof. Ramírez",
  "Prof. Torres",
];

export const groups = ["G1", "G2", "G3", "G4", "G5", "G6"];

export const colors = [
  "bg-primary/20 border-primary/40",
  "bg-lab/20 border-lab/40",
  "bg-classroom/20 border-classroom/40",
  "bg-chart-4/20 border-chart-4/40",
  "bg-chart-5/20 border-chart-5/40",
];

// Generar horarios de ejemplo
export function generateSchedule(): ScheduleEntry[] {
  const schedule: ScheduleEntry[] = [];
  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  rooms.forEach((room) => {
    // Cada salón tiene entre 3-6 clases por día
    days.forEach((day) => {
      const classesPerDay = Math.floor(Math.random() * 4) + 3;
      const usedSlots = new Set<string>();

      for (let i = 0; i < classesPerDay; i++) {
        let slotId: string;
        do {
          slotId = String(Math.floor(Math.random() * 10) + 1);
        } while (usedSlots.has(slotId));
        usedSlots.add(slotId);

        schedule.push({
          id: `${room.id}-${day}-${slotId}`,
          roomId: room.id,
          day,
          timeSlotId: slotId,
          subject: subjects[Math.floor(Math.random() * subjects.length)],
          teacher: teachers[Math.floor(Math.random() * teachers.length)],
          group: groups[Math.floor(Math.random() * groups.length)],
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    });
  });

  return schedule;
}

export const initialSchedule = generateSchedule();
