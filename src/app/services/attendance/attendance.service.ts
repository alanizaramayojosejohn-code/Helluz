import { inject, Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { Attendance, CreateAttendanceDto, AttendanceMarkRequest } from '../../models/attendance.model';
import { AttendanceQueryService } from './attendance-query.service';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { ScheduleService } from '../schedule/schedule.service';
import { StudentService } from '../student/student.service';
import { InstructorService } from '../instructor/instructor.service';
import { v7 as uuidv7 } from 'uuid';
import { Timestamp } from '@angular/fire/firestore';

@Injectable()
export class AttendanceService {
  private readonly query = inject(AttendanceQueryService);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly studentService = inject(StudentService);
  private readonly instructorService = inject(InstructorService);

  getAttendances(): Observable<Attendance[]> {
    return this.query.getAll();
  }

  getAttendanceById(id: string): Observable<Attendance | undefined> {
    return this.query.getById(id);
  }

  getAttendancesByStudent(studentId: string): Observable<Attendance[]> {
    return this.query.getByStudent(studentId);
  }

  getAttendancesByEnrollment(enrollmentId: string): Observable<Attendance[]> {
    return this.query.getByEnrollment(enrollmentId);
  }

  getAttendancesBySchedule(scheduleId: string, date: Date): Observable<Attendance[]> {
    return this.query.getBySchedule(scheduleId, date);
  }

  getAttendancesByBranchAndDate(branchId: string, date: Date): Observable<Attendance[]> {
    return this.query.getByBranchAndDate(branchId, date);
  }

  async markAttendance(request: AttendanceMarkRequest): Promise<{ success: boolean; message: string; personName?: string }> {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay();

      // 1. Buscar si es alumno o instructor
      const student = await firstValueFrom(this.studentService.getStudentByCi(request.ci));
      const instructor = await firstValueFrom(this.instructorService.getInstructorByCI(request.ci));

      if (!student && !instructor) {
        throw new Error('CI no encontrado. Verifica tu cédula');
      }

      // 2. Obtener información del horario
      const schedule = await firstValueFrom(this.scheduleService.getScheduleById(request.scheduleId));

      if (!schedule) {
        throw new Error('Horario no encontrado');
      }

      // 3. Marcar según tipo de persona
      if (student) {
        return await this.markStudentAttendance(student, schedule, today, dayOfWeek);
      } else {
        return await this.markInstructorAttendance(instructor!, schedule, today, dayOfWeek);
      }

    } catch (error) {
      console.error('Error al marcar asistencia', error);
      throw error;
    }
  }

  private async markStudentAttendance(
    student: any,
    schedule: any,
    today: Date,
    dayOfWeek: number
  ): Promise<{ success: boolean; message: string; personName: string }> {

    // 1. Verificar que no haya marcado ya hoy
    const alreadyMarked = await this.query.checkAlreadyMarked(
      student.id!,
      schedule.id!,
      today
    );

    if (alreadyMarked) {
      throw new Error('Ya marcaste asistencia en esta clase hoy');
    }

    // 2. Obtener inscripción activa
    const enrollments = await firstValueFrom(
      this.enrollmentService.getActiveEnrollmentsByStudent(student.id!)
    );

    if (!enrollments || enrollments.length === 0) {
      throw new Error('No tienes una inscripción activa');
    }

    const enrollment = enrollments[0];

    // 3. Validar sesiones disponibles
    if (enrollment.remainingSessions <= 0) {
      throw new Error('No te quedan sesiones disponibles. Renueva tu membresía');
    }

    // 4. Validar día permitido
    if (!enrollment.allowedDays.includes(dayOfWeek)) {
      throw new Error('Tu membresía no permite asistir hoy');
    }

    // 5. Validar que no esté vencida
    const endDate = enrollment.endDate.toDate();
    if (endDate < today) {
      throw new Error('Tu membresía ha vencido. Renueva para continuar');
    }

    // 6. Crear asistencia
    const id = uuidv7();
    const attendanceData: CreateAttendanceDto = {
      personType: 'student',
      personId: student.id!,
      personName: `${student.name} ${student.lastname}`,
      enrollmentId: enrollment.id,
      scheduleId: schedule.id!,
      branchId: schedule.branchId,
      branchName: schedule.branchName || '',
      disciplineId: schedule.discipline,
      disciplineName: schedule.discipline,
      date: Timestamp.fromDate(today),
      dayOfWeek: dayOfWeek,
      status: 'presente'
    };

    await this.query.create(id, {
      ...attendanceData,
      id
    });

    // 7. Incrementar sesiones usadas
    await this.enrollmentService.incrementUsedSessions(enrollment.id);

    return {
      success: true,
      message: 'Asistencia registrada exitosamente',
      personName: `${student.name} ${student.lastname}`
    };
  }

  private async markInstructorAttendance(
    instructor: any,
    schedule: any,
    today: Date,
    dayOfWeek: number
  ): Promise<{ success: boolean; message: string; personName: string }> {

    // 1. Verificar que el instructor esté asignado a este horario
    if (schedule.instructorId !== instructor.id) {
      throw new Error('No estás asignado a este horario');
    }

    // 2. Verificar que no haya marcado ya hoy
    const alreadyMarked = await this.query.checkAlreadyMarked(
      instructor.id,
      schedule.id!,
      today
    );

    if (alreadyMarked) {
      throw new Error('Ya marcaste asistencia en esta clase hoy');
    }

    // 3. Calcular si llegó tarde
    const expectedStartTime = schedule.startTime; // "18:00"
    const actualArrivalTime = this.getCurrentTime(); // "18:15"

    const { isLate, minutesLate } = this.calculateLateness(expectedStartTime, actualArrivalTime);

    // 4. Crear asistencia
    const id = uuidv7();
    const attendanceData: CreateAttendanceDto = {
      personType: 'instructor',
      personId: instructor.id,
      personName: `${instructor.name} ${instructor.lastname}`,
      scheduleId: schedule.id!,
      branchId: schedule.branchId,
      branchName: schedule.branchName || '',
      disciplineId: schedule.discipline,
      disciplineName: schedule.discipline,
      date: Timestamp.fromDate(today),
      dayOfWeek: dayOfWeek,
      status: isLate ? 'retrasado' : 'presente',

      // Campos específicos para instructores
      expectedStartTime,
      actualArrivalTime,
      isLate,
      minutesLate: isLate ? minutesLate : 0
    };

    await this.query.create(id, {
      ...attendanceData,
      id
    });

    const lateMessage = isLate
      ? ` (Retrasado ${minutesLate} minutos)`
      : ' (A tiempo)';

    return {
      success: true,
      message: `Asistencia registrada exitosamente${lateMessage}`,
      personName: `${instructor.name} ${instructor.lastname}`
    };
  }

  private getCurrentTime(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private calculateLateness(expectedTime: string, actualTime: string): { isLate: boolean; minutesLate: number } {
    const [expectedHour, expectedMin] = expectedTime.split(':').map(Number);
    const [actualHour, actualMin] = actualTime.split(':').map(Number);

    const expectedMinutes = expectedHour * 60 + expectedMin;
    const actualMinutes = actualHour * 60 + actualMin;

    const diff = actualMinutes - expectedMinutes;

    return {
      isLate: diff > 5, // Tolerancia de 5 minutos
      minutesLate: diff > 0 ? diff : 0
    };
  }

  async deleteAttendance(id: string): Promise<void> {
    try {
      await this.query.delete(id);
    } catch (error) {
      console.error('Error al eliminar asistencia');
      throw error;
    }
  }
}
