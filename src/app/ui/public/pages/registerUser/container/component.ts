import { Component, inject, OnInit, signal } from '@angular/core'
import {
   AbstractControl,
   FormBuilder,
   FormGroup,
   ReactiveFormsModule,
   ValidationErrors,
   Validators,
} from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { RouterLink } from '@angular/router'
import { AuthService } from '../../../../../services/auth/auth.service'

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
   const password = control.get('password')
   const confirm = control.get('confirmPassword')
   if (!password || !confirm) return null
   return password.value !== confirm.value ? { passwordMismatch: true } : null
}

@Component({
   selector: 'app-register',
   imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, RouterLink],
   templateUrl: './component.html',
})
export default class RegisterComponent implements OnInit {
   private readonly fb = inject(FormBuilder)
   private readonly authService = inject(AuthService)

   registerForm!: FormGroup

   readonly isSubmitting = signal(false)
   readonly errorMessage = signal<string | null>(null)
   readonly successMessage = signal<string | null>(null)
   readonly showPassword = signal(false)
   readonly showConfirm = signal(false)

   ngOnInit(): void {
      this.registerForm = this.fb.group(
         {
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required],
         },
         { validators: passwordMatchValidator }
      )
   }

   async onSubmit(): Promise<void> {
      if (this.registerForm.invalid) {
         this.registerForm.markAllAsTouched()
         return
      }

      this.errorMessage.set(null)
      this.successMessage.set(null)
      this.isSubmitting.set(true)

      const { email, password } = this.registerForm.value

      try {
         await this.authService.registerWithEmail(email, password)
      } catch (error) {
         const message = error instanceof Error ? error.message : 'Error al crear la cuenta'
         // Si el mensaje es de cuenta inactiva, mostrarlo como éxito informativo
         if (message.includes('administrador') || message.includes('activarla')) {
            this.successMessage.set(message)
            this.registerForm.reset()
         } else {
            this.errorMessage.set(message)
         }
      } finally {
         this.isSubmitting.set(false)
      }
   }

   togglePassword(): void {
      this.showPassword.update((v) => !v)
   }

   toggleConfirm(): void {
      this.showConfirm.update((v) => !v)
   }

   hasError(field: string): boolean {
      const control = this.registerForm.get(field)
      return !!(control && control.invalid && (control.dirty || control.touched))
   }

   hasFormError(error: string): boolean {
      return !!(this.registerForm.hasError(error) && this.registerForm.get('confirmPassword')?.touched)
   }

   getErrorMessage(field: string): string {
      const control = this.registerForm.get(field)
      if (!control) return ''
      if (control.hasError('required')) return 'Este campo es requerido'
      if (control.hasError('email')) return 'Email no válido'
      if (control.hasError('minlength')) return `Mínimo ${control.getError('minlength').requiredLength} caracteres`
      return ''
   }
}
