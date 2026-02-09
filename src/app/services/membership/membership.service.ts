// services/membership/membership.service.ts
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Membership, CreateMembershipDto, UpdateMembershipDto } from '../../models/membership.model';
import { MembershipQueryService } from './membership-query.service';

@Injectable()
export class MembershipService {
  private readonly query = inject(MembershipQueryService);

  getMemberships(): Observable<Membership[]> {
    return this.query.getAll();
  }

  getActiveMemberships(): Observable<Membership[]> {
    return this.query.getActive();
  }

  getMembershipById(id: string): Observable<Membership | undefined> {
    return this.query.getById(id);
  }

  async createMembership(membership: CreateMembershipDto): Promise<string> {
    try {
      // Validar nombre único
      const nameExists = await this.query.checkNameExists(membership.name);
      if (nameExists) {
        throw new Error('Ya existe una membresía con ese nombre');
      }

      // Validar duración
      if (membership.durationDays <= 0) {
        throw new Error('La duración debe ser mayor a 0 días');
      }

      // Validar sesiones
      if (membership.totalSessions <= 0) {
        throw new Error('El total de sesiones debe ser mayor a 0');
      }

      // Validar días permitidos
      if (!membership.allowedDays || membership.allowedDays.length === 0) {
        throw new Error('Debe seleccionar al menos un día permitido');
      }

      // Validar días (0-6)
      const invalidDays = membership.allowedDays.filter(day => day < 0 || day > 6);
      if (invalidDays.length > 0) {
        throw new Error('Los días permitidos deben estar entre 0 (Domingo) y 6 (Sábado)');
      }

      // Validar costo
      if (membership.cost <= 0) {
        throw new Error('El costo debe ser mayor a 0');
      }

      const id = await this.query.create(membership);
      return id;
    } catch (error) {
      console.error('Error al crear la membresía', error);
      throw error;
    }
  }

  async updateMembership(id: string, membership: UpdateMembershipDto): Promise<void> {
    try {
      // Validar nombre único si se está actualizando
      if (membership.name) {
        const nameExists = await this.query.checkNameExists(membership.name, id);
        if (nameExists) {
          throw new Error('Ya existe una membresía con ese nombre');
        }
      }

      // Validar duración si se proporciona
      if (membership.durationDays !== undefined && membership.durationDays <= 0) {
        throw new Error('La duración debe ser mayor a 0 días');
      }

      // Validar sesiones si se proporciona
      if (membership.totalSessions !== undefined && membership.totalSessions <= 0) {
        throw new Error('El total de sesiones debe ser mayor a 0');
      }

      // Validar días permitidos si se proporciona
      if (membership.allowedDays !== undefined) {
        if (membership.allowedDays.length === 0) {
          throw new Error('Debe seleccionar al menos un día permitido');
        }
        const invalidDays = membership.allowedDays.filter(day => day < 0 || day > 6);
        if (invalidDays.length > 0) {
          throw new Error('Los días permitidos deben estar entre 0 (Domingo) y 6 (Sábado)');
        }
      }

      // Validar costo si se proporciona
      if (membership.cost !== undefined && membership.cost <= 0) {
        throw new Error('El costo debe ser mayor a 0');
      }

      await this.query.update(id, membership);
    } catch (error) {
      console.error('Error al actualizar la membresía', error);
      throw error;
    }
  }

  async deleteMembership(id: string): Promise<void> {
    try {
      // Aquí podrías validar si la membresía está en uso antes de eliminar
      await this.query.delete(id);
    } catch (error) {
      console.error('Error al eliminar la membresía', error);
      throw error;
    }
  }

  async toggleStatus(id: string, currentStatus: 'activo' | 'inactivo'): Promise<void> {
    const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';
    await this.query.update(id, { status: newStatus });
  }
}
