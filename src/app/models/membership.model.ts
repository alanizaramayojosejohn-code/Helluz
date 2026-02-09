// models/membership.model.ts
import { Timestamp } from '@angular/fire/firestore';

export interface Membership {
  id?: string;
  name: string;
  durationDays: number;
  totalSessions: number;
  allowedDays: number[];
  cost: number;
  status: 'activo' | 'inactivo';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  userId?: string;
}

export type CreateMembershipDto = Omit<Membership, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateMembershipDto = Partial<Omit<Membership, 'id' | 'createdAt' | 'updatedAt'>>;
