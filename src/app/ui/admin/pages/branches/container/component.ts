import { ChangeDetectionStrategy, Component, signal } from '@angular/core'
import { List } from '../components/list/list'
import { Detail } from '../components/detail/detail'
import { BranchForm } from '../components/form/form'
import { CommonModule } from '@angular/common'
import { BranchService } from '../../../../../services/branch/branch.service'
import { QueryService } from '../../../../../services/branch/query.service'

type View = 'list' | 'form' | 'detail'

@Component({
   selector: 'x-container',
   imports: [CommonModule, List, BranchForm, Detail, BranchForm],
   providers: [BranchService,QueryService],
   templateUrl: './component.html',
   changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BranchesComponent {
   currentView = signal<View>('list')
   selectedBranchId = signal<string | null>(null)
   isEditMode = signal<boolean>(false)

   showList() {
      this.currentView.set('list')
      this.selectedBranchId.set(null)
      this.isEditMode.set(false)
   }

   showForm(branchId: string | null = null) {
      this.currentView.set('form')
      this.selectedBranchId.set(branchId)
      this.isEditMode.set(!!branchId)
   }

   showDetail(branchId: string) {
      this.currentView.set('detail')
      this.selectedBranchId.set(branchId)
   }
}
