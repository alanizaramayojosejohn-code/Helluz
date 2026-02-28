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
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string
  updatedByName?: string
}

export type CreateStudentDto = Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
export type UpdateStudentDto = Partial<Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>;
