import { Component, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
   FormBuilder,
   FormGroup,
   Validators,
   ReactiveFormsModule,
   AbstractControl,
   ValidationErrors,
} from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatDividerModule } from '@angular/material/divider'
import { AuthService } from '../../../../services/auth.service'

@Component({
   selector: 'app-sign-up',
   standalone: true,
   imports: [
      CommonModule,
      ReactiveFormsModule,
      RouterLink,
      MatFormFieldModule,
      MatInputModule,
      MatButtonModule,
      MatIconModule,
      MatProgressSpinnerModule,
      MatDividerModule,
   ],
   templateUrl: './sign-up.component.html',
   // styleUrls: ['./sign-up.component.css']
})
export default class SignUpComponent {
   registerForm: FormGroup
   loading = signal(false)
   errorMessage = signal('')
   successMessage = signal('')
   hidePassword = signal(true)
   hideConfirmPassword = signal(true)

   constructor(
      private fb: FormBuilder,
      private authService: AuthService,
      private router: Router
   ) {
      this.registerForm = this.fb.group(
         {
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]],
         },
         {
            validators: this.passwordMatchValidator,
         }
      )
   }

   // Validador personalizado para verificar que las contraseñas coincidan
   passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
      const password = control.get('password')
      const confirmPassword = control.get('confirmPassword')

      if (!password || !confirmPassword) {
         return null
      }

      if (confirmPassword.value === '') {
         return null
      }

      if (password.value !== confirmPassword.value) {
         confirmPassword.setErrors({ passwordMismatch: true })
         return { passwordMismatch: true }
      } else {
         // Limpiar el error si las contraseñas coinciden
         const errors = confirmPassword.errors
         if (errors) {
            delete errors['passwordMismatch']
            confirmPassword.setErrors(Object.keys(errors).length ? errors : null)
         }
         return null
      }
   }

   togglePasswordVisibility() {
      this.hidePassword.set(!this.hidePassword())
   }

   toggleConfirmPasswordVisibility() {
      this.hideConfirmPassword.set(!this.hideConfirmPassword())
   }

   async onSubmit() {
      if (this.registerForm.valid) {
         this.loading.set(true)
         this.errorMessage.set('')
         this.successMessage.set('')

         const { email, password } = this.registerForm.value

         try {
            await this.authService.registerWithEmail(email, password)
            this.successMessage.set('¡Registro exitoso! Redirigiendo...')
            setTimeout(() => {
               this.router.navigate(['/home'])
            }, 1500)
         } catch (error: any) {
            this.errorMessage.set(error)
         } finally {
            this.loading.set(false)
         }
      } else {
         this.registerForm.markAllAsTouched()
      }
   }

   async registerWithGoogle() {
      this.loading.set(true)
      this.errorMessage.set('')
      this.successMessage.set('')

      try {
         await this.authService.loginWithGoogle()
         this.router.navigate(['/admin/home'])
      } catch (error: any) {
         this.errorMessage.set(error)
      } finally {
         this.loading.set(false)
      }
   }

   getEmailErrorMessage() {
      const emailControl = this.registerForm.get('email')
      if (emailControl?.hasError('required')) {
         return 'El email es requerido'
      }
      if (emailControl?.hasError('email')) {
         return 'Email inválido'
      }
      return ''
   }

   getPasswordErrorMessage() {
      const passwordControl = this.registerForm.get('password')
      if (passwordControl?.hasError('required')) {
         return 'La contraseña es requerida'
      }
      if (passwordControl?.hasError('minlength')) {
         return 'Mínimo 6 caracteres'
      }
      return ''
   }

   getConfirmPasswordErrorMessage() {
      const confirmPasswordControl = this.registerForm.get('confirmPassword')
      if (confirmPasswordControl?.hasError('required')) {
         return 'Confirma tu contraseña'
      }
      if (confirmPasswordControl?.hasError('passwordMismatch')) {
         return 'Las contraseñas no coinciden'
      }
      return ''
   }
}
