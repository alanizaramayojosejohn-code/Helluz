import { Component, signal } from '@angular/core';
import { StudentAttendanceMarkComponent } from '../components/mark/container/component';
import { StudentAttendanceListComponent } from '../components/list/container/component';
import { StudentAttendanceQueryService } from '../../../../../services/studentAttendance/student-attendance-query.service';
import { StudentAttendanceService } from '../../../../../services/studentAttendance/student-attendance.service';
import { StudentQueryService } from '../../../../../services/student/student-query.service';
import { StudentService } from '../../../../../services/student/student.service';
import { EnrollmentQueryService } from '../../../../../services/enrollment/enrollment-query.service';
import { EnrollmentService } from '../../../../../services/enrollment/enrollment.service';
import { ScheduleQueryService } from '../../../../../services/schedule/schedule-query.service';
import { ScheduleService } from '../../../../../services/schedule/schedule.service';

type ViewType = 'mark' | 'list';

@Component({
  selector: 'x-student-attendance-container',
  standalone: true,
  imports: [
    StudentAttendanceMarkComponent,
    StudentAttendanceListComponent
  ],
  providers:[StudentAttendanceQueryService, StudentAttendanceService, StudentQueryService, StudentService, EnrollmentQueryService, EnrollmentService, ScheduleQueryService, ScheduleService, ],
  template: `
    <div class="min-h-screen bg-gray-50">
      @switch (currentView()) {
        @case ('mark') {
          <x-student-attendance-mark
            (viewList)="showList()"
          />
        }
        @case ('list') {
          <x-student-attendance-list
            (backToMark)="showMark()"
          />
        }
      }
    </div>
  `
})
export default class StudentAttendanceContainerComponent {
  currentView = signal<ViewType>('mark');

  showMark(): void {
    this.currentView.set('mark');
  }

  showList(): void {
    this.currentView.set('list');
  }
}
