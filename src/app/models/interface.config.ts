
// ==================== INTERFACES AUXILIARES ====================

// Para reportes combinados si los necesitas
export interface AttendanceStats {
  studentStats?: {
    totalAttendances: number;
    sessionsUsed: number;
    sessionsRemaining: number;
    attendanceRate: number; // porcentaje
  };

  instructorStats?: {
    totalClasses: number;
    onTimeClasses: number;
    lateClasses: number;
    totalHoursWorked: number;
    totalMinutesLate: number;
    punctualityRate: number; // porcentaje
  };
}

// Para búsquedas y filtros
export interface AttendanceFilters {
  branchId?: string;
  disciplineId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
}

// models/menu-item.model.ts
export interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles?: ('admin' | 'instructor')[];
}
