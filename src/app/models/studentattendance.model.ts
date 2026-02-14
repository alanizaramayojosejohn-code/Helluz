import { Timestamp } from '@angular/fire/firestore';

export interface StudentAttendance {
  id: string;
  studentId: string;
  studentName: string;
  enrollmentId: string;
  branchId: string;
  sessionNumber: number;
  remainingSessionsAfter: number;
  status: 'presente' | 'falta' | 'permiso';
  createdAt: Timestamp;
}

export type CreateStudentAttendanceDto = Omit<StudentAttendance, 'id' | 'createdAt'>;

export interface StudentAttendanceMarkRequest {
  ci: string;
}

export interface StudentAttendanceStats {
  total: number;
  presente: number;
  falta: number;
  permiso: number;
  attendances: StudentAttendance[];
}
