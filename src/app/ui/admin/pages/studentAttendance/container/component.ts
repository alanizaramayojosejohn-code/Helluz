import { Component, inject, signal, output, OnInit } from '@angular/core'
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
import { StudentAttendanceService } from '../../../../../services/studentAttendance/student-attendance.service'
import { BranchService } from '../../../../../services/branch/branch.service'
import { StudentAttendance, StudentAttendanceStats } from '../../../../../models/studentattendance.model'
import { StudentAttendanceQueryService } from '../../../../../services/studentAttendance/student-attendance-query.service'
import { QueryService } from '../../../../../services/branch/query.service'
import { EnrollmentQueryService } from '../../../../../services/enrollment/enrollment-query.service'
import { EnrollmentService } from '../../../../../services/enrollment/enrollment.service'
import { ScheduleQueryService } from '../../../../../services/schedule/schedule-query.service'
import { ScheduleService } from '../../../../../services/schedule/schedule.service'
import { StudentQueryService } from '../../../../../services/student/student-query.service'
import { StudentService } from '../../../../../services/student/student.service'

@Component({
   selector: 'x-student-attendance-list',
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
   providers: [
      StudentAttendanceService,
      StudentAttendanceQueryService,
      BranchService,
      QueryService,
      EnrollmentQueryService,
      EnrollmentService,
      ScheduleQueryService,
      ScheduleService,
      StudentQueryService, StudentService
   ],
   templateUrl: './component.html',
})
export default class StudentAttendanceListComponent implements OnInit {
   private readonly attendanceService = inject(StudentAttendanceService)
   private readonly branchService = inject(BranchService)
   private readonly dialog = inject(MatDialog)

   backToMark = output<void>()

   displayedColumns: string[] = ['createdAt', 'studentName', 'sessionInfo', 'status', 'actions']

   private selectedBranchId$ = new BehaviorSubject<string>('')
   private selectedDate$ = new BehaviorSubject<Date>(new Date())
   private selectedStatus$ = new BehaviorSubject<'presente' | 'falta' | 'permiso' | undefined>(undefined)

   branches$: Observable<any[]>
   stats$: Observable<StudentAttendanceStats>
   filteredAttendances$: Observable<StudentAttendance[]>

   constructor() {
      this.branches$ = this.branchService.getActiveBranches()

      // Stats basado en branchId y date
      this.stats$ = combineLatest([this.selectedBranchId$, this.selectedDate$]).pipe(
         switchMap(([branchId, date]) => {
            if (!branchId) {
               return new Observable<StudentAttendanceStats>((observer) => {
                  observer.next({ total: 0, presente: 0, falta: 0, permiso: 0, attendances: [] })
               })
            }
            return this.attendanceService.getAttendanceStats(branchId, date)
         })
      )

      // Attendances filtradas por status
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

   onStatusChange(status: 'presente' | 'falta' | 'permiso' | undefined): void {
      this.selectedStatus$.next(status)
   }

   getStatusClass(status: string): string {
      const classes: Record<string, string> = {
         presente: 'bg-green-100 text-green-800',
         falta: 'bg-red-100 text-red-800',
         permiso: 'bg-yellow-100 text-yellow-800',
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

   openEditDialog(attendance: StudentAttendance): void {
      const dialogRef = this.dialog.open(EditStudentAttendanceDialog, {
         width: '400px',
         data: attendance,
      })

      dialogRef.afterClosed().subscribe((result) => {
         if (result) {
            // La lista se actualiza automáticamente
         }
      })
   }

   async deleteAttendance(attendance: StudentAttendance): Promise<void> {
      if (confirm('¿Estás seguro de eliminar esta asistencia?')) {
         try {
            await this.attendanceService.deleteAttendance(attendance.id, attendance.enrollmentId)
         } catch (error: any) {
            alert('Error al eliminar: ' + error.message)
         }
      }
   }

   onBack(): void {
      this.backToMark.emit()
   }
}

// ==================== DIALOG PARA EDITAR ====================

@Component({
   selector: 'edit-student-attendance-dialog',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatDialogModule],
   providers: [StudentAttendanceService],
   template: `
      <h2 mat-dialog-title>Editar Asistencia</h2>
      <mat-dialog-content>
         <form [formGroup]="form" class="py-4">
            <div class="mb-4">
               <p class="text-sm text-gray-600"
                  >Estudiante: <strong>{{ data.studentName }}</strong></p
               >
               <p class="text-sm text-gray-600"
                  >Sesión: <strong>#{{ data.sessionNumber }}</strong></p
               >
            </div>

            <mat-form-field appearance="outline" class="w-full">
               <mat-label>Estado</mat-label>
               <mat-select formControlName="status">
                  <mat-option value="presente">Presente</mat-option>
                  <mat-option value="falta">Falta</mat-option>
                  <mat-option value="permiso">Permiso</mat-option>
               </mat-select>
            </mat-form-field>
         </form>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
         <button mat-button (click)="onCancel()">Cancelar</button>
         <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!form.valid || isSaving">
            @if (isSaving) {
               Guardando...
            } @else {
               Guardar
            }
         </button>
      </mat-dialog-actions>
   `,
})
export class EditStudentAttendanceDialog {
   private readonly dialogRef = inject(MatDialogRef<EditStudentAttendanceDialog>)
   private readonly attendanceService = inject(StudentAttendanceService)
   readonly data: StudentAttendance = inject(MAT_DIALOG_DATA)
   private readonly fb = inject(FormBuilder)

   form: FormGroup
   isSaving = false

   constructor() {
      this.form = this.fb.group({
         status: [this.data.status, Validators.required],
      })
   }

   async onSave(): Promise<void> {
      if (this.form.valid && !this.isSaving) {
         this.isSaving = true
         try {
            await this.attendanceService.updateAttendanceStatus(this.data.id, this.form.value.status)
            this.dialogRef.close(true)
         } catch (error: any) {
            alert('Error al actualizar: ' + error.message)
            this.isSaving = false
         }
      }
   }

   onCancel(): void {
      this.dialogRef.close()
   }
}
