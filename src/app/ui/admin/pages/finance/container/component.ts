import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core'
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatButtonModule } from '@angular/material/button'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatNativeDateModule } from '@angular/material/core'
import { AsyncPipe, CurrencyPipe } from '@angular/common'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Observable } from 'rxjs'
import { Enrollment } from '../../../../../models/enrollment.model'
import { BranchService } from '../../../../../services/branch/branch.service'
import { EnrollmentService } from '../../../../../services/enrollment/enrollment.service'
import { Branch } from '../../../../../models/branch.model'
import { QueryService } from '../../../../../services/branch/query.service'
import { EnrollmentQueryService } from '../../../../../services/enrollment/enrollment-query.service'

export interface ScheduleGroup {
   scheduleId: string
   scheduleLabel: string // "Lunes, Miércoles | 08:00 - 09:00"
   instructorName: string
   enrollments: Enrollment[]
   count: number
   subtotal: number
}

@Component({
   selector: 'x-finance-list',
   imports: [
      ReactiveFormsModule,
      MatFormFieldModule,
      MatInputModule,
      MatSelectModule,
      MatButtonModule,
      MatDatepickerModule,
      MatNativeDateModule,
      AsyncPipe,
      CurrencyPipe,
   ],
   providers: [BranchService, QueryService, EnrollmentService, EnrollmentQueryService],
   templateUrl: './component.html',
})
export default class FinanceListComponent implements OnInit {
   private readonly fb = inject(FormBuilder)
   private readonly branchService = inject(BranchService)
   private readonly enrollmentService = inject(EnrollmentService)
   private readonly destroyRef = inject(DestroyRef)

   branches$!: Observable<Branch[]>

   readonly isLoading = signal<boolean>(false)
   readonly errorMessage = signal<string | null>(null)
   readonly scheduleGroups = signal<ScheduleGroup[]>([])
   readonly hasSearched = signal<boolean>(false)
   readonly formValid = signal<boolean>(false)

   // ── Computed ──────────────────────────────────────────────────────────────
   readonly totalRecaudado = computed(() => this.scheduleGroups().reduce((acc, g) => acc + g.subtotal, 0))

   readonly totalInscripciones = computed(() => this.scheduleGroups().reduce((acc, g) => acc + g.count, 0))

   readonly hasResults = computed(() => this.scheduleGroups().length > 0)
   readonly canSearch = computed(() => this.formValid() && !this.isLoading())

   // ── Formulario ────────────────────────────────────────────────────────────
   filterForm!: FormGroup

   ngOnInit(): void {
      this.initForm()
      this.branches$ = this.branchService.getActiveBranches()
   }

   private initForm(): void {
      this.filterForm = this.fb.group({
         branchId: ['', Validators.required],
         startDate: ['', Validators.required],
         endDate: ['', Validators.required],
      })

      this.filterForm.statusChanges
         .pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe(() => this.formValid.set(this.filterForm.valid))
   }

   // ── Búsqueda ──────────────────────────────────────────────────────────────
   onSearch(): void {
      if (this.filterForm.invalid) {
         this.filterForm.markAllAsTouched()
         return
      }

      const start: Date = this.filterForm.value.startDate
      const end: Date = this.filterForm.value.endDate

      if (start > end) {
         this.errorMessage.set('La fecha de inicio no puede ser mayor que la fecha de fin')
         return
      }

      const { branchId } = this.filterForm.value

      this.isLoading.set(true)
      this.errorMessage.set(null)
      this.hasSearched.set(true)

      this.enrollmentService
         .getEnrollmentsByBranchAndDateRange(branchId, start, end)
         .pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe({
            next: (enrollments) => {
               this.scheduleGroups.set(this.groupBySchedule(enrollments))
               this.isLoading.set(false)
            },
            error: (err) => {
               console.error('Error detallado:', err)
               this.errorMessage.set('Error al obtener las inscripciones')
               this.isLoading.set(false)
            },
         })
   }

   onClear(): void {
      this.filterForm.reset()
      this.scheduleGroups.set([])
      this.hasSearched.set(false)
      this.errorMessage.set(null)
   }

   // ── Agrupación ────────────────────────────────────────────────────────────
   private groupBySchedule(enrollments: Enrollment[]): ScheduleGroup[] {
      const map = new Map<string, ScheduleGroup>()

      for (const enrollment of enrollments) {
         const key = enrollment.scheduleId ?? 'sin-horario'

         if (!map.has(key)) {
            map.set(key, {
               scheduleId: key,
               scheduleLabel: enrollment.scheduleLabel ?? 'Sin horario asignado',
               instructorName: enrollment.instructorName ?? 'Sin instructor',
               enrollments: [],
               count: 0,
               subtotal: 0,
            })
         }

         const group = map.get(key)!
         group.enrollments.push(enrollment)
         group.count++
         group.subtotal += enrollment.cost ?? 0
      }

      // Ordenar grupos por label alfabéticamente
      return Array.from(map.values()).sort((a, b) => a.scheduleLabel.localeCompare(b.scheduleLabel))
   }

   // ── Helpers ───────────────────────────────────────────────────────────────
   hasFieldError(fieldName: string): boolean {
      const field = this.filterForm.get(fieldName)
      return !!(field?.invalid && field?.touched)
   }

   getFieldError(fieldName: string): string | null {
      const field = this.filterForm.get(fieldName)
      if (!field?.errors || !field.touched) return null
      if (field.errors['required']) return 'Campo requerido'
      return null
   }
}
