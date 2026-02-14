import { Component, signal } from '@angular/core'
import { InstructorAttendanceMarkComponent } from '../components/mark/container/component'
import { InstructorAttendanceListComponent } from '../components/list/container/component'
import { InstructorAttendanceQueryService } from '../../../../../services/instructorAttendance/instructor-attendance-query.service'
import { InstructorAttendanceService } from '../../../../../services/instructorAttendance/instructor-attendance.service'
import { EnrollmentQueryService } from '../../../../../services/enrollment/enrollment-query.service'
import { EnrollmentService } from '../../../../../services/enrollment/enrollment.service'
import { ScheduleQueryService } from '../../../../../services/schedule/schedule-query.service'
import { ScheduleService } from '../../../../../services/schedule/schedule.service'
import { InstructorQueryService } from '../../../../../services/instructor/instructor-query.service'
import { InstructorService } from '../../../../../services/instructor/instructor.service'

type ViewType = 'mark' | 'list'

@Component({
   selector: 'x-instructor-attendance-container',
   standalone: true,
   imports: [InstructorAttendanceMarkComponent, InstructorAttendanceListComponent],
   providers: [
      InstructorAttendanceQueryService,
      InstructorAttendanceService,
      InstructorQueryService,
      InstructorService,
      EnrollmentQueryService,
      EnrollmentService,
      ScheduleQueryService,
      ScheduleService,
   ],

   template: `
      <div class="min-h-screen bg-gray-50">
         @switch (currentView()) {
            @case ('mark') {
               <x-instructor-attendance-mark (viewList)="showList()" />
            }
            @case ('list') {
               <x-instructor-attendance-list (backToMark)="showMark()" />
            }
         }
      </div>
   `,
})
export default class InstructorAttendanceContainerComponent {
   currentView = signal<ViewType>('mark')

   showMark(): void {
      this.currentView.set('mark')
   }

   showList(): void {
      this.currentView.set('list')
   }
}
