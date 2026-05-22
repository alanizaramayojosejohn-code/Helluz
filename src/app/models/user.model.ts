import { Timestamp } from '@angular/fire/firestore'

export type UserRole = 'superAdmin' | 'admin' | 'instructor'

export interface User {
   id?: string
   email: string
   name: string
   lastname: string
   role: UserRole
   branchId?: string
   status: 'activo' | 'inactivo'
   createdAt?: Timestamp
   updatedAt?: Timestamp
   createdBy?: string
}

export type CreateUserDto = Omit<User, 'id' | 'createdAt' | 'updatedAt'> & {
   password: string
}

export type UpdateUserDto = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'email'>>

export interface AuthUser {
   uid: string
   email: string
   role: UserRole
   branchId?: string
   name: string
   lastname: string
   status: 'activo' | 'inactivo'
}
