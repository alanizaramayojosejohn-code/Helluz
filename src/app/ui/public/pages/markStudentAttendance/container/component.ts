import { Component, inject, signal, output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { StudentAttendanceService } from '../../../../../services/studentAttendance/student-attendance.service'
import { StudentQueryService } from '../../../../../services/student/student-query.service'
import { StudentService } from '../../../../../services/student/student.service'
import { ScheduleService } from '../../../../../services/schedule/schedule.service'
import { ScheduleQueryService } from '../../../../../services/schedule/schedule-query.service'
import { StudentAttendanceQueryService } from '../../../../../services/studentAttendance/student-attendance-query.service'
import { EnrollmentQueryService } from '../../../../../services/enrollment/enrollment-query.service'
import { EnrollmentService } from '../../../../../services/enrollment/enrollment.service'

@Component({
   selector: 'x-student-attendance-mark',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
     providers: [StudentQueryService, StudentService, ScheduleService, ScheduleQueryService, StudentAttendanceQueryService, StudentAttendanceService, EnrollmentQueryService, EnrollmentService,  ],
   templateUrl: './component.html',
})
export default class StudentAttendanceMarkComponent {
   private readonly fb = inject(FormBuilder)
   private readonly attendanceService = inject(StudentAttendanceService)

   viewList = output<void>()

   attendanceForm: FormGroup
   isSubmitting = signal(false)
   successMessage = signal<string | null>(null)
   errorMessage = signal<string | null>(null)

   constructor() {
      this.attendanceForm = this.fb.group({
         ci: ['', [Validators.required, Validators.minLength(5)]],
      })
   }

   async onSubmit(): Promise<void> {
      if (this.attendanceForm.invalid || this.isSubmitting()) return

      this.isSubmitting.set(true)
      this.errorMessage.set(null)
      this.successMessage.set(null)

      try {
         const result = await this.attendanceService.markAttendance(this.attendanceForm.value)

         this.successMessage.set(
            `✅ ${result.message}\n\n` +
               `Estudiante: ${result.studentName}\n` +
               `Sesión: ${result.sessionNumber}\n` +
               `Sesiones restantes: ${result.remainingSessions}`
         )

         this.attendanceForm.reset()
      } catch (error: any) {
         this.errorMessage.set(error.message || 'Error al registrar asistencia')
      } finally {
         this.isSubmitting.set(false)
      }
   }

   hasFieldError(field: string): boolean {
      const control = this.attendanceForm.get(field)
      return !!(control && control.invalid && (control.dirty || control.touched))
   }

   getFieldError(field: string): string {
      const control = this.attendanceForm.get(field)
      if (control?.hasError('required')) return 'Este campo es obligatorio'
      if (control?.hasError('minlength')) return 'CI debe tener al menos 5 caracteres'
      return ''
   }

   canSubmit(): boolean {
      return this.attendanceForm.valid && !this.isSubmitting()
   }

   onViewList(): void {
      this.viewList.emit()
   }
}
