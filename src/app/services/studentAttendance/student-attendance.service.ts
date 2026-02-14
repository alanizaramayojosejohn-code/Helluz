import { inject, Injectable } from '@angular/core';
import { Observable, map, firstValueFrom } from 'rxjs';
import {
  StudentAttendance,
  CreateStudentAttendanceDto,
  StudentAttendanceMarkRequest,
  StudentAttendanceStats
} from '../../models/studentattendance.model';
import { StudentAttendanceQueryService } from './student-attendance-query.service';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { ScheduleService } from '../schedule/schedule.service';
import { StudentService } from '../student/student.service';
import { v7 as uuidv7 } from 'uuid';
import { Timestamp } from '@angular/fire/firestore';

@Injectable()
export class StudentAttendanceService {
  private readonly query = inject(StudentAttendanceQueryService);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly studentService = inject(StudentService);

  // ==================== QUERIES CON FILTROS ====================

  getAttendancesByBranchAndDate(
    branchId: string,
    date: Date = new Date(),
    status?: 'presente' | 'falta' | 'permiso'
  ): Observable<StudentAttendance[]> {
    return this.query.getByBranchAndDate(branchId, date, status);
  }

  // ==================== ESTADÍSTICAS ====================

  getAttendanceStats(
    branchId: string,
    date: Date = new Date()
  ): Observable<StudentAttendanceStats> {
    return this.getAttendancesByBranchAndDate(branchId, date).pipe(
      map(attendances => ({
        total: attendances.length,
        presente: attendances.filter(a => a.status === 'presente').length,
        falta: attendances.filter(a => a.status === 'falta').length,
        permiso: attendances.filter(a => a.status === 'permiso').length,
        attendances: attendances
      }))
    );
  }

  // ==================== MARCAR ASISTENCIA ====================
async markAttendance(request: StudentAttendanceMarkRequest): Promise<{
  success: boolean;
  message: string;
  studentName: string;
  sessionNumber: number;
  remainingSessions: number;
}> {
  try {
    const today = new Date();

    // 1. Buscar estudiante por CI
    const student = await firstValueFrom(this.studentService.getStudentByCi(request.ci));

    if (!student) {
      throw new Error('CI no encontrado. Verifica tu cédula de identidad');
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

    // 4. Validar que no esté vencida
    const endDate = enrollment.endDate.toDate();
    if (endDate < today) {
      throw new Error('Tu membresía ha vencido. Renueva para continuar');
    }

    // 5. Verificar que no haya marcado ya hoy
    const alreadyMarked = await this.query.checkAlreadyMarkedToday(
      student.id!,
      today
    );

    if (alreadyMarked) {
      throw new Error('Ya marcaste asistencia hoy');
    }

    // 6. Calcular número de sesión
    const sessionNumber = enrollment.usedSessions + 1;
    const remainingSessionsAfter = enrollment.remainingSessions - 1;

    // 7. Crear asistencia
    const id = uuidv7();
    const attendanceData: CreateStudentAttendanceDto = {
      studentId: student.id!,
      studentName: `${student.name} ${student.lastname}`,
      enrollmentId: enrollment.id,
      branchId: enrollment.branchId,
      sessionNumber: sessionNumber,
      remainingSessionsAfter: remainingSessionsAfter,
      status: 'presente'
    };

    await this.query.create(id, {
      ...attendanceData,
      id
    } as StudentAttendance);

    // 8. Incrementar sesiones usadas
    await this.enrollmentService.incrementUsedSessions(enrollment.id);

    return {
      success: true,
      message: 'Asistencia registrada exitosamente',
      studentName: `${student.name} ${student.lastname}`,
      sessionNumber: sessionNumber,
      remainingSessions: remainingSessionsAfter
    };

  } catch (error) {
    console.error('Error al marcar asistencia de estudiante:', error);
    throw error;
  }
}

  // ==================== ACTUALIZAR ESTADO ====================

  async updateAttendanceStatus(
    id: string,
    status: 'presente' | 'falta' | 'permiso'
  ): Promise<void> {
    try {
      await this.query.update(id, { status });
    } catch (error) {
      console.error('Error al actualizar estado de asistencia:', error);
      throw error;
    }
  }

  // ==================== ELIMINAR ASISTENCIA ====================

  async deleteAttendance(id: string, enrollmentId: string): Promise<void> {
    try {
      await this.enrollmentService.decrementUsedSessions(enrollmentId);
      await this.query.delete(id);
    } catch (error) {
      console.error('Error al eliminar asistencia:', error);
      throw error;
    }
  }

  // ==================== UTILIDADES ====================

  private getDayNames(days: number[]): string {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days.map(day => dayNames[day]).join(', ');
  }
}
