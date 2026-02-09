import { Timestamp } from '@angular/fire/firestore';

export interface Instructor {
  id: string; // UUIDv7
  branchId: string;
  branchName?: string; // Desnormalizado
  name: string;
  lastname: string;
  ci: string; // Cédula de identidad
  cellphone: string;
  email?: string;
  status: 'activo' | 'inactivo'; 
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type CreateInstructorDto = Omit<Instructor, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateInstructorDto = Partial<Omit<Instructor, 'id' | 'createdAt' | 'updatedAt'>>;

export interface InstructorFormValue {
  branchId: string;
  name: string;
  lastname: string;
  ci: string;
  cellphone: string;
  email?: string;
  active: boolean;
}
