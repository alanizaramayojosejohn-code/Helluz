import { Component, inject, input, OnInit, output } from '@angular/core'
import { Router } from '@angular/router'
import { Observable } from 'rxjs'
import { BranchService } from '../../../../../../services/branch/branch.service'
import { Branch } from '../../../../../../models/branch.model'
import { AsyncPipe } from '@angular/common'

@Component({
   selector: 'x-detail',
   imports: [AsyncPipe],
   templateUrl: './detail.html',
   styleUrl: './detail.css',
})
export class Detail implements OnInit {
   private branchService = inject(BranchService)
   private router = inject(Router)
   branchId = input.required<string>()

   back = output<void>()
   edit = output<string>()
   branch$!: Observable<Branch | undefined>

   ngOnInit() {
      this.branch$ = this.branchService.getBranchById(this.branchId())
   }
   onGoBack() {
      this.back.emit()
   }

   onEditBranch(id: string) {
      this.edit.emit(id)
   }

   async deleteBranch(branch: Branch) {
      if (confirm(`¿Eliminar ${branch.name}?`)) {
         await this.branchService.deleteBranch(branch.id!)
         this.router.navigate(['/admin/branch'])
      }
   }
}
