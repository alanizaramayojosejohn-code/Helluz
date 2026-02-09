import { User } from '@angular/fire/auth';
import { FieldValue, Timestamp } from 'firebase/firestore';

export type  Studentstatus= 'activo' | 'inactivo'

export interface Student {
  id: 'uuidv7',
  name : string,
  ci: string,
  celphone: number,
  age:  Timestamp,
  status: Studentstatus,
  idSucursal: string,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: User;
}

export interface StudentCreate extends Omit <Student, 'id' | 'CreatedAt' | 'UpdatedAt'>{
}

export interface StudentUpdate extends Partial<Omit<Student, 'id' | 'createdAt' | 'updatedAt'>>{
 updatedAt?: FieldValue
}
