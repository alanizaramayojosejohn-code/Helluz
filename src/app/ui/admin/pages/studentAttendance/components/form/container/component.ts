import { Component, inject, input, output, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EnrollmentService } from '../../../../../../../services/enrollment/enrollment.service';
import { Enrollment } from '../../../../../../../models/enrollment.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'x-enrollment-edit',
  standalone: true,
  imports: [ReactiveFormsModule],
  providers: [EnrollmentService],
  templateUrl: './component.html'
})
export class EnrollmentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly enrollmentService = inject(EnrollmentService);

  enrollmentId = input.required<string>();
  cancel = output<void>();
  saved = output<void>();

  enrollment = signal<Enrollment | null>(null);
  enrollmentForm!: FormGroup;

  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  readonly statusOptions = [
    { value: 'activa', label: 'Activa' },
    { value: 'vencida', label: 'Vencida' },
    { value: 'completada', label: 'Completada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadEnrollment();
  }

  private initForm(): void {
    this.enrollmentForm = this.fb.group({
      status: ['', Validators.required],
      notes: ['']
    });
  }

  private async loadEnrollment(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const enrollment = await firstValueFrom(
        this.enrollmentService.getEnrollmentById(this.enrollmentId())
      );

      if (!enrollment) {
        throw new Error('Inscripción no encontrada');
      }

      this.enrollment.set(enrollment);

      this.enrollmentForm.patchValue({
        status: enrollment.status
      });

    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al cargar la inscripción');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.enrollmentForm.invalid || this.isSaving()) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const { status } = this.enrollmentForm.value;

      await this.enrollmentService.updateEnrollmentStatus(
        this.enrollmentId(),
        status
      );

      this.saved.emit();

    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al actualizar la inscripción');
      this.isSaving.set(false);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  hasFieldError(field: string): boolean {
    const control = this.enrollmentForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldError(field: string): string {
    const control = this.enrollmentForm.get(field);
    if (control?.hasError('required')) return 'Este campo es obligatorio';
    return '';
  }

  canSubmit(): boolean {
    return this.enrollmentForm.valid && !this.isSaving() && this.enrollmentForm.dirty;
  }

  getStatusLabel(status: string): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option?.label || status;
  }

  getStatusTone(status: string): 'success' | 'error' | 'info' | 'muted' {
    switch (status) {
      case 'activa': return 'success';
      case 'vencida': return 'error';
      case 'completada': return 'info';
      case 'cancelada': return 'muted';
      default: return 'muted';
    }
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return '—';
    const date = typeof timestamp.toDate === 'function'
      ? timestamp.toDate()
      : (typeof timestamp.seconds === 'number'
          ? new Date(timestamp.seconds * 1000)
          : new Date(timestamp));
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
}
