import { Component, inject, input, OnInit, output } from '@angular/core'
import { Observable } from 'rxjs'
import { BranchService } from '../../../../../../services/branch/branch.service'
import { Branch } from '../../../../../../models/branch.model'
import { AsyncPipe, TitleCasePipe } from '@angular/common'
import { ConfirmDialogService } from '../../../../../../../shared/services/confirm-dialog.service'

@Component({
   selector: 'x-detail',
   imports: [AsyncPipe, TitleCasePipe],
   templateUrl: './detail.html',
   styleUrl: './detail.css',
})
export class Detail implements OnInit {
   private branchService = inject(BranchService)
   private readonly confirmDialog = inject(ConfirmDialogService)
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

   async deleteBranch(branch: Branch): Promise<void> {
      this.confirmDialog.confirmDelete(branch.name, 'la sucursal').subscribe(async (confirmed) => {
         if (confirmed) {
            try {
               await this.branchService.deleteBranch(branch.id!)
               this.back.emit()
            } catch (error) {
               console.error('Error al eliminar:', error)
            }
         }
      })
   }

   getInitials(name: string): string {
      if (!name) return '?'
      const parts = name.trim().split(/\s+/)
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
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

   formatDate(ts: unknown): string {
      if (!ts) return '—'
      const anyTs = ts as { toDate?: () => Date; seconds?: number }
      let date: Date | null = null
      if (typeof anyTs.toDate === 'function') {
         date = anyTs.toDate()
      } else if (typeof anyTs.seconds === 'number') {
         date = new Date(anyTs.seconds * 1000)
      } else if (typeof ts === 'string' || typeof ts === 'number' || ts instanceof Date) {
         date = new Date(ts as string | number | Date)
      }
      if (!date || isNaN(date.getTime())) return '—'
      return date.toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' })
   }
}
