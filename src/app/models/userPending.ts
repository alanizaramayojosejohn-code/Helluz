import { Timestamp } from '@angular/fire/firestore'
import { UserRole } from './user.model'

export interface UserPending {
  email: string
  name: string
  lastname: string
  role: UserRole
  branchId?: string
  status: 'activo' | 'inactivo'
  createdBy: string
  createdAt?: Timestamp
}
