import { Component, inject, OnInit, output } from '@angular/core'
import { BranchService } from '../../../../../../services/branch/branch.service'
import { Observable } from 'rxjs'
import { Branch } from '../../../../../../models/branch.model'
import { CommonModule } from '@angular/common'
import { MatIcon } from '@angular/material/icon'
import { ConfirmDialogService } from '../../../../../../../shared/services/confirm-dialog.service'

@Component({
   selector: 'x-list',
   imports: [CommonModule, MatIcon],
   templateUrl: './list.html',
   styleUrl: './list.css',
})
export class List implements OnInit {
   private branchService = inject(BranchService)
   private readonly confirmDialog = inject(ConfirmDialogService)
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

   async deleteBranch(branch: Branch): Promise<void> {
      this.confirmDialog.confirmDelete(branch.name, 'la sucursal').subscribe(async (confirmed) => {
         if (confirmed) {
            try {
               await this.branchService.deleteBranch(branch.id!)
               this.loadBranches() // Recargar lista
            } catch (error) {
               console.error('Error al eliminar:', error)
               // Opcional: mostrar mensaje de error
            }
         }
      })
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
