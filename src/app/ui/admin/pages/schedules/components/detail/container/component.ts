import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ScheduleService } from '../../../../../../../services/schedule/schedule.service'
import { Schedule } from '../../../../../../../models/schedule.model'
import { ConfirmDialogService } from '../../../../../../../../shared/services/confirm-dialog.service'

@Component({
   selector: 'x-schedule-detail',
   imports: [],
   templateUrl: './component.html',
})
export class ScheduleDetail implements OnInit {
   private readonly scheduleService = inject(ScheduleService)
   private readonly confirmDialog = inject(ConfirmDialogService)
   private readonly destroyRef = inject(DestroyRef)

   readonly scheduleId = input.required<string>()
   readonly edit = output<string>()
   readonly back = output<void>()

   readonly schedule = signal<Schedule | null>(null)
   readonly isLoading = signal(true)
   readonly errorMessage = signal<string | null>(null)
   readonly isDeleting = signal(false)

   ngOnInit(): void {
      this.loadSchedule()
   }

   private loadSchedule(): void {
      this.isLoading.set(true)
      this.errorMessage.set(null)

      this.scheduleService
         .getScheduleById(this.scheduleId())
         .pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe({
            next: (schedule) => {
               if (schedule) {
                  this.schedule.set(schedule)
               } else {
                  this.errorMessage.set('Horario no encontrado')
               }
               this.isLoading.set(false)
            },
            error: () => {
               this.errorMessage.set('Error al cargar horario')
               this.isLoading.set(false)
            },
         })
   }

   onEdit(): void {
      this.edit.emit(this.scheduleId())
   }

   onBack(): void {
      this.back.emit()
   }

   async onDelete(): Promise<void> {
      const schedule = this.schedule()
      if (!schedule) return

      const label = `${this.formatDays(schedule)} ${this.getTimeRange(schedule)}`
      this.confirmDialog.confirmDelete(label, 'el horario').subscribe(async (confirmed) => {
         if (!confirmed) return
         this.isDeleting.set(true)
         try {
            await this.scheduleService.deleteSchedule(this.scheduleId())
            this.back.emit()
         } catch (error) {
            this.errorMessage.set('Error al eliminar horario')
            this.isDeleting.set(false)
         }
      })
   }

   getTimeRange(schedule: Schedule): string {
      return `${schedule.startTime} – ${schedule.endTime}`
   }

   formatDays(schedule: Schedule): string {
      const days = (schedule as any).days
      if (Array.isArray(days)) return days.map((d) => this.titleCase(String(d))).join(' · ')
      return this.titleCase(String(days ?? ''))
   }

   isActive(schedule: Schedule): boolean {
      const s = schedule.status as unknown
      if (typeof s === 'string') return s === 'activo'
      return !!s
   }

   private titleCase(s: string): string {
      if (!s) return ''
      return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
   }
}
