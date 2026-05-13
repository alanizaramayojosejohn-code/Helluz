import { Component, DestroyRef, inject, input, OnInit, output, signal, computed } from '@angular/core'
import { DatePipe, UpperCasePipe } from '@angular/common'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { EnrollmentService } from '../../../../../../../services/enrollment/enrollment.service'
import { AttendanceService } from '../../../../../../../services/attendance/attendance.service'
import { Enrollment } from '../../../../../../../models/enrollment.model'
import { Attendance } from '../../../../../../../models/attendance.model'
import { ConfirmDialogService } from '../../../../../../../../shared/services/confirm-dialog.service'

@Component({
   selector: 'x-enrollment-detail',
   standalone: true,
   imports: [DatePipe, UpperCasePipe],
   templateUrl: './component.html',
})
export class EnrollmentDetail implements OnInit {
   private readonly enrollmentService = inject(EnrollmentService)
   private readonly attendanceService = inject(AttendanceService)
   private readonly confirmDialog = inject(ConfirmDialogService)
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
      if (!enr || !enr.totalSessions) return 0
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

   onEdit(): void {
      this.edit.emit(this.enrollmentId())
   }

   onBack(): void {
      this.back.emit()
   }

   async onCancel(): Promise<void> {
      const enrollment = this.enrollment()
      if (!enrollment) return

      this.confirmDialog
         .confirm({
            title: '¿Cancelar inscripción?',
            message: `Se cancelará la inscripción de ${enrollment.studentName}. Esta acción no se puede deshacer.`,
            confirmText: 'Cancelar inscripción',
            cancelText: 'Volver',
            tone: 'danger',
            confirmIcon: 'cancel',
         })
         .subscribe(async (confirmed) => {
            if (!confirmed) return
            this.isCanceling.set(true)
            try {
               await this.enrollmentService.cancelEnrollment(this.enrollmentId())
               this.back.emit()
            } catch (error) {
               this.errorMessage.set('Error al cancelar inscripción')
               this.isCanceling.set(false)
            }
         })
   }

   getInitials(name?: string): string {
      if (!name) return '?'
      const parts = name.trim().split(/\s+/)
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
   }

   getAllowedDaysText(days: number[] | undefined): string {
      if (!days?.length) return '—'
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      return days.map((d) => dayNames[d]).join(', ')
   }

   isStatusActive(status: string | undefined): boolean {
      return status === 'activa'
   }

   getStatusLabel(status: string | undefined): string {
      const labels: Record<string, string> = {
         activa: 'Activa',
         vencida: 'Vencida',
         cancelada: 'Cancelada',
         completada: 'Completada',
      }
      return labels[status ?? ''] || (status ?? '—')
   }
}
