import { inject, Injectable } from '@angular/core'
import { Observable, map, firstValueFrom } from 'rxjs'
import {
   InstructorAttendance,
   CreateInstructorAttendanceDto,
   InstructorAttendanceMarkRequest,
   InstructorAttendanceStats,
} from '../../models/instructorAttendance.model'
import { InstructorAttendanceQueryService } from './instructor-attendance-query.service'
import { ScheduleService } from '../schedule/schedule.service'
import { InstructorService } from '../instructor/instructor.service'
import { v7 as uuidv7 } from 'uuid'
import { Timestamp } from '@angular/fire/firestore'

@Injectable()
export class InstructorAttendanceService {
   private readonly query = inject(InstructorAttendanceQueryService)
   private readonly scheduleService = inject(ScheduleService)
   private readonly instructorService = inject(InstructorService)

   getAttendancesByBranchAndDate(
      branchId: string,
      date: Date = new Date(),
      status?: 'presente' | 'retrasado' | 'falta' | 'permiso' | 'salida-anticipada'
   ): Observable<InstructorAttendance[]> {
      return this.query.getByBranchAndDate(branchId, date, status)
   }

   getAttendanceStats(branchId: string, date: Date = new Date()): Observable<InstructorAttendanceStats> {
      return this.getAttendancesByBranchAndDate(branchId, date).pipe(
         map((attendances) => {
            const totalHours = attendances.reduce((sum, a) => sum + (a.actualHours || a.scheduledHours), 0)

            const onTimeCount = attendances.filter((a) => !a.isLate).length

            return {
               total: attendances.length,
               presente: attendances.filter((a) => a.status === 'presente').length,
               retrasado: attendances.filter((a) => a.status === 'retrasado').length,
               falta: attendances.filter((a) => a.status === 'falta').length,
               permiso: attendances.filter((a) => a.status === 'permiso').length,
               salidaAnticipada: attendances.filter((a) => a.status === 'salida-anticipada').length,
               totalHours: Number(totalHours.toFixed(1)),
               punctualityRate:
                  attendances.length > 0 ? Number(((onTimeCount / attendances.length) * 100).toFixed(0)) : 0,
               attendances: attendances,
            }
         })
      )
   }
   async markArrival(request: InstructorAttendanceMarkRequest): Promise<{
      success: boolean
      message: string
      instructorName: string
      isLate: boolean
      minutesLate: number
   }> {
      try {
         const today = new Date()
         const currentTime = this.getCurrentTime()
         const dayName = this.getDayName(today.getDay())

         const instructor = await firstValueFrom(this.instructorService.getInstructorByCI(request.ci))

         if (!instructor || !instructor.id) {
            throw new Error('CI no encontrado. Verifica tu cédula de identidad')
         }

         if (instructor.status !== 'activo') {
            console.log('CI encontrado')
            throw new Error('Tu cuenta está inactiva. Contacta con administración')
         }

         const schedule = await this.scheduleService.getInstructorScheduleForToday(instructor.id, dayName)

         if (!schedule) {
            throw new Error(`No tienes horarios asignados para hoy (${dayName})`)
         }

         console.log('schedule')
         if (schedule.status !== 'activo') {
            throw new Error('Este horario está inactivo. Contacta con administración')
         }

         const alreadyMarked = await this.query.checkAlreadyMarkedToday(instructor.id, schedule.id!, today)

         if (alreadyMarked) {
            throw new Error('Ya marcaste entrada en esta clase hoy')
         }
         console.log('already marked')

         const { isLate, minutesLate } = this.calculateLateness(schedule.startTime, currentTime)

         const scheduledHours = this.calculateScheduledHours(schedule.startTime, schedule.endTime)

         const id = uuidv7()
         console.log('uuid')
         const attendanceData: CreateInstructorAttendanceDto = {
            instructorId: instructor.id,
            instructorName: `${instructor.name} ${instructor.lastname}`,
            scheduleId: schedule.id!,
            branchId: schedule.branchId,
            expectedStartTime: schedule.startTime,
            expectedEndTime: schedule.endTime,
            actualArrivalTime: currentTime,
            isLate: isLate,
            minutesLate: isLate ? minutesLate : 0,
            scheduledHours: scheduledHours,
            status: isLate ? 'retrasado' : 'presente',
         }

         await this.query.create(id, {
            ...attendanceData,
            id,
         } as InstructorAttendance)

         const lateMessage = isLate ? ` (Retrasado ${minutesLate} minutos)` : ' (A tiempo)'

         return {
            success: true,
            message: `Entrada registrada exitosamente${lateMessage}`,
            instructorName: `${instructor.name} ${instructor.lastname}`,
            isLate: isLate,
            minutesLate: minutesLate,
         }
      } catch (error) {
         console.error('❌ Error al marcar entrada de instructor:', error)
         throw error
      }
   }

