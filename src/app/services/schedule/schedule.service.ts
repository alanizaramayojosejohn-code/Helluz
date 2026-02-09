import { inject, Injectable } from '@angular/core'
import { from, Observable, catchError, throwError } from 'rxjs'
import { Schedule, CreateScheduleDto, UpdateScheduleDto } from '../../models/schedule.model'
import { ScheduleQueryService } from './schedule-query.service'

@Injectable()
export class ScheduleService {
   private query = inject(ScheduleQueryService)

   getSchedules(): Observable<Schedule[]> {
      return this.query.getAll()
   }

   getScheduleById(id: string): Observable<Schedule | undefined> {
      return this.query.getById(id)
   }

   getSchedulesByBranch(branchId: string): Observable<Schedule[]> {
      return this.query.getByBranch(branchId)
   }

   getSchedulesByDay(branchId: string, day: string): Observable<Schedule[]> {
      return this.query.getByDay(branchId, day)
   }

   checkTimeConflict$(
      branchId: string,
      day: string,
      startTime: string,
      endTime: string,
      excludeId?: string
   ): Observable<boolean> {
      return from(this.query.checkTimeConflict(branchId, day, startTime, endTime, excludeId))
   }

   async addSchedule(schedule: CreateScheduleDto): Promise<string> {
      try {
         // Validar conflicto de horarios
         const hasConflict = await this.query.checkTimeConflict(
            schedule.branchId,
            schedule.day,
            schedule.startTime,
            schedule.endTime
         )

         if (hasConflict) {
            throw new Error('Ya existe un horario en ese rango de tiempo')
         }

         // Validar que la hora de fin sea mayor que la de inicio
         if (!this.isValidTimeRange(schedule.startTime, schedule.endTime)) {
            throw new Error('La hora de fin debe ser posterior a la hora de inicio')
         }

         const id = await this.query.create(schedule)
         return id
      } catch (error) {
         console.error('Error al crear el horario', error)
         throw error
      }
   }

   async updateSchedule(id: string, schedule: UpdateScheduleDto): Promise<void> {
      try {
         // Si se actualizan los horarios, validar conflictos
         if (schedule.branchId && schedule.day && schedule.startTime && schedule.endTime) {
            const hasConflict = await this.query.checkTimeConflict(
               schedule.branchId,
               schedule.day,
               schedule.startTime,
               schedule.endTime,
               id
            )

            if (hasConflict) {
               throw new Error('Ya existe un horario en ese rango de tiempo')
            }

            if (!this.isValidTimeRange(schedule.startTime, schedule.endTime)) {
               throw new Error('La hora de fin debe ser posterior a la hora de inicio')
            }
         }

         await this.query.update(id, schedule)
      } catch (error) {
         console.error('Error al actualizar el horario', error)
         throw error
      }
   }

   async deleteSchedule(id: string): Promise<void> {
      try {
         await this.query.softDelete(id)
      } catch (error) {
         console.error('Error al eliminar el horario')
         throw error
      }
   }

   async permanentDeleteSchedule(id: string): Promise<void> {
      try {
         await this.query.delete(id)
      } catch (error) {
         console.error('Error al eliminar permanentemente el horario')
         throw error
      }
   }

   private isValidTimeRange(startTime: string, endTime: string): boolean {
      const [startHour, startMinute] = startTime.split(':').map(Number)
      const [endHour, endMinute] = endTime.split(':').map(Number)

      const startMinutes = startHour * 60 + startMinute
      const endMinutes = endHour * 60 + endMinute

      return endMinutes > startMinutes
   }
}
