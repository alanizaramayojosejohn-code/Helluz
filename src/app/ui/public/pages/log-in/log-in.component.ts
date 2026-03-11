import { Component, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'
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
})
export default class LogInComponent {
  loginForm: FormGroup
  loading = signal(false)
  errorMessage = signal('')
  hidePassword = signal(true)

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
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
        // AuthService ya redirige según el rol internamente
        await this.authService.loginWithEmail(email, password)
      } catch (error: any) {
        this.errorMessage.set(error instanceof Error ? error.message : 'Error al iniciar sesión')
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
      // AuthService ya redirige según el rol internamente
      await this.authService.loginWithGoogle()
    } catch (error: any) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Error al iniciar sesión con Google')
    } finally {
      this.loading.set(false)
    }
  }

  getEmailErrorMessage() {
    const emailControl = this.loginForm.get('email')
    if (emailControl?.hasError('required')) return 'El email es requerido'
    if (emailControl?.hasError('email')) return 'Email inválido'
    return ''
  }

  getPasswordErrorMessage() {
    const passwordControl = this.loginForm.get('password')
    if (passwordControl?.hasError('required')) return 'La contraseña es requerida'
    if (passwordControl?.hasError('minlength')) return 'Mínimo 6 caracteres'
    return ''
  }
}
