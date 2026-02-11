import { inject, Injectable } from '@angular/core';
import { from, Observable, catchError, throwError, map } from 'rxjs';
import { Instructor, CreateInstructorDto, UpdateInstructorDto } from '../../models/instructor.model';
import { InstructorQueryService } from './instructor-query.service';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class InstructorService {
  private query = inject(InstructorQueryService);

  getInstructors(): Observable<Instructor[]> {
    return this.query.getAll();
  }

  getInstructorById(id: string): Observable<Instructor | undefined> {
    return this.query.getById(id);
  }

  getInstructorsByBranch(branchId: string): Observable<Instructor[]> {
    return this.query.getByBranch(branchId);
  }

  getActiveInstructors(): Observable<Instructor[]> {
    return this.query.getActive();
  }

  checkCiExist$(ci: string, excludeId?: string): Observable<boolean> {
    return from(this.query.existByCi(ci, excludeId));
  }

  async addInstructor(instructor: CreateInstructorDto): Promise<string> {
    try {
      const id = uuidv7();
      const normalizedCi = instructor.ci.trim();

      const exist = await this.query.existByCi(normalizedCi);
      if (exist) {
        throw new Error(`La CI "${instructor.ci}" ya está registrada`);
      }

      await this.query.create(id, {
        ...instructor,
        id,
        ci: normalizedCi,
      });

      return id;
    } catch (error) {
      console.error('Error al crear el instructor', error);
      throw error;
    }
  }

  async updateInstructor(id: string, instructor: UpdateInstructorDto): Promise<void> {
    try {
      let updates: Partial<Instructor> = { ...instructor };

      if (instructor.ci) {
        const normalizedCi = instructor.ci.trim();
        const exists = await this.query.existByCi(normalizedCi, id);
        if (exists) {
          throw new Error(`La CI "${instructor.ci}" ya está registrada`);
        }
        updates.ci = normalizedCi;
      }

      await this.query.update(id, updates);
    } catch (error) {
      console.error('Error al actualizar el instructor', error);
      throw error;
    }
  }

  async deleteInstructor(id: string): Promise<void> {
    try {
      await this.query.softDelete(id);
    } catch (error) {
      console.error('Error al eliminar el instructor');
      throw error;
    }
  }

  async permanentDeleteInstructor(id: string): Promise<void> {
    try {
      await this.query.delete(id);
    } catch (error) {
      console.error('Error al eliminar permanentemente el instructor');
      throw error;
    }
  }

  getInstructorFullName(instructor: Instructor): string {
    return `${instructor.name} ${instructor.lastname}`;
  }

  // Agregar este método
getInstructorByCI(ci: string): Observable<Instructor | undefined> {
  return this.query.getByCI(ci).pipe(
    map(instructors => instructors[0] as Instructor | undefined)
  );
}

}
