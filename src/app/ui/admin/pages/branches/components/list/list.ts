import { Component, inject, OnInit, output, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Observable } from 'rxjs'
import { MatTooltipModule } from '@angular/material/tooltip'
import { BranchService } from '../../../../../../services/branch/branch.service'
import { Branch } from '../../../../../../models/branch.model'
import { ConfirmDialogService } from '../../../../../../../shared/services/confirm-dialog.service'

type StatusFilter = 'all' | 'activo' | 'inactivo'

@Component({
   selector: 'x-list',
   imports: [CommonModule, FormsModule, MatTooltipModule],
   templateUrl: './list.html',
   styleUrl: './list.css',
})
export class List implements OnInit {
   private branchService = inject(BranchService)
   private readonly confirmDialog = inject(ConfirmDialogService)
   branches$!: Observable<Branch[]>

   statusFilter = signal<StatusFilter>('all')
   searchTerm = signal<string>('')

   filterTabs: { value: StatusFilter; label: string }[] = [
      { value: 'all', label: 'Todas' },
      { value: 'activo', label: 'Activas' },
      { value: 'inactivo', label: 'Inactivas' },
   ]

   createBranch = output<void>()
   editBranch = output<string>()
   viewDetail = output<string>()

   ngOnInit() {
      this.loadBranches()
   }

   loadBranches() {
      this.branches$ = this.branchService.getBranches()
   }

   filterBranches(branches: Branch[]): Branch[] {
      const status = this.statusFilter()
      const search = this.searchTerm().trim().toLowerCase()
      let result = status === 'all' ? branches : branches.filter((b) => b.status === status)
      if (search) {
         result = result.filter(
            (b) => b.name.toLowerCase().includes(search) || b.city.toLowerCase().includes(search),
         )
      }
      return result
   }

   countByStatus(value: StatusFilter, branches: Branch[]): number {
      return value === 'all' ? branches.length : branches.filter((b) => b.status === value).length
   }

   formatCoords(branch: Branch): string {
      const rawLat = branch.latitude as unknown
      const rawLng = branch.longitude as unknown
      if (rawLat == null || rawLng == null || rawLat === '' || rawLng === '') return '—'
      const lat = Number(rawLat)
      const lng = Number(rawLng)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '—'
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
   }

   async deleteBranch(branch: Branch): Promise<void> {
      this.confirmDialog.confirmDelete(branch.name, 'la sucursal').subscribe(async (confirmed) => {
         if (confirmed) {
            try {
               await this.branchService.deleteBranch(branch.id!)
               this.loadBranches()
            } catch (error) {
               console.error('Error al eliminar:', error)
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