   private getDayName(dayNumber: number): string {
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      return days[dayNumber]
   }

   async markDeparture(
      attendanceId: string,
      departureTime?: string
   ): Promise<{
      success: boolean
      message: string
      actualHours: number
   }> {
      try {
         const attendance = await firstValueFrom(this.query.getById(attendanceId))

         if (!attendance) {
            throw new Error('Asistencia no encontrada')
         }

         if (attendance.actualDepartureTime) {
            throw new Error('Ya marcaste salida en esta clase')
         }

         const actualDepartureTime = departureTime || this.getCurrentTime()
         const actualHours = this.calculateActualHours(attendance.actualArrivalTime, actualDepartureTime)
         const leftEarly = this.checkLeftEarly(attendance.expectedEndTime, actualDepartureTime)

         const status = leftEarly ? 'salida-anticipada' : attendance.status

         await this.query.update(attendanceId, {
            actualDepartureTime,
            actualHours,
            status,
         })

         return {
            success: true,
            message: leftEarly ? 'Salida registrada (anticipada)' : 'Salida registrada exitosamente',
            actualHours: actualHours,
         }
      } catch (error) {
         console.error('Error al marcar salida de instructor:', error)
         throw error
      }
   }

   async updateAttendanceStatus(
      id: string,
      status: 'presente' | 'retrasado' | 'falta' | 'permiso' | 'salida-anticipada'
   ): Promise<void> {
      try {
         await this.query.update(id, { status })
      } catch (error) {
         console.error('Error al actualizar estado de asistencia:', error)
         throw error
      }
   }

   async deleteAttendance(id: string): Promise<void> {
      try {
         await this.query.delete(id)
      } catch (error) {
         console.error('Error al eliminar asistencia:', error)
         throw error
      }
   }

   private getCurrentTime(): string {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
   }

   private calculateLateness(expectedTime: string, actualTime: string): { isLate: boolean; minutesLate: number } {
      const [expectedHour, expectedMin] = expectedTime.split(':').map(Number)
      const [actualHour, actualMin] = actualTime.split(':').map(Number)

      const expectedMinutes = expectedHour * 60 + expectedMin
      const actualMinutes = actualHour * 60 + actualMin

      const diff = actualMinutes - expectedMinutes

      return {
         isLate: diff > 5,
         minutesLate: diff > 0 ? diff : 0,
      }
   }

   private calculateScheduledHours(startTime: string, endTime: string): number {
      const [startHour, startMin] = startTime.split(':').map(Number)
      const [endHour, endMin] = endTime.split(':').map(Number)

      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin

      return Number(((endMinutes - startMinutes) / 60).toFixed(2))
   }

   private calculateActualHours(arrivalTime: string, departureTime: string): number {
      const [arrivalHour, arrivalMin] = arrivalTime.split(':').map(Number)
      const [departureHour, departureMin] = departureTime.split(':').map(Number)

      const arrivalMinutes = arrivalHour * 60 + arrivalMin
      const departureMinutes = departureHour * 60 + departureMin

      return Number(((departureMinutes - arrivalMinutes) / 60).toFixed(2))
   }

   private checkLeftEarly(expectedEndTime: string, actualDepartureTime: string): boolean {
      const [expectedHour, expectedMin] = expectedEndTime.split(':').map(Number)
      const [actualHour, actualMin] = actualDepartureTime.split(':').map(Number)

      const expectedMinutes = expectedHour * 60 + expectedMin
      const actualMinutes = actualHour * 60 + actualMin

      return actualMinutes < expectedMinutes - 5
   }
}
