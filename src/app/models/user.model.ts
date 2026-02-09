import { Timestamp } from '@angular/fire/firestore'

export type UserRole = 'admin' | 'instructor'

export interface AppUser {
   id: string
   email: string
   displayName: string
   role: UserRole
   isActive: boolean
   createdAt: Timestamp
   updatedAt: Timestamp
}

export interface UserCreate extends Omit<AppUser, 'id' | 'createdAt' | 'updatedAt'> {}
