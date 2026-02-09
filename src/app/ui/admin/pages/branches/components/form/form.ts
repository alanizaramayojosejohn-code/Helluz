import { Component, computed, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core'
import {
   FormBuilder,
   FormGroup,
   Validators,
   ReactiveFormsModule,
   AbstractControl,
   AsyncValidatorFn,
   ValidationErrors,
} from '@angular/forms'
import { BranchService } from '../../../../../../services/branch/branch.service'
import { Branch, BranchStatus, status } from '../../../../../../models/branch.model'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatButtonModule } from '@angular/material/button'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { catchError, debounceTime, distinctUntilChanged, map, Observable, of, switchMap } from 'rxjs'

@Component({
   selector: 'x-form',
   imports: [
      MatInputModule,
      MatSelectModule,
      MatButtonModule,
      ReactiveFormsModule,
      MatFormFieldModule,
   ],
   templateUrl: './form.html',
   styleUrl: './form.css',
})
export class BranchForm implements OnInit {
   private readonly fb = inject(FormBuilder)
   private readonly branchService = inject(BranchService)
   private readonly destroyRef = inject(DestroyRef)

   readonly branchId = input<string | null>(null)
   readonly isEditMode = input<boolean>(false)
   readonly cancel = output<void>()
   readonly saved = output<void>()

   readonly errorMessage = signal<string | null>(null)
   readonly isSubmitting = signal<boolean>(false)
   readonly currentBranch = signal<Branch | null>(null)
   readonly formValid = signal<boolean>(false)
   readonly hasErrors = computed(() => !!this.errorMessage())

   readonly canSubmit = computed(() => this.formValid() && !this.isSubmitting())

   readonly submitButtonText = computed(() => {
      if (this.isSubmitting()) return 'Guardando...'
      return this.isEditMode() ? 'Actualizar Sucursal' : 'Crear Sucursal'
   })

   branchForm!: FormGroup

   readonly branchStatus: readonly BranchStatus[] = ['activo', 'inactivo']

   ngOnInit(): void {
      this.initializeComponent()
   }

   private initializeComponent(): void {
      this.initForm()
      this.loadBranchIfEditMode()
   }
   private initForm(): void {
      this.branchForm = this.fb.group({
         name: ['', [Validators.required, Validators.minLength(3)]],
         city: ['', [Validators.required, Validators.minLength(3)]],
         ip: ['', [Validators.required, Validators.pattern(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)]],
         mask: ['', [Validators.required, Validators.pattern(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)]],
         status: ['activo' as BranchStatus, Validators.required],
         userId: ['user-default'],
      })
      this.FormValueChanges()
   }

   private FormValueChanges(): void {
      this.branchForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
         if (this.errorMessage()) {
            this.errorMessage.set(null)
         }
      })
      this.branchForm.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
         this.formValid.set(this.branchForm.valid)
      })
   }
   private nameAsyncValidator(): AsyncValidatorFn {
      return (control: AbstractControl): Observable<ValidationErrors | null> => {
         const value = control.value?.trim()

         if (!value || value.length < 3) {
            return of(null)
         }

         return of(value).pipe(
            debounceTime(500),
            distinctUntilChanged(),
            switchMap((name) => {
               const excludeId = this.branchId() || undefined
               return this.branchService.checkNameExist$(name, excludeId).pipe(
                  map((exists) => (exists ? { nameExists: true } : null)),
                  catchError((error) => {
                     console.error('Error validando nombre:', error)
                     return of(null)
                  })
               )
            }),
            takeUntilDestroyed(this.destroyRef)
         )
      }
   }
   private loadBranchIfEditMode(): void {
      const productId = this.branchId()
      if (productId && this.isEditMode()) {
         this.loadBranch(productId)
      }
   }

   private loadBranch(id: string): void {
      this.branchService
         .getBranchById(id)
         .pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe({
            next: (branch) => {
               if (branch) {
                  this.currentBranch.set(branch)
                  this.branchForm.patchValue(branch)
               }
            },
            error: (error) => {
               console.error('Error cargando producto:', error)
               this.errorMessage.set('Error al cargar el producto')
            },
         })
   }

   async onSubmit(): Promise<void> {
      if (!this.validateForm()) {
         return
      }

      this.resetErrors()
      this.isSubmitting.set(true)

      try {
         await this.saveBranch()
         this.saved.emit()
      } catch (error) {
         this.handleSaveError(error)
      } finally {
         this.isSubmitting.set(false)
      }
   }
   private validateForm(): boolean {
      if (this.branchForm.invalid) {
         this.branchForm.markAllAsTouched()
         this.errorMessage.set('Por favor completa todos los campos requeridos correctamente')
         return false
      }
      return true
   }

   private resetErrors(): void {
      this.errorMessage.set(null)
   }

   private async saveBranch() {
      const formValue = this.branchForm.value

      if (this.isEditMode() && this.branchId()) {
         const currentProduct = this.currentBranch()
         const updates = {
            ...formValue,
         }

         await this.branchService.updateBranch(this.branchId()!, updates)
      } else {
         await this.branchService.addBranch(formValue)
      }
   }
   private handleSaveError(error: unknown): void {
      console.error('Error al guardar sucursal:', error)

      const errorMsg =
         error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : 'Error desconocido al guardar el sucursal'

      const lowerMsg = errorMsg.toLowerCase()

      this.errorMessage.set(errorMsg)
   }

   private extractErrorMessage(error: unknown): string {
      if (error instanceof Error) return error.message
      if (typeof error === 'string') return error
      return 'Error desconocido al guardar el producto'
   }

   onCancel(): void {
      this.cancel.emit()
   }

   getFieldError(fieldName: string): string | null {
      const field = this.branchForm.get(fieldName)
      if (!field || !field.errors || !field.touched) return null

      const errors = field.errors
      if (errors['required']) return 'Campo requerido'
      if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`
      if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres`
      if (errors['min']) return `Debe ser mayor a ${errors['min'].min}`
      if (errors['nameExists']) return 'Este nombre ya está en uso'

      return 'Error de validación'
   }

   hasFieldError(fieldName: string): boolean {
      const field = this.branchForm.get(fieldName)
      return !!(field?.invalid && field?.touched)
   }
}
