import { Component, DestroyRef, inject, input, OnInit, output, signal, computed } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatChipsModule } from '@angular/material/chips'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatTabsModule } from '@angular/material/tabs'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { DatePipe } from '@angular/common'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { EnrollmentService } from '../../../../../../../services/enrollment/enrollment.service'
import { AttendanceService } from '../../../../../../../services/attendance/attendance.service'
import { Enrollment } from '../../../../../../../models/enrollment.model'
import { Attendance } from '../../../../../../../models/attendance.model'
import { ConfirmDialogComponent } from '../../../../../../../components/shared/confirm-dialog/confirm-dialog.component'

@Component({
   selector: 'x-enrollment-detail',
   standalone: true,
   imports: [
      MatButtonModule,
      MatIconModule,
      MatChipsModule,
      MatProgressSpinnerModule,
      MatTabsModule,
      MatDialogModule,
      DatePipe,
   ],
   templateUrl: './component.html',
})
export class EnrollmentDetail implements OnInit {
   private readonly enrollmentService = inject(EnrollmentService)
   private readonly attendanceService = inject(AttendanceService)
   private readonly dialog = inject(MatDialog)
   private readonly destroyRef = inject(DestroyRef)

   readonly enrollmentId = input.required<string>()
   readonly edit = output<string>()
   readonly back = output<void>()

   readonly enrollment = signal<Enrollment | null>(null)
   readonly attendances = signal<Attendance[]>([])
   readonly isLoading = signal(true)
   readonly errorMessage = signal<string | null>(null)
   readonly isCanceling = signal(false)

   readonly sessionsProgress = computed(() => {
      const enr = this.enrollment()
      if (!enr) return 0
      return (enr.usedSessions / enr.totalSessions) * 100
   })

   readonly daysLeft = computed(() => {
      const enr = this.enrollment()
      if (!enr) return 0

      const today = new Date()
      const endDate = enr.endDate.toDate()
      return Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
   })

   readonly isExpiringSoon = computed(() => {
      const days = this.daysLeft()
      const enr = this.enrollment()
      return enr?.status === 'activa' && days <= 7 && days >= 0
   })

   ngOnInit(): void {
      this.loadEnrollment()
   }

   private loadEnrollment(): void {
      this.isLoading.set(true)
      this.errorMessage.set(null)

      this.enrollmentService
         .getEnrollmentById(this.enrollmentId())
         .pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe({
            next: (enrollment) => {
               if (enrollment) {
                  this.enrollment.set(enrollment)
                  this.loadAttendances(enrollment.id)
               } else {
                  this.errorMessage.set('Inscripción no encontrada')
               }
               this.isLoading.set(false)
            },
            error: () => {
               this.errorMessage.set('Error al cargar inscripción')
               this.isLoading.set(false)
            },
         })
   }

   private loadAttendances(enrollmentId: string): void {
      this.attendanceService
         .getAttendancesByEnrollment(enrollmentId)
         .pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe({
            next: (attendances) => this.attendances.set(attendances),
            error: () => console.error('Error al cargar asistencias'),
         })
   }

   onEdit(): void {
      this.edit.emit(this.enrollmentId())
   }

   onBack(): void {
      this.back.emit()
   }

   async onCancel(): Promise<void> {
      const enrollment = this.enrollment()
      if (!enrollment) return

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
         data: {
            title: 'Cancelar Inscripción',
            message: `¿Estás seguro de cancelar la inscripción de ${enrollment.studentName}?`,
         },
      })

      dialogRef.afterClosed().subscribe(async (result) => {
         if (result) {
            this.isCanceling.set(true)
            try {
               await this.enrollmentService.cancelEnrollment(this.enrollmentId())
               this.back.emit()
            } catch (error) {
               this.errorMessage.set('Error al cancelar inscripción')
               this.isCanceling.set(false)
            }
         }
      })
   }

   getStatusClass(status: string): string {
      const classes: Record<string, string> = {
         activa: 'bg-green-100 text-green-800',
         vencida: 'bg-red-100 text-red-800',
         cancelada: 'bg-gray-100 text-gray-800',
         completada: 'bg-blue-100 text-blue-800',
      }
      return classes[status] || 'bg-gray-100 text-gray-800'
   }

   getPaymentStatusClass(status: string): string {
      const classes: Record<string, string> = {
         Efectivo: 'bg-green-100 text-green-800',
         Qr: 'bg-yellow-100 text-yellow-800',
      }
      return classes[status] || 'bg-gray-100 text-gray-800'
   }

   getAttendanceStatusClass(status: string): string {
      const classes: Record<string, string> = {
         presente: 'bg-green-100 text-green-800',
         retrasado: 'bg-yellow-100 text-yellow-800',
         falta: 'bg-red-100 text-red-800',
         permiso: 'bg-blue-100 text-blue-800',
      }
      return classes[status] || 'bg-gray-100 text-gray-800'
   }

   getAllowedDaysText(days: number[]): string {
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      return days.map((d) => dayNames[d]).join(', ')
   }
}
