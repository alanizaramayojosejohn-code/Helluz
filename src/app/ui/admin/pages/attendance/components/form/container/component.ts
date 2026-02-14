// import { Component, computed, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core'
// import {
//    FormBuilder,
//    FormGroup,
//    Validators,
//    ReactiveFormsModule,
//    AbstractControl,
//    AsyncValidatorFn,
//    ValidationErrors,
// } from '@angular/forms'
// import { MatFormFieldModule } from '@angular/material/form-field'
// import { MatInputModule } from '@angular/material/input'
// import { MatSelectModule } from '@angular/material/select'
// import { MatButtonModule } from '@angular/material/button'
// import { MatCheckboxModule } from '@angular/material/checkbox'
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
// import { catchError, debounceTime, distinctUntilChanged, map, Observable, of, switchMap } from 'rxjs'
// import { InstructorService } from '../../../../../../../services/instructor/instructor.service'
// import { BranchService } from '../../../../../../../services/branch/branch.service'
// import { Instructor, CreateInstructorDto, UpdateInstructorDto } from '../../../../../../../models/instructor.model'
// import { status } from '../../../../../../../models/branch.model'

// @Component({
//    selector: 'x-instructor-form',
//    imports: [
//       MatInputModule,
//       MatSelectModule,
//       MatButtonModule,
//       MatCheckboxModule,
//       ReactiveFormsModule,
//       MatFormFieldModule,
//    ],
//    templateUrl: './component.html',
// })
// export class InstructorForm implements OnInit {
//    private readonly fb = inject(FormBuilder)
//    private readonly instructorService = inject(InstructorService)
//    private readonly branchService = inject(BranchService)
//    private readonly destroyRef = inject(DestroyRef)

//    readonly instructorId = input<string | null>(null)
//    readonly isEditMode = input<boolean>(false)
//    readonly cancel = output<void>()
//    readonly saved = output<void>()

//    readonly errorMessage = signal<string | null>(null)
//    readonly isSubmitting = signal<boolean>(false)
//    readonly currentInstructor = signal<Instructor | null>(null)
//    readonly formValid = signal<boolean>(false)
//    readonly branches = signal<any[]>([])

//    readonly hasErrors = computed(() => !!this.errorMessage())
//    readonly canSubmit = computed(() => this.formValid() && !this.isSubmitting())

//    readonly submitButtonText = computed(() => {
//       if (this.isSubmitting()) return 'Guardando...'
//       return this.isEditMode() ? 'Actualizar Instructor' : 'Crear Instructor'
//    })

//    instructorForm!: FormGroup

//    ngOnInit(): void {
//       this.initializeComponent()
//    }

//    private initializeComponent(): void {
//       this.initForm()
//       this.loadBranches()
//       this.loadInstructorIfEditMode()
//    }

//    private initForm(): void {
//       this.instructorForm = this.fb.group({
//          branchId: ['', Validators.required],
//          name: ['', [Validators.required, Validators.minLength(2)]],
//          lastname: ['', [Validators.required, Validators.minLength(2)]],
//          ci: ['', [Validators.required, Validators.pattern(/^\d{7,10}$/)], [this.ciAsyncValidator()]],
//          cellphone: ['', [Validators.required, Validators.pattern(/^\d{8,10}$/)]],
//          email: ['', [Validators.email]],
//          status: ['activo'],
//       })

//       this.formValueChanges()
//    }

//    private formValueChanges(): void {
//       this.instructorForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
//          if (this.errorMessage()) {
//             this.errorMessage.set(null)
//          }
//       })

//       this.instructorForm.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
//          this.formValid.set(this.instructorForm.valid)
//       })
//    }

//    private ciAsyncValidator(): AsyncValidatorFn {
//       return (control: AbstractControl): Observable<ValidationErrors | null> => {
//          const value = control.value?.trim()

//          if (!value || value.length < 7) {
//             return of(null)
//          }

