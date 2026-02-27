import { Component, DestroyRef, inject, OnInit, output, signal } from '@angular/core'
import { MatTableModule } from '@angular/material/table'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatChipsModule } from '@angular/material/chips'
import { MatSelectModule } from '@angular/material/select'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatTooltipModule } from '@angular/material/tooltip'
import { AsyncPipe } from '@angular/common'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Observable, BehaviorSubject, switchMap, map } from 'rxjs'
import { ScheduleService } from '../../../../../../../services/schedule/schedule.service'
import { BranchService } from '../../../../../../../services/branch/branch.service'
import { SeedService } from '../../../../../../../services/seed/seed.service'
import { Schedule } from '../../../../../../../models/schedule.model'
import { Branch } from '../../../../../../../models/branch.model'

@Component({
   selector: 'x-schedule-list',
   imports: [
      MatTableModule,
      MatButtonModule,
      MatIconModule,
      MatChipsModule,
      MatSelectModule,
      MatFormFieldModule,
      MatProgressSpinnerModule,
      MatTooltipModule,
      AsyncPipe,
   ],
   templateUrl: './component.html',
})
export class ScheduleList implements OnInit {
   private readonly scheduleService = inject(ScheduleService)
   private readonly branchService = inject(BranchService)
   private readonly seedService = inject(SeedService)
   private readonly destroyRef = inject(DestroyRef)

   readonly createSchedule = output<void>()
   readonly editSchedule = output<string>()
   readonly viewDetail = output<string>()

   schedules$!: Observable<Schedule[]>
   branches$!: Observable<Branch[]>

   private selectedBranchId$ = new BehaviorSubject<string | null>(null)

   readonly isLoading = signal(false)
   readonly errorMessage = signal<string | null>(null)

   readonly displayedColumns = ['day', 'time', 'discipline', 'instructor', 'branch', 'actions']

   private readonly dayOrder: Record<string, number> = {
      Lunes: 1,
      Martes: 2,
      Miercoles: 3,
      Jueves: 4,
      Viernes: 5,
      Sábado: 6,
      Domingo: 7,
   }

   ngOnInit(): void {
      this.loadData()
   }

   private loadData(): void {
      this.isLoading.set(true)
      this.errorMessage.set(null)

      this.branches$ = this.branchService.getActiveBranches()

      this.schedules$ = this.selectedBranchId$.pipe(
         switchMap((branchId) => {
            if (branchId) {
               return this.scheduleService.getSchedulesByBranch(branchId)
            } else {
               return this.scheduleService.getSchedules()
            }
         }),
         map((schedules) => this.sortSchedules(schedules)),
         takeUntilDestroyed(this.destroyRef)
      )

      this.schedules$.subscribe({
         next: () => this.isLoading.set(false),
         error: () => {
            this.errorMessage.set('Error al cargar horarios')
            this.isLoading.set(false)
         },
      })
   }

   private sortSchedules(schedules: Schedule[]): Schedule[] {
      return [...schedules].sort((a, b) => {
         const dayOrderA = this.dayOrder[a.day] || 999
         const dayOrderB = this.dayOrder[b.day] || 999

         if (dayOrderA !== dayOrderB) {
            return dayOrderA - dayOrderB
         }

         return this.compareTime(a.startTime, b.startTime)
      })
   }

   private compareTime(timeA: string, timeB: string): number {
      const [hourA, minuteA] = timeA.split(':').map(Number)
      const [hourB, minuteB] = timeB.split(':').map(Number)

      const totalMinutesA = hourA * 60 + minuteA
      const totalMinutesB = hourB * 60 + minuteB

      return totalMinutesA - totalMinutesB
   }

   onBranchFilterChange(branchId: string): void {
      this.selectedBranchId$.next(branchId === 'all' ? null : branchId)
   }

   onCreateSchedule(): void {
      this.createSchedule.emit()
   }

   onEditSchedule(schedule: Schedule): void {
      if (schedule.id) {
         this.editSchedule.emit(schedule.id)
      }
   }

   onViewDetail(schedule: Schedule): void {
      if (schedule.id) {
         this.viewDetail.emit(schedule.id)
      }
   }

   getDayLabel(dayId: string): string {
      return dayId
   }

   getDisciplineLabel(disciplineId: string): string {
      return disciplineId
   }

   getDisciplineColor(disciplineId: string): string {
      return 'bg-blue-500'
   }

   getTimeRange(schedule: Schedule): string {
      return `${schedule.startTime} - ${schedule.endTime}`
   }
}
