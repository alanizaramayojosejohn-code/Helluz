// services/student/student.service.ts
import { inject, Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { Student, CreateStudentDto, UpdateStudentDto } from '../../models/student.model'
import { StudentQueryService } from './student-query.service'

@Injectable()
export class StudentService {
   private readonly query = inject(StudentQueryService)

   getStudents(): Observable<Student[]> {
      return this.query.getAll()
   }

   getActiveStudents(): Observable<Student[]> {
      return this.query.getActive()
   }

   getStudentById(id: string): Observable<Student | undefined> {
      return this.query.getById(id)
   }

   getStudentByCi(ci: string): Observable<Student | null> {
      return this.query.getByCi(ci)
   }

   async createStudent(student: CreateStudentDto): Promise<string> {
      try {
         // Validar CI único
         const ciExists = await this.query.checkCiExists(student.ci)
         if (ciExists) {
            throw new Error('Ya existe un estudiante con ese CI')
         }

         // Validar nombre
         if (student.name.trim().length < 2) {
            throw new Error('El nombre debe tener al menos 2 caracteres')
         }

         // Validar apellido
         if (student.lastname.trim().length < 2) {
            throw new Error('El apellido debe tener al menos 2 caracteres')
         }

         // Validar CI
         if (student.ci.trim().length < 5) {
            throw new Error('El CI debe tener al menos 5 caracteres')
         }

         // Validar celular
         if (student.cellphone.trim().length < 8) {
            throw new Error('El celular debe tener al menos 8 dígitos')
         }

         // Validar email si se proporciona
         if (student.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(student.email)) {
               throw new Error('El email no es válido')
            }
         }

         const id = await this.query.create(student)
         return id
      } catch (error) {
         console.error('Error al crear el estudiante', error)
         throw error
      }
   }

   async updateStudent(id: string, student: UpdateStudentDto): Promise<void> {
      try {
         // Validar CI único si se está actualizando
         if (student.ci) {
            const ciExists = await this.query.checkCiExists(student.ci, id)
            if (ciExists) {
               throw new Error('Ya existe un estudiante con ese CI')
            }
         }

         // Validar nombre si se proporciona
         if (student.name !== undefined && student.name.trim().length < 2) {
            throw new Error('El nombre debe tener al menos 2 caracteres')
         }

         // Validar apellido si se proporciona
         if (student.lastname !== undefined && student.lastname.trim().length < 2) {
            throw new Error('El apellido debe tener al menos 2 caracteres')
         }

         // Validar CI si se proporciona
         if (student.ci !== undefined && student.ci.trim().length < 5) {
            throw new Error('El CI debe tener al menos 5 caracteres')
         }

         // Validar celular si se proporciona
         if (student.cellphone !== undefined && student.cellphone.trim().length < 8) {
            throw new Error('El celular debe tener al menos 8 dígitos')
         }

         // Validar email si se proporciona
         if (student.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(student.email)) {
               throw new Error('El email no es válido')
            }
         }

         await this.query.update(id, student)
      } catch (error) {
         console.error('Error al actualizar el estudiante', error)
         throw error
      }
   }

   async deleteStudent(id: string): Promise<void> {
      try {
         await this.query.delete(id)
      } catch (error) {
         console.error('Error al eliminar el estudiante', error)
         throw error
      }
   }

   async toggleStatus(id: string, currentStatus: 'activo' | 'inactivo'): Promise<void> {
      const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo'
      await this.query.update(id, { status: newStatus })
   }
}