//          return of(value).pipe(
//             debounceTime(500),
//             distinctUntilChanged(),
//             switchMap((ci) => {
//                const excludeId = this.instructorId() || undefined
//                return this.instructorService.checkCiExist$(ci, excludeId).pipe(
//                   map((exists) => (exists ? { ciExists: true } : null)),
//                   catchError(() => of(null))
//                )
//             }),
//             takeUntilDestroyed(this.destroyRef)
//          )
//       }
//    }

//    private loadBranches(): void {
//       this.branchService
//          .getActiveBranches()
//          .pipe(takeUntilDestroyed(this.destroyRef))
//          .subscribe({
//             next: (branches) => this.branches.set(branches),
//             error: () => this.errorMessage.set('Error al cargar sucursales'),
//          })
//    }

//    private loadInstructorIfEditMode(): void {
//       const instructorId = this.instructorId()
//       if (instructorId && this.isEditMode()) {
//          this.loadInstructor(instructorId)
//       }
//    }

//    private loadInstructor(id: string): void {
//       this.instructorService
//          .getInstructorById(id)
//          .pipe(takeUntilDestroyed(this.destroyRef))
//          .subscribe({
//             next: (instructor) => {
//                if (instructor) {
//                   this.currentInstructor.set(instructor)
//                   this.instructorForm.patchValue({
//                      branchId: instructor.branchId,
//                      name: instructor.name,
//                      lastname: instructor.lastname,
//                      ci: instructor.ci,
//                      cellphone: instructor.cellphone,
//                      email: instructor.email || '',
//                      status: instructor.status,
//                   })
//                }
//             },
//             error: () => this.errorMessage.set('Error al cargar instructor'),
//          })
//    }

//    async onSubmit(): Promise<void> {
//       if (!this.validateForm()) {
//          return
//       }

//       this.resetErrors()
//       this.isSubmitting.set(true)

//       try {
//          await this.saveInstructor()
//          this.saved.emit()
//       } catch (error) {
//          this.handleSaveError(error)
//       } finally {
//          this.isSubmitting.set(false)
//       }
//    }

//    private validateForm(): boolean {
//       if (this.instructorForm.invalid) {
//          this.instructorForm.markAllAsTouched()
//          this.errorMessage.set('Por favor completa todos los campos requeridos correctamente')
//          return false
//       }
//       return true
//    }

//    private resetErrors(): void {
//       this.errorMessage.set(null)
//    }

//    private async saveInstructor(): Promise<void> {
//       const formValue = this.instructorForm.value
//       const branchName = this.branches().find((b) => b.id === formValue.branchId)?.name || ''

//       if (this.isEditMode() && this.instructorId()) {
//          const updateData: UpdateInstructorDto = {
//             ...formValue,
//             branchName,
//             email: formValue.email || undefined,
//          }

//          await this.instructorService.updateInstructor(this.instructorId()!, updateData)
//       } else {
//          const createData: CreateInstructorDto = {
//             ...formValue,
//             branchName,
//             email: formValue.email || undefined,
//          }

//          await this.instructorService.addInstructor(createData)
//       }
//    }

//    private handleSaveError(error: unknown): void {
//       console.error('Error al guardar instructor:', error)

//       const errorMsg =
//          error instanceof Error
//             ? error.message
//             : typeof error === 'string'
//               ? error
//               : 'Error desconocido al guardar el instructor'

//       this.errorMessage.set(errorMsg)
//    }

//    onCancel(): void {
//       this.cancel.emit()
//    }

//    getFieldError(fieldName: string): string | null {
//       const field = this.instructorForm.get(fieldName)
//       if (!field || !field.errors || !field.touched) return null

//       const errors = field.errors
//       if (errors['required']) return 'Campo requerido'
//       if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`
//       if (errors['pattern']) {
//          if (fieldName === 'ci') return 'CI inválida (7-10 dígitos)'
//          if (fieldName === 'cellphone') return 'Celular inválido (8-10 dígitos)'
//          return 'Formato inválido'
//       }
//       if (errors['email']) return 'Email inválido'
//       if (errors['ciExists']) return 'Esta CI ya está registrada'

//       return 'Error de validación'
//    }

//    hasFieldError(fieldName: string): boolean {
//       const field = this.instructorForm.get(fieldName)
//       return !!(field?.invalid && field?.touched)
//    }
// }
