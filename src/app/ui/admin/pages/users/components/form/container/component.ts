// components/form/container/component.ts
import { Component, DestroyRef, effect, inject, input, OnInit, output, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { UserService } from '../../../../../../../services/user/user.service'
import { AuthService } from '../../../../../../../services/auth/auth.service'
import { BranchService } from '../../../../../../../services/branch/branch.service'
import { Branch } from '../../../../../../../models/branch.model'

@Component({
   selector: 'x-user-form',
   imports: [ReactiveFormsModule],
   templateUrl: './component.html',
})
export class UserForm implements OnInit {
   private readonly fb = inject(FormBuilder)
   private readonly userService = inject(UserService)
   private readonly authService = inject(AuthService)
   private readonly branchService = inject(BranchService)
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
   readonly branches = signal<Branch[]>([])

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
      this.loadBranches()
      this.watchRoleChanges()
   }

   private initForm(): void {
      this.userForm = this.fb.group({
         email: [{ value: '', disabled: this.isEditMode() }, [Validators.required, Validators.email]],
         name: ['', [Validators.required, Validators.minLength(2)]],
         lastname: ['', [Validators.required, Validators.minLength(2)]],
         role: ['instructor', Validators.required],
         branchId: [''],
         status: ['activo', Validators.required],
      })
   }

   private loadBranches(): void {
      this.branchService.getActiveBranches()
         .pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe((branches) => this.branches.set(branches))
   }

   private watchRoleChanges(): void {
      this.userForm.get('role')!.valueChanges
         .pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe((role) => {
            const branchControl = this.userForm.get('branchId')!
            if (role === 'admin') {
               branchControl.setValidators(Validators.required)
            } else if (role === 'instructor') {
               branchControl.clearValidators()
            } else {
               branchControl.clearValidators()
               branchControl.setValue('')
            }
            branchControl.updateValueAndValidity()
         })
   }

   get isAdminRole(): boolean {
      return this.userForm.get('role')?.value === 'admin'
   }

   get showBranchSelector(): boolean {
      const role = this.userForm.get('role')?.value
      return role === 'admin' || role === 'instructor'
   }

   private loadCurrentUser(): void {
      this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
         if (user?.uid) {
            this.currentUserId.set(user.uid)
         }
      })
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
                     email: user.email,
                     name: user.name,
                     lastname: user.lastname,
                     role: user.role,
                     branchId: user.branchId ?? '',
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
      if (!this.validateForm()) return

      this.errorMessage.set(null)
      this.isSubmitting.set(true)

      try {
         await this.saveUser()
         this.saved.emit()
      } catch (error) {
         const message = error instanceof Error ? error.message : 'Error al guardar usuario'
         this.errorMessage.set(message)
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
         // Edición: actualiza el doc existente en Firestore
         await this.userService.updateUser(this.userId()!, {
            name: formValue.name,
            lastname: formValue.lastname,
            role: formValue.role,
            ...(formValue.branchId ? { branchId: formValue.branchId } : {}),
            status: formValue.status,
         })
      } else {
         // Creación: pre-registra al usuario en `usuariosPendientes`
         const currentUserId = this.currentUserId()
         if (!currentUserId) throw new Error('No se pudo obtener el usuario actual')

         await this.userService.preRegistrarUsuario(
            {
               email: formValue.email,
               name: formValue.name,
               lastname: formValue.lastname,
               role: formValue.role,
               ...(formValue.branchId ? { branchId: formValue.branchId } : {}),
               status: formValue.status,
               createdBy: currentUserId,
            },
            currentUserId
         )
      }
   }

   onCancel(): void {
      this.cancelled.emit()
   }

   hasError(field: string): boolean {
      const control = this.userForm.get(field)
      return !!(control && control.invalid && (control.dirty || control.touched))
   }

   getErrorMessage(field: string): string {
      const control = this.userForm.get(field)
      if (!control) return ''
      if (control.hasError('required')) return 'Este campo es requerido'
      if (control.hasError('minlength')) return `Mínimo ${control.getError('minlength').requiredLength} caracteres`
      if (control.hasError('email')) return 'Email no válido'
      return ''
   }
}
