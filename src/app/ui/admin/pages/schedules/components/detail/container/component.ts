import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatChipsModule } from '@angular/material/chips'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ScheduleService } from '../../../../../../../services/schedule/schedule.service'
import { Schedule } from '../../../../../../../models/schedule.model'
import { ConfirmDialogComponent } from '../../../../../../../components/shared/confirm-dialog/confirm-dialog.component'

@Component({
   selector: 'x-schedule-detail',
   imports: [MatButtonModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule, MatDialogModule],
   templateUrl: './component.html',
})
export class ScheduleDetail implements OnInit {
   private readonly scheduleService = inject(ScheduleService)
   private readonly dialog = inject(MatDialog)
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
            error: (error) => {
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

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
         data: {
            title: 'Eliminar Horario',
            // message: `¿Estás seguro de eliminar el horario de ${this.getDisciplineLabel(schedule.discipline)} del ${this.getDayLabel(schedule.day)}?`
         },
      })

      dialogRef.afterClosed().subscribe(async (result) => {
         if (result) {
            this.isDeleting.set(true)
            try {
               await this.scheduleService.deleteSchedule(this.scheduleId())
               this.back.emit()
            } catch (error) {
               this.errorMessage.set('Error al eliminar horario')
               this.isDeleting.set(false)
            }
         }
      })
   }

   getTimeRange(schedule: Schedule): string {
      return `${schedule.startTime} - ${schedule.endTime}`
   }
}
