import { ChangeDetectionStrategy, Component, signal } from '@angular/core'
import { InstructorList } from '../components/list/container/component'
import { InstructorForm } from '../components/form/container/component'
import { InstructorDetail } from '../components/detail/container/component'
import { InstructorQueryService } from '../../../../../services/instructor/instructor-query.service'
import { InstructorService } from '../../../../../services/instructor/instructor.service'
import { BranchService } from '../../../../../services/branch/branch.service'
import { QueryService } from '../../../../../services/branch/query.service'

type View = 'list' | 'form' | 'detail'

@Component({
   selector: 'x-instructors-container',
   imports: [InstructorList, InstructorForm, InstructorDetail],
   providers: [InstructorService, InstructorQueryService, BranchService, QueryService],
   templateUrl: './component.html',
   changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InstructorsComponent {
   currentView = signal<View>('list')
   selectedInstructorId = signal<string | null>(null)
   isEditMode = signal<boolean>(false)

   showList(): void {
      this.currentView.set('list')
      this.selectedInstructorId.set(null)
      this.isEditMode.set(false)
   }

   showForm(instructorId: string | null = null): void {
      this.currentView.set('form')
      this.selectedInstructorId.set(instructorId)
      this.isEditMode.set(!!instructorId)
   }

   showDetail(instructorId: string): void {
      this.currentView.set('detail')
      this.selectedInstructorId.set(instructorId)
   }
}
