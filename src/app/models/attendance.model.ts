import { Timestamp } from '@angular/fire/firestore';

export interface Attendance {
  id: string;

  // Persona que marca (alumno o instructor)
  personType: 'student' | 'instructor';
  personId: string;
  personName: string; // desnormalizado

  // Para alumnos
  enrollmentId?: string;

  // Para instructores
  scheduleId: string;
  expectedStartTime?: string; // HH:mm - solo para instructores
  actualArrivalTime?: string; // HH:mm - solo para instructores
  isLate?: boolean; // solo para instructores
  minutesLate?: number; // solo para instructores

  // Común
  branchId: string;
  branchName: string;
  disciplineId: string;
  disciplineName: string;

  date: Timestamp;
  dayOfWeek: number;

  status: 'presente' | 'retrasado' | 'falta' | 'permiso';

  createdAt?: Timestamp;
}

export type CreateAttendanceDto = Omit<Attendance, 'id' | 'createdAt'>;

export interface AttendanceMarkRequest {
  ci: string; // CI del alumno o instructor
  scheduleId: string;
}
