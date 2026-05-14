import { Component, computed, DestroyRef, HostListener, inject, input, OnInit, output, signal } from '@angular/core'
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'
import { AsyncPipe, TitleCasePipe } from '@angular/common'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ScheduleService } from '../../../../../../../services/schedule/schedule.service'
import { BranchService } from '../../../../../../../services/branch/branch.service'
import { InstructorService } from '../../../../../../../services/instructor/instructor.service'
import { SeedService } from '../../../../../../../services/seed/seed.service'
import { Schedule, CreateScheduleDto, UpdateScheduleDto } from '../../../../../../../models/schedule.model'
import { Instructor } from '../../../../../../../models/instructor.model'
import { Branch } from '../../../../../../../models/branch.model'
import { Day, Discipline } from '../../../../../../../models/seeds.model'
import { timeRangeValidator } from '../../../../../../../validators/time-range.validator'
import { Observable, tap } from 'rxjs'

@Component({
   selector: 'x-schedule-form',
   imports: [ReactiveFormsModule, AsyncPipe, TitleCasePipe],
   templateUrl: './component.html',
})
export class ScheduleForm implements OnInit {
   private readonly fb = inject(FormBuilder)
   private readonly scheduleService = inject(ScheduleService)
   private readonly branchService = inject(BranchService)
   private readonly instructorService = inject(InstructorService)
   private readonly seedService = inject(SeedService)
   private readonly destroyRef = inject(DestroyRef)

   readonly scheduleId = input<string | null>(null)
   readonly isEditMode = input<boolean>(false)
   readonly cancel = output<void>()
   readonly saved = output<void>()

   readonly errorMessage = signal<string | null>(null)
   readonly isSubmitting = signal<boolean>(false)
   readonly currentSchedule = signal<Schedule | null>(null)
   readonly formValid = signal<boolean>(false)
   readonly selectedDays = signal<string[]>([])
   readonly showBranchDropdown = signal(false)
   readonly showInstructorDropdown = signal(false)

   branches$!: Observable<Branch[]>
   days$!: Observable<Day[]>
   disciplines$!: Observable<Discipline[]>
   instructors$: Observable<Instructor[]> | null = null

   private branchesCache: Branch[] = []
   private instructorsCache: Instructor[] = []

   readonly hasErrors = computed(() => !!this.errorMessage())
   readonly canSubmit = computed(() => this.formValid() && !this.isSubmitting())

   readonly submitButtonText = computed(() => {
      if (this.isSubmitting()) return 'Guardando…'
      return this.isEditMode() ? 'Actualizar horario' : 'Crear horario'
   })

   scheduleForm!: FormGroup

   ngOnInit(): void {
      this.initializeComponent()
   }

   private initializeComponent(): void {
      this.initForm()
      this.loadData()
      this.setupBranchListener()
      this.loadScheduleIfEditMode()
   }

   private initForm(): void {
      this.scheduleForm = this.fb.group(
         {
            branchId: ['', Validators.required],
            days: [[] as string[], Validators.required],
            startTime: ['', [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
            endTime: ['', [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
            instructorId: [''],
            status: ['activo'],
         },
         { validators: timeRangeValidator },
      )

      this.formValueChanges()
   }

   private loadData(): void {
      this.branches$ = this.branchService.getActiveBranches().pipe(tap((branches) => (this.branchesCache = branches)))
      this.days$ = this.seedService.getDays()
      this.disciplines$ = this.seedService.getDiscipline()
   }

   private formValueChanges(): void {
      this.scheduleForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
         if (this.errorMessage()) {
            this.errorMessage.set(null)
         }
         this.selectedDays.set([...(value.days ?? [])])
      })

      this.scheduleForm.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
         this.formValid.set(this.scheduleForm.valid)
      })
   }

   private setupBranchListener(): void {
      this.scheduleForm
         .get('branchId')
         ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe((branchId) => {
            this.scheduleForm.patchValue({ instructorId: '' }, { emitEvent: false })

            if (branchId) {
               this.loadInstructorsByBranch(branchId)
            } else {
               this.instructors$ = null
            }
         })
   }

   private loadInstructorsByBranch(branchId: string): void {
      this.instructors$ = this.instructorService
         .getInstructorsByBranch(branchId)
         .pipe(tap((instructors) => (this.instructorsCache = instructors)))
   }

   private loadScheduleIfEditMode(): void {
      const scheduleId = this.scheduleId()
      if (scheduleId && this.isEditMode()) {
         this.loadSchedule(scheduleId)
      }
   }

   private loadSchedule(id: string): void {
      this.scheduleService
         .getScheduleById(id)
         .pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe({
            next: (schedule) => {
               if (schedule) {
                  this.currentSchedule.set(schedule)
                  this.scheduleForm.patchValue({
                     branchId: schedule.branchId,
                     days: schedule.days,
                     startTime: schedule.startTime,
                     endTime: schedule.endTime,
                     instructorId: schedule.instructorId || '',
                     status: schedule.status,
                  })
                  this.selectedDays.set([...(schedule.days ?? [])])

                  if (schedule.branchId) {
                     this.loadInstructorsByBranch(schedule.branchId)
                  }
               }
            },
            error: () => this.errorMessage.set('Error al cargar horario'),
         })
   }

