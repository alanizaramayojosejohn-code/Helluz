import { Timestamp } from '@angular/fire/firestore';

export interface Schedule {
  id?: string;
  branchId: string;
  branchName?: string;
  day: string;
  startTime: string;
  endTime: string;
  discipline: string;
  instructorId?: string; // OPCIONAL - Asignar instructor
  instructorName?: string;
  status: 'activo' | 'inactivo';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}


export type CreateScheduleDto = Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateScheduleDto = Partial<Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>>;
