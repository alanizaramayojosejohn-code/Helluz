import { Component, inject, OnInit, output } from '@angular/core'
import { BranchService } from '../../../../../../services/branch/branch.service'
import { Observable } from 'rxjs'
import { Branch } from '../../../../../../models/branch.model'
import { CommonModule } from '@angular/common'

@Component({
   selector: 'x-list',
   imports: [CommonModule],
   templateUrl: './list.html',
   styleUrl: './list.css',
})
export class List implements OnInit {
   private branchService = inject(BranchService)

   branches$!: Observable<Branch[]>

   createBranch = output<void>()
   editBranch = output<string>()
   viewDetail = output<string>()

   ngOnInit() {
      this.loadBranches()
   }

   loadBranches() {
      this.branches$ = this.branchService.getBranches()
   }

   async deleteBranch(branch: Branch) {
      if (confirm(`Eliminar ${branch.name}?`)) {
         await this.branchService.deleteBranch(branch.id!)
      }
   }

   onCreateBranch() {
      this.createBranch.emit()
   }

   onEditBranch(id: string) {
      this.editBranch.emit(id)
   }

   onViewDetail(id: string) {
      this.viewDetail.emit(id)
   }
}
