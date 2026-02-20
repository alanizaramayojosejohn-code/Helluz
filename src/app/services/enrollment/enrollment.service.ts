import { inject, Injectable } from '@angular/core'
import { from, Observable, catchError, throwError, map, combineLatest, firstValueFrom } from 'rxjs'
import { Enrollment, CreateEnrollmentDto, UpdateEnrollmentDto } from '../../models/enrollment.model'
import { EnrollmentQueryService } from './enrollment-query.service'
import { v7 as uuidv7 } from 'uuid'
import { Timestamp } from '@angular/fire/firestore'

@Injectable()
export class EnrollmentService {
   private query = inject(EnrollmentQueryService)

   getEnrollments(): Observable<Enrollment[]> {
      return this.query.getAll()
   }

   getEnrollmentById(id: string): Observable<Enrollment | undefined> {
      return this.query.getById(id)
   }

   getEnrollmentsByStudent(studentId: string): Observable<Enrollment[]> {
      return this.query.getByStudent(studentId)
   }

   getActiveEnrollmentsByStudent(studentId: string): Observable<Enrollment[]> {
      return this.query.getActiveByStudent(studentId)
   }

   getEnrollmentsByBranch(branchId: string): Observable<Enrollment[]> {
      return this.query.getByBranch(branchId)
   }

   getExpiringEnrollments(days: number = 7): Observable<Enrollment[]> {
      return this.query.getExpiring(days)
   }

   async addEnrollment(enrollment: CreateEnrollmentDto): Promise<string> {
      try {
         const id = uuidv7()

         const activeEnrollments = await this.getActiveEnrollmentsByStudentPromise(enrollment.studentId)

         const hasActiveInBranch = activeEnrollments.some(
            (e) => e.branchId === enrollment.branchId && e.status === 'activa'
         )

         if (hasActiveInBranch) {
            throw new Error('El alumno ya tiene una inscripción activa en esta sucursal')
         }

         await this.query.create(id, {
            ...enrollment,
            id,
         })

         return id
      } catch (error) {
         console.error('Error al crear la inscripción', error)
         throw error
      }
   }

   async updateEnrollment(id: string, enrollment: UpdateEnrollmentDto): Promise<void> {
      try {
         await this.query.update(id, enrollment)
      } catch (error) {
         console.error('Error al actualizar la inscripción', error)
         throw error
      }
   }

   async cancelEnrollment(id: string): Promise<void> {
      try {
         await this.query.cancel(id)
      } catch (error) {
         console.error('Error al cancelar la inscripción')
         throw error
      }
   }

   async incrementUsedSessions(enrollmentId: string): Promise<void> {
      try {
         if (!enrollmentId) {
            throw new Error('ID de inscripción requerido')
         }

         const enrollment = await firstValueFrom(this.query.getById(enrollmentId))

         if (!enrollment) {
            throw new Error('Inscripción no encontrada')
         }

         if (enrollment.remainingSessions <= 0) {
            throw new Error('No quedan sesiones disponibles')
         }

         const newUsedSessions = enrollment.usedSessions + 1
         const newRemainingSessions = enrollment.totalSessions - newUsedSessions

         await this.query.update(enrollmentId, {
            usedSessions: newUsedSessions,
            remainingSessions: newRemainingSessions,
            status: newRemainingSessions === 0 ? 'completada' : enrollment.status,
         })

         console.log('✅ Sesiones incrementadas correctamente') // Debug
      } catch (error) {
         console.error('❌ Error al incrementar sesiones usadas:', error)
         throw error
      }
   }
   async checkExpiredEnrollments(): Promise<void> {
      const allEnrollments = await this.query.getAll().toPromise()
      const today = new Date()

      for (const enrollment of allEnrollments || []) {
         if (enrollment.status === 'activa') {
            const endDate = enrollment.endDate.toDate()

            if (endDate < today) {
               await this.query.update(enrollment.id, {
                  status: 'vencida',
               })
            }
         }
      }
   }

   calculateEndDate(startDate: Date, durationDays: number): Date {
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + durationDays)
      return endDate
   }

   private async getActiveEnrollmentsByStudentPromise(studentId: string): Promise<Enrollment[]> {
      return new Promise((resolve, reject) => {
         this.query.getActiveByStudent(studentId).subscribe({
            next: (enrollments) => resolve(enrollments),
            error: (error) => reject(error),
         })
      })
   }

   async decrementUsedSessions(enrollmentId: string): Promise<void> {
      try {
         const enrollment = await firstValueFrom(this.getEnrollmentById(enrollmentId))

         if (!enrollment) {
            throw new Error('Inscripción no encontrada')
         }

         const newUsedSessions = Math.max(0, enrollment.usedSessions - 1)
         const newRemainingSessions = enrollment.totalSessions - newUsedSessions

         await this.query.update(enrollmentId, {
            usedSessions: newUsedSessions,
            remainingSessions: newRemainingSessions,
         })
      } catch (error) {
         console.error('Error al decrementar sesiones usadas:', error)
         throw error
      }
   }

   async updateEnrollmentStatus(
      enrollmentId: string,
      status: 'activa' | 'completada' | 'cancelada' | 'vencida'
   ): Promise<void> {
      try {
         await this.query.update(enrollmentId, { status })
         console.log(`✅ Inscripción ${enrollmentId} marcada como ${status}`)
      } catch (error) {
         console.error('❌ Error al actualizar status de inscripción:', error)
         throw error
      }
   }
}
