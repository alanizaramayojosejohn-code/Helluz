import { Component, inject, output, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatTableModule } from '@angular/material/table'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatNativeDateModule } from '@angular/material/core'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { Observable, BehaviorSubject, combineLatest } from 'rxjs'
import { switchMap, map } from 'rxjs/operators'
import { BranchService } from '../../../../../../../services/branch/branch.service'
import { InstructorAttendanceService } from '../../../../../../../services/instructorAttendance/instructor-attendance.service'
import { InstructorAttendance, InstructorAttendanceStats } from '../../../../../../../models/instructorAttendance.model'
import { ConfirmDialogService } from '../../../../../../../../shared/services/confirm-dialog.service'

@Component({
   selector: 'x-instructor-attendance-list',
   standalone: true,
   imports: [
      CommonModule,
      ReactiveFormsModule,
      MatTableModule,
      MatButtonModule,
      MatIconModule,
      MatDatepickerModule,
      MatNativeDateModule,
      MatFormFieldModule,
      MatInputModule,
      MatSelectModule,
      MatDialogModule,
   ],
   templateUrl: './component.html',
})
export default class InstructorAttendanceListComponent implements OnInit {
   private readonly attendanceService = inject(InstructorAttendanceService)
   private readonly branchService = inject(BranchService)
   private readonly dialog = inject(MatDialog)

   backToMark = output<void>()

   displayedColumns: string[] = ['createdAt', 'instructorName', 'schedule', 'punctuality', 'hours', 'status', 'actions']

   private selectedBranchId$ = new BehaviorSubject<string>('')
   private selectedDate$ = new BehaviorSubject<Date>(new Date())
   private selectedStatus$ = new BehaviorSubject<
      'presente' | 'retrasado' | 'falta' | 'permiso' | 'salida-anticipada' | undefined
   >(undefined)

   branches$: Observable<any[]>
   stats$: Observable<InstructorAttendanceStats>
   filteredAttendances$: Observable<InstructorAttendance[]>

   constructor() {
      this.branches$ = this.branchService.getActiveBranches()

      this.stats$ = combineLatest([this.selectedBranchId$, this.selectedDate$]).pipe(
         switchMap(([branchId, date]) => {
            if (!branchId) {
               return new Observable<InstructorAttendanceStats>((observer) => {
                  observer.next({
                     total: 0,
                     presente: 0,
                     retrasado: 0,
                     falta: 0,
                     permiso: 0,
                     salidaAnticipada: 0,
                     totalHours: 0,
                     punctualityRate: 0,
                     attendances: [],
                  })
               })
            }
            return this.attendanceService.getAttendanceStats(branchId, date)
         })
      )

      this.filteredAttendances$ = combineLatest([this.stats$, this.selectedStatus$]).pipe(
         map(([stats, status]) => {
            if (!status) return stats.attendances
            return stats.attendances.filter((a) => a.status === status)
         })
      )
   }

   ngOnInit(): void {
      this.branches$.subscribe((branches) => {
         if (branches.length > 0 && !this.selectedBranchId$.value) {
            this.selectedBranchId$.next(branches[0].id!)
         }
      })
   }

   onBranchChange(branchId: string): void {
      this.selectedBranchId$.next(branchId)
   }

   onDateChange(event: any): void {
      this.selectedDate$.next(event.value)
   }

   onStatusChange(status: 'presente' | 'retrasado' | 'falta' | 'permiso' | 'salida-anticipada' | undefined): void {
      this.selectedStatus$.next(status)
   }

   getStatusClass(status: string): string {
      const classes: Record<string, string> = {
         'presente': 'bg-green-100 text-green-800',
         'retrasado': 'bg-yellow-100 text-yellow-800',
         'falta': 'bg-red-100 text-red-800',
         'permiso': 'bg-blue-100 text-blue-800',
         'salida-anticipada': 'bg-orange-100 text-orange-800',
      }
      return classes[status] || 'bg-gray-100 text-gray-800'
   }

   formatDateTime(timestamp: any): string {
      return timestamp.toDate().toLocaleString('es-BO', {
         day: '2-digit',
         month: '2-digit',
         year: 'numeric',
         hour: '2-digit',
         minute: '2-digit',
      })
   }


   async markDeparture(attendance: InstructorAttendance): Promise<void> {
      if (confirm('¿Marcar salida para este instructor?')) {
         try {
            await this.attendanceService.markDeparture(attendance.id)
         } catch (error: any) {
            alert('Error al marcar salida: ' + error.message)
         }
      }
   }

   private readonly confirmDialog = inject(ConfirmDialogService)

   async deleteAttendance(attendance: InstructorAttendance): Promise<void> {
      this.confirmDialog.confirmDelete(attendance.instructorName, 'la asistencia').subscribe(async (confirmed) => {
         if (confirmed) {
            try {
               await this.attendanceService.deleteAttendance(attendance.id!)
            } catch (error) {
               console.error('Error al eliminar:', error)
            }
         }
      })
   }

   onBack(): void {
      this.backToMark.emit()
   }
}
