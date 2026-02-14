// components/form/container/component.ts
import { Component, DestroyRef, effect, inject, input, OnInit, output, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { UserService } from '../../../../../../../services/user/user.service'
import { AuthService } from '../../../../../../../services/auth/auth.service'
import { take } from 'rxjs/operators'
@Component({
   selector: 'x-user-form',
   imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule],
   templateUrl: './component.html',
})
export class UserForm implements OnInit {
   private readonly fb = inject(FormBuilder)
   private readonly userService = inject(UserService)
   private readonly authService = inject(AuthService)
   private readonly destroyRef = inject(DestroyRef)

   readonly userId = input<string | null>(null)
   readonly isEditMode = input<boolean>(false)

   readonly saved = output<void>()
   readonly cancelled = output<void>()

   userForm!: FormGroup

   readonly isSubmitting = signal(false)
   readonly isLoading = signal(false)
   readonly errorMessage = signal<string | null>(null)
   readonly currentUserId = signal<string | null>(null)

   constructor() {
      effect(() => {
         const id = this.userId()
         if (id) {
            this.loadUser(id)
         }
      })
   }

   ngOnInit(): void {
      this.initForm()
      this.loadCurrentUser()
   }

   private initForm(): void {
      this.userForm = this.fb.group({
         uid: [{ value: '', disabled: this.isEditMode() }, [Validators.required]],
         email: [{ value: '', disabled: this.isEditMode() }, [Validators.required, Validators.email]],
         name: ['', [Validators.required, Validators.minLength(2)]],
         lastname: ['', [Validators.required, Validators.minLength(2)]],
         role: ['instructor', Validators.required],
         status: ['activo', Validators.required],
      })
   }
private loadCurrentUser(): void {
  this.authService.currentUser$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((user) => {
      if (user?.uid) {
        this.currentUserId.set(user.uid);
      }
    });
}
   private loadUser(id: string): void {
      this.isLoading.set(true)
      this.errorMessage.set(null)

      this.userService
         .getUserById(id)
         .pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe({
            next: (user) => {
               if (user) {
                  this.userForm.patchValue({
                     uid: user.id,
                     email: user.email,
                     name: user.name,
                     lastname: user.lastname,
                     role: user.role,
                     status: user.status,
                  })
               }
               this.isLoading.set(false)
            },
            error: () => {
               this.errorMessage.set('Error al cargar el usuario')
               this.isLoading.set(false)
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
         await this.saveUser()
         this.saved.emit()
      } catch (error) {
         this.handleSaveError(error)
      } finally {
         this.isSubmitting.set(false)
      }
   }

   private validateForm(): boolean {
      if (this.userForm.invalid) {
         this.userForm.markAllAsTouched()
         this.errorMessage.set('Por favor, completa todos los campos requeridos')
         return false
      }
      return true
   }
   private async saveUser(): Promise<void> {
      const formValue = this.userForm.getRawValue()

      if (this.isEditMode() && this.userId()) {
         await this.userService.updateUser(this.userId()!, {
            name: formValue.name,
            lastname: formValue.lastname,
            role: formValue.role,
            status: formValue.status,
         })
      } else {
         const currentUserId = this.currentUserId()
         if (!currentUserId) {
            throw new Error('No se pudo obtener el usuario actual')
         }

         await this.userService.createUserInFirestore(
            {
               uid: formValue.uid,
               email: formValue.email,
               name: formValue.name,
               lastname: formValue.lastname,
               role: formValue.role,
               status: formValue.status,
            },
            currentUserId
         )
      }
   }
   private resetErrors(): void {
      this.errorMessage.set(null)
   }

   private handleSaveError(error: unknown): void {
      const message = error instanceof Error ? error.message : 'Error al guardar usuario'
      this.errorMessage.set(message)
      console.error('Error al guardar usuario:', error)
   }

   onCancel(): void {
      this.cancelled.emit()
   }

   getFormTitle(): string {
      return this.isEditMode() ? 'Editar Usuario' : 'Registrar Usuario'
   }

   hasError(field: string): boolean {
      const control = this.userForm.get(field)
      return !!(control && control.invalid && (control.dirty || control.touched))
   }

   getErrorMessage(field: string): string {
      const control = this.userForm.get(field)
      if (!control) return ''

      if (control.hasError('required')) {
         return 'Este campo es requerido'
      }
      if (control.hasError('minLength')) {
         return `Mínimo ${control.getError('minLength').requiredLength} caracteres`
      }
      if (control.hasError('email')) {
         return 'Email no válido'
      }
      return ''
   }
}