   toggleDay(dayName: string): void {
      const current = this.selectedDays()
      const next = current.includes(dayName) ? current.filter((d) => d !== dayName) : [...current, dayName]
      this.selectedDays.set(next)
      this.scheduleForm.get('days')?.setValue(next)
      this.scheduleForm.get('days')?.markAsTouched()
   }

   isDaySelected(dayName: string): boolean {
      return this.selectedDays().includes(dayName)
   }

   async onSubmit(): Promise<void> {
      if (!this.validateForm()) return

      this.resetErrors()
      this.isSubmitting.set(true)

      try {
         await this.saveSchedule()
         this.saved.emit()
      } catch (error) {
         this.handleSaveError(error)
      } finally {
         this.isSubmitting.set(false)
      }
   }

   private validateForm(): boolean {
      if (this.scheduleForm.invalid) {
         this.scheduleForm.markAllAsTouched()
         this.errorMessage.set('Por favor completa todos los campos requeridos correctamente')
         return false
      }
      return true
   }

   private resetErrors(): void {
      this.errorMessage.set(null)
   }

   private async saveSchedule(): Promise<void> {
      const formValue = this.scheduleForm.value

      const branchName = this.branchesCache.find((b) => b.id === formValue.branchId)?.name || ''
      const instructorName = formValue.instructorId ? this.getInstructorName(formValue.instructorId) : undefined

      if (this.isEditMode() && this.scheduleId()) {
         const updateData: UpdateScheduleDto = {
            ...formValue,
            branchName,
            instructorId: formValue.instructorId || undefined,
            instructorName,
         }

         await this.scheduleService.updateSchedule(this.scheduleId()!, updateData)
      } else {
         const createData: CreateScheduleDto = {
            branchId: formValue.branchId,
            branchName,
            days: formValue.days,
            startTime: formValue.startTime,
            endTime: formValue.endTime,
            discipline: 'MMA',
            instructorId: formValue.instructorId || undefined,
            instructorName,
            status: formValue.status,
         }
         await this.scheduleService.addSchedule(createData)
      }
   }

   private getInstructorName(instructorId: string): string {
      const instructor = this.instructorsCache.find((i) => i.id === instructorId)
      return instructor ? this.instructorService.getInstructorFullName(instructor) : ''
   }

   private handleSaveError(error: unknown): void {
      console.error('Error al guardar horario:', error)
      const errorMsg =
         error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : 'Error desconocido al guardar el horario'
      this.errorMessage.set(errorMsg)
   }

   @HostListener('document:click')
   closeAllDropdowns(): void {
      this.showBranchDropdown.set(false)
      this.showInstructorDropdown.set(false)
   }

   toggleBranchDropdown(event: Event): void {
      event.stopPropagation()
      this.showBranchDropdown.update(v => !v)
      this.showInstructorDropdown.set(false)
   }

   selectBranch(branch: Branch, event: Event): void {
      event.stopPropagation()
      this.scheduleForm.patchValue({ branchId: branch.id })
      this.showBranchDropdown.set(false)
   }

   toggleInstructorDropdown(event: Event): void {
      event.stopPropagation()
      this.showInstructorDropdown.update(v => !v)
      this.showBranchDropdown.set(false)
   }

   selectInstructor(instructor: Instructor | null, event: Event): void {
      event.stopPropagation()
      this.scheduleForm.patchValue({ instructorId: instructor?.id || '' })
      this.showInstructorDropdown.set(false)
   }

   get selectedBranch(): Branch | null {
      const id = this.scheduleForm.get('branchId')?.value
      return this.branchesCache.find(b => b.id === id) || null
   }

   get selectedInstructor(): Instructor | null {
      const id = this.scheduleForm.get('instructorId')?.value
      if (!id) return null
      return this.instructorsCache.find(i => i.id === id) || null
   }

   onCancel(): void {
      this.cancel.emit()
   }

   getFieldError(fieldName: string): string | null {
      const field = this.scheduleForm.get(fieldName)
      if (!field || !field.errors || !field.touched) return null

      const errors = field.errors
      if (errors['required']) {
         if (fieldName === 'days') return 'Selecciona al menos un día'
         return 'Campo requerido'
      }
      if (errors['pattern']) return 'Formato inválido (HH:mm)'

      return 'Error de validación'
   }

   hasFieldError(fieldName: string): boolean {
      const field = this.scheduleForm.get(fieldName)
      return !!(field?.invalid && field?.touched)
   }

   getInstructorFullName(instructor: Instructor): string {
      return this.instructorService.getInstructorFullName(instructor)
   }
}
