import { inject, Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { User, CreateUserDto, UpdateUserDto } from '../../models/user.model'
import { UserQueryService } from './user-query.service'
import { AuthService } from '../auth/auth.service'
import {
   Firestore,
   doc,
   setDoc,
   deleteDoc,
   getDoc,
   serverTimestamp,
   collection,
   collectionData,
} from '@angular/fire/firestore'
import { UserPending } from '../../models/userPending'

@Injectable()
export class UserService {
   private readonly query = inject(UserQueryService)
   private readonly authService = inject(AuthService)
   private readonly firestore = inject(Firestore)

   getUsers(): Observable<User[]> {
      return this.query.getAll()
   }

   getActiveUsers(): Observable<User[]> {
      return this.query.getActive()
   }

   getInstructors(): Observable<User[]> {
      return this.query.getByRole('instructor')
   }

   getUserById(id: string): Observable<User | undefined> {
      return this.query.getById(id)
   }

   /**
    * El admin pre-registra un usuario en `usuariosPendientes`.
    * Cuando el usuario se registre con ese email, heredará el rol y estado definidos aquí.
    * NO toca Firebase Authentication — el usuario se registra él mismo desde el formulario público.
    */
   async preRegistrarUsuario(userData: Omit<UserPending, 'createdAt'>, currentUserId: string): Promise<void> {
      const isAdmin = await this.authService.isAdmin()
      if (!isAdmin) {
         throw new Error('No tienes permisos para pre-registrar usuarios')
      }

      this.validatePreRegistro(userData)

      const emailKey = userData.email.toLowerCase()

      // Verificar que no exista ya un pendiente con ese email
      const pendienteRef = doc(this.firestore, 'usuariosPendientes', emailKey)
      const existing = await getDoc(pendienteRef)
      if (existing.exists()) {
         throw new Error('Ya existe un pre-registro pendiente con ese email')
      }

      // Verificar que no haya ya un usuario activo con ese email
      const emailExists = await this.query.checkEmailExists(userData.email)
      if (emailExists) {
         throw new Error('Ya existe un usuario registrado con ese email')
      }

      await setDoc(pendienteRef, {
         email: emailKey,
         name: userData.name.trim(),
         lastname: userData.lastname.trim(),
         role: userData.role,
         status: userData.status,
         createdBy: currentUserId,
         createdAt: serverTimestamp(),
      })
   }

   /**
    * Cancela un pre-registro antes de que el usuario se haya registrado.
    */
   async cancelarPreRegistro(email: string): Promise<void> {
      const isAdmin = await this.authService.isAdmin()
      if (!isAdmin) {
         throw new Error('No tienes permisos para cancelar pre-registros')
      }

      const emailKey = email.toLowerCase()
      const pendienteRef = doc(this.firestore, 'usuariosPendientes', emailKey)
      await deleteDoc(pendienteRef)
   }

   /**
    * Lista todos los pre-registros pendientes (usuarios que aún no se han registrado).
    */
   getPendientes(): Observable<UserPending[]> {
      const pendientesCol = collection(this.firestore, 'usuariosPendientes')
      return collectionData(pendientesCol) as Observable<UserPending[]>
   }

   async updateUser(id: string, userData: UpdateUserDto): Promise<void> {
      const isAdmin = await this.authService.isAdmin()
      if (!isAdmin) {
         throw new Error('No tienes permisos para actualizar usuarios')
      }

      if (userData.name !== undefined && userData.name.trim().length < 2) {
         throw new Error('El nombre debe tener al menos 2 caracteres')
      }

      if (userData.lastname !== undefined && userData.lastname.trim().length < 2) {
         throw new Error('El apellido debe tener al menos 2 caracteres')
      }

      await this.query.update(id, userData)
   }

   async deleteUser(id: string): Promise<void> {
      const isAdmin = await this.authService.isAdmin()
      if (!isAdmin) {
         throw new Error('No tienes permisos para eliminar usuarios')
      }

      // Solo elimina de Firestore. El usuario seguirá en Firebase Auth
      // pero no podrá acceder porque getUserData() verifica el doc de Firestore.
      await this.query.delete(id)
   }

   async toggleStatus(id: string, currentStatus: 'activo' | 'inactivo'): Promise<void> {
      const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo'
      await this.query.update(id, { status: newStatus })
   }

   async resetPassword(email: string): Promise<void> {
      await this.authService.sendPasswordReset(email)
   }

   private validatePreRegistro(userData: Omit<UserPending, 'createdAt'>): void {
      if (!userData.name || userData.name.trim().length < 2) {
         throw new Error('El nombre debe tener al menos 2 caracteres')
      }

      if (!userData.lastname || userData.lastname.trim().length < 2) {
         throw new Error('El apellido debe tener al menos 2 caracteres')
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(userData.email)) {
         throw new Error('Email inválido')
      }

      if (!['admin', 'instructor'].includes(userData.role)) {
         throw new Error('Rol inválido')
      }
   }
}
