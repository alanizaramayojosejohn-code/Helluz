import { Enrollment } from './../../../../../models/enrollment.model'
// pages/memberships/container/component.ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core'
import { MembershipQueryService } from '../../../../../services/membership/membership-query.service'
import { MembershipService } from '../../../../../services/membership/membership.service'
import { EnrollmentDetail } from '../components/detail/container/component'
import { EnrollmentForm } from '../components/form/container/component'
import { EnrollmentList } from '../components/list/container/component'
import { EnrollmentQueryService } from '../../../../../services/enrollment/enrollment-query.service'
import { EnrollmentService } from '../../../../../services/enrollment/enrollment.service'
import { BranchService } from '../../../../../services/branch/branch.service'
import { QueryService } from '../../../../../services/branch/query.service'
import { StudentQueryService } from '../../../../../services/student/student-query.service'
import { StudentService } from '../../../../../services/student/student.service'
import { AttendanceService } from '../../../../../services/attendance/attendance.service'
import { AttendanceQueryService } from '../../../../../services/attendance/attendance-query.service'
import { ScheduleQueryService } from '../../../../../services/schedule/schedule-query.service'
import { ScheduleService } from '../../../../../services/schedule/schedule.service'

type View = 'list' | 'form' | 'detail'

@Component({
   selector: 'x-enrollment-container',
   imports: [EnrollmentDetail, EnrollmentForm, EnrollmentList],
   providers: [
      EnrollmentQueryService,
      EnrollmentService,
      BranchService,
      QueryService,
      StudentQueryService,
      StudentService,
      MembershipService,
      MembershipQueryService,
      AttendanceService,
      AttendanceQueryService,
      ScheduleQueryService, ScheduleService
   ],
   templateUrl: './component.html',
   changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EnrollmentsComponent {
   currentView = signal<View>('list')
   selectedEnrollmentId = signal<string | null>(null)
   isEditMode = signal<boolean>(false)

   showList(): void {
      this.currentView.set('list')
      this.selectedEnrollmentId.set(null)
      this.isEditMode.set(false)
   }

   showForm(enrollmentId: string | null = null): void {
      this.currentView.set('form')
      this.selectedEnrollmentId.set(enrollmentId)
      this.isEditMode.set(!!enrollmentId)
   }

   showDetail(enrollmentId: string): void {
      this.currentView.set('detail')
      this.selectedEnrollmentId.set(enrollmentId)
   }
}
