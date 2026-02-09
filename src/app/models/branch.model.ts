import { FieldValue, Timestamp } from '@angular/fire/firestore';
export type status = 'activo' | 'inactivo';

export type BranchStatus = 'activo' | 'inactivo'

export interface Branch {
   id: string
   name: string
   city: string
   ip: string
   mask: string
   status: BranchStatus
   createdAt: Timestamp
   updatedAt: Timestamp
   userId?: string;
}

export interface BranchCreate extends Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>{
}

export interface BranchUpdate extends Partial<Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>>{
  updatedAt?: FieldValue
}
