import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { StudentAttendanceService } from './student-attendance.service';
import { StudentAttendanceQueryService } from './student-attendance-query.service';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { ScheduleService } from '../schedule/schedule.service';
import { StudentService } from '../student/student.service';
import { of } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

describe('StudentAttendanceService', () => {
  let service: StudentAttendanceService;
  let queryServiceMock: any;
  let enrollmentServiceMock: any;
  let scheduleServiceMock: any;
  let studentServiceMock: any;

  beforeEach(() => {
    queryServiceMock = {
      getByBranchAndDate: vi.fn().mockReturnValue(of([])),
      checkAlreadyMarkedToday: vi.fn().mockResolvedValue(false),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined)
    };

    enrollmentServiceMock = {
      getActiveEnrollmentsByStudent: vi.fn().mockReturnValue(of([{
        id: 'enrollment1',
        studentId: 'student1',
        remainingSessions: 10,
        allowedDays: [1, 2, 3, 4, 5],
        endDate: Timestamp.fromDate(new Date(Date.now() + 86400000 * 30)),
        usedSessions: 2,
        totalSessions: 12,
        branchId: 'branch1'
      }])),
      incrementUsedSessions: vi.fn().mockResolvedValue(undefined),
      decrementUsedSessions: vi.fn().mockResolvedValue(undefined)
    };

    scheduleServiceMock = {
      getScheduleById: vi.fn().mockReturnValue(of({
        id: 'schedule1',
        branchId: 'branch1',
        day: 'Lunes'
      }))
    };

    studentServiceMock = {
      getStudentByCi: vi.fn().mockReturnValue(of({
        id: 'student1',
        name: 'Juan',
        lastname: 'Pérez',
        ci: '12345678'
      }))
    };

    TestBed.configureTestingModule({
      providers: [
        StudentAttendanceService,
        { provide: StudentAttendanceQueryService, useValue: queryServiceMock },
        { provide: EnrollmentService, useValue: enrollmentServiceMock },
        { provide: ScheduleService, useValue: scheduleServiceMock },
        { provide: StudentService, useValue: studentServiceMock }
      ]
    });

    service = TestBed.inject(StudentAttendanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get attendance stats', async () => {
    // ✅ Cambiado: sin done(), usar async/await
    const mockAttendances = [
      { status: 'presente' },
      { status: 'presente' },
      { status: 'falta' },
      { status: 'permiso' }
    ];

    queryServiceMock.getByBranchAndDate.mockReturnValue(of(mockAttendances));

    // ✅ Usar Promise para manejar el Observable
    const stats = await new Promise((resolve) => {
      service.getAttendanceStats('branch1', new Date()).subscribe(stats => {
        resolve(stats);
      });
    });

    expect((stats as any).total).toBe(4);
    expect((stats as any).presente).toBe(2);
    expect((stats as any).falta).toBe(1);
    expect((stats as any).permiso).toBe(1);
  });

  it('should mark attendance successfully', async () => {
    const request = {
      ci: '12345678'
    };

    const result = await service.markAttendance(request);

    expect(result.success).toBe(true);
    expect(result.studentName).toBe('Juan Pérez');
    expect(studentServiceMock.getStudentByCi).toHaveBeenCalledWith('12345678');
    expect(enrollmentServiceMock.incrementUsedSessions).toHaveBeenCalled();
  });

  it('should throw error when CI not found', async () => {
    studentServiceMock.getStudentByCi.mockReturnValue(of(null));

    const request = {
      ci: '99999999'
    };

    await expect(service.markAttendance(request))
      .rejects.toThrow('CI no encontrado');
  });

  it('should throw error when no active enrollment', async () => {
    enrollmentServiceMock.getActiveEnrollmentsByStudent.mockReturnValue(of([]));

    const request = {
      ci: '12345678'
    };

    await expect(service.markAttendance(request))
      .rejects.toThrow('No tienes una inscripción activa');
  });

  it('should throw error when no sessions remaining', async () => {
    enrollmentServiceMock.getActiveEnrollmentsByStudent.mockReturnValue(of([{
      id: 'enrollment1',
      studentId: 'student1',
      remainingSessions: 0, // ✅ Sin sesiones
      allowedDays: [1, 2, 3, 4, 5],
      endDate: Timestamp.fromDate(new Date(Date.now() + 86400000 * 30)),
      usedSessions: 12,
      totalSessions: 12,
      branchId: 'branch1'
    }]));

    const request = {
      ci: '12345678'
    };

    await expect(service.markAttendance(request))
      .rejects.toThrow('No te quedan sesiones disponibles');
  });

  it('should throw error when already marked today', async () => {
    queryServiceMock.checkAlreadyMarkedToday.mockResolvedValue(true);

    const request = {
      ci: '12345678'
    };

    await expect(service.markAttendance(request))
      .rejects.toThrow('Ya marcaste asistencia hoy');
  });

  it('should update attendance status', async () => {
    await service.updateAttendanceStatus('attendance1', 'falta');

    expect(queryServiceMock.update).toHaveBeenCalledWith('attendance1', { status: 'falta' });
  });

  it('should delete attendance and decrement sessions', async () => {
    await service.deleteAttendance('attendance1', 'enrollment1');

    expect(enrollmentServiceMock.decrementUsedSessions).toHaveBeenCalledWith('enrollment1');
    expect(queryServiceMock.delete).toHaveBeenCalledWith('attendance1');
  });
});