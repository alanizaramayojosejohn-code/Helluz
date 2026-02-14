// services/user/user.service.ts
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User, CreateUserDto, UpdateUserDto } from '../../models/user.model';
import { UserQueryService } from './user-query.service';
import { AuthService } from '../auth/auth.service';

interface CreateUserInFirestoreDto {
  uid: string; // uid del usuario creado en Firebase Console
  email: string;
  name: string;
  lastname: string;
  role: 'admin' | 'instructor';
  status: 'activo' | 'inactivo';
}

@Injectable()
export class UserService {
  private readonly query = inject(UserQueryService);
  private readonly authService = inject(AuthService);

  getUsers(): Observable<User[]> {
    return this.query.getAll();
  }

  getActiveUsers(): Observable<User[]> {
    return this.query.getActive();
  }

  getInstructors(): Observable<User[]> {
    return this.query.getByRole('instructor');
  }

  getUserById(id: string): Observable<User | undefined> {
    return this.query.getById(id);
  }

  // Crear usuario en Firestore (después de crearlo en Firebase Console)
  async createUserInFirestore(userData: CreateUserInFirestoreDto, currentUserId: string): Promise<void> {
    try {
      // Validar que el usuario actual sea admin
      const isAdmin = await this.authService.isAdmin();
      if (!isAdmin) {
        throw new Error('No tienes permisos para crear usuarios');
      }

      // Validar que el uid no exista ya en Firestore
      const userExists = await this.checkUserExists(userData.uid);
      if (userExists) {
        throw new Error('Este usuario ya está registrado en el sistema');
      }

      // Validar email único
      const emailExists = await this.query.checkEmailExists(userData.email);
      if (emailExists) {
        throw new Error('El email ya está registrado');
      }

      // Validaciones básicas
      this.validateUserData(userData);

      // Crear documento en Firestore
      await this.query.create(userData.uid, {
        email: userData.email,
        name: userData.name,
        lastname: userData.lastname,
        role: userData.role,
        status: userData.status,
        createdBy: currentUserId,
      });
    } catch (error) {
      console.error('Error al crear usuario en Firestore:', error);
      throw error;
    }
  }

  async updateUser(id: string, userData: UpdateUserDto): Promise<void> {
    try {
      // Validar que el usuario actual sea admin
      const isAdmin = await this.authService.isAdmin();
      if (!isAdmin) {
        throw new Error('No tienes permisos para actualizar usuarios');
      }

      // Validaciones básicas
      if (userData.name !== undefined && userData.name.trim().length < 2) {
        throw new Error('El nombre debe tener al menos 2 caracteres');
      }

      if (userData.lastname !== undefined && userData.lastname.trim().length < 2) {
        throw new Error('El apellido debe tener al menos 2 caracteres');
      }

      await this.query.update(id, userData);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      // Validar que el usuario actual sea admin
      const isAdmin = await this.authService.isAdmin();
      if (!isAdmin) {
        throw new Error('No tienes permisos para eliminar usuarios');
      }

      // Solo eliminar de Firestore (el admin debe eliminar de Auth manualmente en Console)
      await this.query.delete(id);
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw error;
    }
  }

  async toggleStatus(id: string, currentStatus: 'activo' | 'inactivo'): Promise<void> {
    const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';
    await this.query.update(id, { status: newStatus });
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await this.authService.sendPasswordReset(email);
    } catch (error) {
      console.error('Error al enviar email de recuperación:', error);
      throw error;
    }
  }

  private async checkUserExists(uid: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.query.getById(uid).subscribe({
        next: (user) => resolve(!!user),
        error: () => resolve(false),
      });
    });
  }

  private validateUserData(userData: CreateUserInFirestoreDto): void {
    if (userData.name.trim().length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }

    if (userData.lastname.trim().length < 2) {
      throw new Error('El apellido debe tener al menos 2 caracteres');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('Email inválido');
    }

    if (!['admin', 'instructor'].includes(userData.role)) {
      throw new Error('Rol inválido');
    }

    if (userData.uid.trim().length === 0) {
      throw new Error('El UID es requerido');
    }
  }
}
