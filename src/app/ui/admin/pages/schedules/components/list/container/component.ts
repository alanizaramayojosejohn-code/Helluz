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
import { Observable, BehaviorSubject, switchMap, startWith } from 'rxjs'
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

   // Observables
   schedules$!: Observable<Schedule[]>
   branches$!: Observable<Branch[]>

   // Subject para manejar el filtro de sucursal
   private selectedBranchId$ = new BehaviorSubject<string | null>(null)

   readonly isLoading = signal(false)
   readonly errorMessage = signal<string | null>(null)

   readonly displayedColumns = ['day', 'time', 'discipline', 'instructor', 'branch', 'actions']

   ngOnInit(): void {
      this.loadData()
   }

   private loadData(): void {
      this.isLoading.set(true)
      this.errorMessage.set(null)

      // Cargar sucursales
      this.branches$ = this.branchService.getActiveBranches()

      // Cargar horarios reactivos según la sucursal seleccionada
      this.schedules$ = this.selectedBranchId$.pipe(
         switchMap((branchId) => {
            if (branchId) {
               // Si hay sucursal seleccionada, filtrar por ella
               return this.scheduleService.getSchedulesByBranch(branchId)
            } else {
               // Si no hay sucursal, cargar todos
               return this.scheduleService.getSchedules()
            }
         }),
         takeUntilDestroyed(this.destroyRef)
      )

      // Marcar como cargado cuando lleguen los datos
      this.schedules$.subscribe({
         next: () => this.isLoading.set(false),
         error: () => {
            this.errorMessage.set('Error al cargar horarios')
            this.isLoading.set(false)
         },
      })
   }

   onBranchFilterChange(branchId: string): void {
      // Emitir nuevo valor al subject
      // 'all' se convierte a null para cargar todos
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
      // Aquí necesitarás el seedService para obtener el label
      // Por ahora retornamos el ID, luego lo mejoramos
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
