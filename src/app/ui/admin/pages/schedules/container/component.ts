import { ChangeDetectionStrategy, Component, signal } from '@angular/core'
import { ScheduleService } from '../../../../../services/schedule/schedule.service'
import { ScheduleQueryService } from '../../../../../services/schedule/schedule-query.service'
import { BranchService } from '../../../../../services/branch/branch.service'
import { QueryService } from '../../../../../services/branch/query.service'
import { InstructorService } from '../../../../../services/instructor/instructor.service'
import { InstructorQueryService } from '../../../../../services/instructor/instructor-query.service'
import { SeedService } from '../../../../../services/seed/seed.service'
import { ScheduleList } from '../components/list/container/component'
import { ScheduleDetail } from '../components/detail/container/component'
import { ScheduleForm } from '../components/form/container/component'

type View = 'list' | 'form' | 'detail'

@Component({
   selector: 'x-schedules-container',
   imports: [ScheduleList, ScheduleForm, ScheduleDetail],
   providers: [
      ScheduleService,
      ScheduleQueryService,
      BranchService,
      QueryService,
      InstructorService,
      InstructorQueryService,
      SeedService,
   ],
   templateUrl: './component.html',
   changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SchedulesComponent {
   currentView = signal<View>('list')
   selectedScheduleId = signal<string | null>(null)
   isEditMode = signal<boolean>(false)

   showList(): void {
      this.currentView.set('list')
      this.selectedScheduleId.set(null)
      this.isEditMode.set(false)
   }

   showForm(scheduleId: string | null = null): void {
      this.currentView.set('form')
      this.selectedScheduleId.set(scheduleId)
      this.isEditMode.set(!!scheduleId)
   }

   showDetail(scheduleId: string): void {
      this.currentView.set('detail')
      this.selectedScheduleId.set(scheduleId)
   }
}
