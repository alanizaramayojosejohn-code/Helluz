import { Timestamp } from '@angular/fire/firestore';

export interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  membershipId: string;
  membershipName: string;
  branchId: string;
  branchName: string;

  startDate: Timestamp;
  endDate: Timestamp;

  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;

  allowedDays: number[];

  cost: number;
  // paymentStatus: 'pendiente' | 'pagado' | 'parcial';
  paymentMethod: 'Qr' | 'Efectivo';

  status: 'activa' | 'vencida' | 'cancelada' | 'completada';

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type CreateEnrollmentDto = Omit<Enrollment, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEnrollmentDto = Partial<Omit<Enrollment, 'id' | 'createdAt' | 'updatedAt'>>;

export interface EnrollmentFormValue {
  studentId: string;
  membershipId: string;
  branchId: string;
  startDate: Date;
  paymentStatus: 'pendiente' | 'pagado' | 'parcial';
}
