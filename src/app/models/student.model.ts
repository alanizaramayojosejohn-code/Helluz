// models/student.model.ts
import { Timestamp } from '@angular/fire/firestore';

export interface Student {
  id?: string;
  name: string;
  lastname: string;
  ci: string;
  cellphone: string;
  email?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  status: 'activo' | 'inactivo';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type CreateStudentDto = Omit<Student, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateStudentDto = Partial<Omit<Student, 'id' | 'createdAt' | 'updatedAt'>>;
