import { Timestamp } from '@angular/fire/firestore';

export interface InstructorAttendance {
  id: string;
  instructorId: string;
  instructorName: string;
  scheduleId: string;
  branchId: string;
  expectedStartTime: string;
  expectedEndTime: string;
  actualArrivalTime: string;
  actualDepartureTime?: string;
  isLate: boolean;
  minutesLate: number;
  scheduledHours: number;
  actualHours?: number;
  status: 'presente' | 'retrasado' | 'falta' | 'permiso' | 'salida-anticipada';
  createdAt: Timestamp;
}

export type CreateInstructorAttendanceDto = Omit<InstructorAttendance, 'id' | 'createdAt'>;

export interface InstructorAttendanceMarkRequest {
  ci: string;
}

export interface InstructorAttendanceStats {
  total: number;
  presente: number;
  retrasado: number;
  falta: number;
  permiso: number;
  salidaAnticipada: number;
  totalHours: number;
  punctualityRate: number;
  attendances: InstructorAttendance[];
}
