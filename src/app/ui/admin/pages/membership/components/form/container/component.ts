// components/form/container/component.ts
import { Component, DestroyRef, effect, inject, input, OnInit, output, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button'
import { MatSelectModule } from '@angular/material/select'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatIconModule } from '@angular/material/icon'
import { MatChipsModule } from '@angular/material/chips'
import { MembershipService } from '../../../../../../../services/membership/membership.service'
import { CreateMembershipDto, UpdateMembershipDto } from '../../../../../../../models/membership.model'

interface DayOption {
   value: number
   label: string
}

@Component({
   selector: 'x-membership-form',
   imports: [
      ReactiveFormsModule,
      MatFormFieldModule,
      MatInputModule,
      MatButtonModule,
      MatSelectModule,
      MatProgressSpinnerModule,
      MatIconModule,
      MatChipsModule,
   ],
   templateUrl: './component.html',
})
export class MembershipForm implements OnInit {
   private readonly fb = inject(FormBuilder)
   private readonly membershipService = inject(MembershipService)
   private readonly destroyRef = inject(DestroyRef)

   readonly membershipId = input<string | null>(null)
   readonly isEditMode = input<boolean>(false)

   readonly saved = output<void>()
   readonly cancelled = output<void>()

   membershipForm!: FormGroup

   readonly isSubmitting = signal(false)
   readonly isLoading = signal(false)
   readonly errorMessage = signal<string | null>(null)

   readonly daysOptions: DayOption[] = [
      { value: 0, label: 'Domingo' },
      { value: 1, label: 'Lunes' },
      { value: 2, label: 'Martes' },
      { value: 3, label: 'Miércoles' },
      { value: 4, label: 'Jueves' },
      { value: 5, label: 'Viernes' },
      { value: 6, label: 'Sábado' },
   ]

   constructor() {
      effect(() => {
         const id = this.membershipId()
         if (id) {
            this.loadMembership(id)
         }
      })
   }

   ngOnInit(): void {
      this.initForm()
   }

   private initForm(): void {
      this.membershipForm = this.fb.group({
         name: ['', [Validators.required, Validators.minLength(3)]],
         durationDays: [30, [Validators.required, Validators.min(1)]],
         totalSessions: [12, [Validators.required, Validators.min(1)]],
         allowedDays: [[], [Validators.required]],
         cost: [0, [Validators.required, Validators.min(0)]],
         status: ['activo', Validators.required],
      })
   }

   private loadMembership(id: string): void {
      this.isLoading.set(true)
      this.errorMessage.set(null)

      this.membershipService
         .getMembershipById(id)
         .pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe({
            next: (membership) => {
               if (membership) {
                  this.membershipForm.patchValue({
                     name: membership.name,
                     durationDays: membership.durationDays,
                     totalSessions: membership.totalSessions,
                     allowedDays: membership.allowedDays,
                     cost: membership.cost,
                     status: membership.status,
                  })
               }
               this.isLoading.set(false)
            },
            error: () => {
               this.errorMessage.set('Error al cargar la membresía')
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
         await this.saveMembership()
         this.saved.emit()
      } catch (error) {
         this.handleSaveError(error)
      } finally {
         this.isSubmitting.set(false)
      }
   }

   private validateForm(): boolean {
      if (this.membershipForm.invalid) {
         this.membershipForm.markAllAsTouched()
         this.errorMessage.set('Por favor, completa todos los campos requeridos')
         return false
      }
      return true
   }

   private async saveMembership(): Promise<void> {
      const formValue = this.membershipForm.value

      if (this.isEditMode() && this.membershipId()) {
         const updateData: UpdateMembershipDto = {
            ...formValue,
         }
         await this.membershipService.updateMembership(this.membershipId()!, updateData)
      } else {
         const createData: CreateMembershipDto = {
            ...formValue,
         }
         await this.membershipService.createMembership(createData)
      }
   }

   private resetErrors(): void {
      this.errorMessage.set(null)
   }

   private handleSaveError(error: unknown): void {
      const message = error instanceof Error ? error.message : 'Error al guardar membresía'
      this.errorMessage.set(message)
      console.error('Error al guardar membresía:', error)
   }

   onCancel(): void {
      this.cancelled.emit()
   }

   getFormTitle(): string {
      return this.isEditMode() ? 'Editar Membresía' : 'Nueva Membresía'
   }

   hasError(field: string): boolean {
      const control = this.membershipForm.get(field)
      return !!(control && control.invalid && (control.dirty || control.touched))
   }

   getErrorMessage(field: string): string {
      const control = this.membershipForm.get(field)
      if (!control) return ''

      if (control.hasError('required')) {
         return 'Este campo es requerido'
      }
      if (control.hasError('minLength')) {
         return `Mínimo ${control.getError('minLength').requiredLength} caracteres`
      }
      if (control.hasError('min')) {
         return `El valor mínimo es ${control.getError('min').min}`
      }
      return ''
   }
}
