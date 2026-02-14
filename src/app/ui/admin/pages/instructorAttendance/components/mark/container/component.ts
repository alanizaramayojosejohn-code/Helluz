import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InstructorAttendanceService } from '../../../../../../../services/instructorAttendance/instructor-attendance.service';

@Component({
  selector: 'x-instructor-attendance-mark',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  providers: [InstructorAttendanceService],
  templateUrl: './component.html'
})
export class InstructorAttendanceMarkComponent {
  private readonly fb = inject(FormBuilder);
  private readonly attendanceService = inject(InstructorAttendanceService);

  viewList = output<void>();

  attendanceForm: FormGroup;
  isSubmitting = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.attendanceForm = this.fb.group({
      ci: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.attendanceForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const result = await this.attendanceService.markArrival(
        this.attendanceForm.value
      );

      const statusIcon = result.isLate ? '⚠️' : '✅';
      const statusText = result.isLate
        ? `Llegaste ${result.minutesLate} minutos tarde`
        : 'Llegaste a tiempo';

      this.successMessage.set(
        `${statusIcon} ${result.message}\n\n` +
        `Instructor: ${result.instructorName}\n` +
        `${statusText}`
      );

      this.attendanceForm.reset();

    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al registrar entrada');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  hasFieldError(field: string): boolean {
    const control = this.attendanceForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldError(field: string): string {
    const control = this.attendanceForm.get(field);
    if (control?.hasError('required')) return 'Este campo es obligatorio';
    if (control?.hasError('minlength')) return 'CI debe tener al menos 5 caracteres';
    return '';
  }

  canSubmit(): boolean {
    return this.attendanceForm.valid && !this.isSubmitting();
  }

  onViewList(): void {
    this.viewList.emit();
  }
}
