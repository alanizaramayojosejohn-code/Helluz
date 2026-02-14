import { Component, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatDividerModule } from '@angular/material/divider'
import { AuthService } from '../../../../services/auth/auth.service'

@Component({
   selector: 'app-log-in',
   standalone: true,
   imports: [
      CommonModule,
      ReactiveFormsModule,
      MatFormFieldModule,
      MatInputModule,
      MatButtonModule,
      MatIconModule,
      MatProgressSpinnerModule,
      MatDividerModule,
   ],
   templateUrl: './log-in.component.html',
   // styleUrls: ['./log-in.component.css']
})
export default class LogInComponent {
   loginForm: FormGroup
   loading = signal(false)
   errorMessage = signal('')
   hidePassword = signal(true)

   constructor(
      private fb: FormBuilder,
      private authService: AuthService,
      private router: Router
   ) {
      this.loginForm = this.fb.group({
         email: ['', [Validators.required, Validators.email]],
         password: ['', [Validators.required, Validators.minLength(6)]],
      })
   }

   togglePasswordVisibility() {
      this.hidePassword.set(!this.hidePassword())
   }

   async onSubmit() {
      if (this.loginForm.valid) {
         this.loading.set(true)
         this.errorMessage.set('')

         const { email, password } = this.loginForm.value

         try {
            await this.authService.loginWithEmail(email, password)
            this.router.navigate(['/admin/home'])
         } catch (error: any) {
            this.errorMessage.set(error)
         } finally {
            this.loading.set(false)
         }
      } else {
         this.loginForm.markAllAsTouched()
      }
   }

   async loginWithGoogle() {
      this.loading.set(true)
      this.errorMessage.set('')

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
      const emailControl = this.loginForm.get('email')
      if (emailControl?.hasError('required')) {
         return 'El email es requerido'
      }
      if (emailControl?.hasError('email')) {
         return 'Email inválido'
      }
      return ''
   }

   getPasswordErrorMessage() {
      const passwordControl = this.loginForm.get('password')
      if (passwordControl?.hasError('required')) {
         return 'La contraseña es requerida'
      }
      if (passwordControl?.hasError('minlength')) {
         return 'Mínimo 6 caracteres'
      }
      return ''
   }
}
