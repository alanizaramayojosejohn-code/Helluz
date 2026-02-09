// components/form/container/component.ts
import { Component, DestroyRef, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StudentService } from '../../../../../../../services/student/student.service';
import { CreateStudentDto, UpdateStudentDto } from '../../../../../../../models/student.model';

@Component({
  selector: 'x-student-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './component.html',
})
export class StudentForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly studentService = inject(StudentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly studentId = input<string | null>(null);
  readonly isEditMode = input<boolean>(false);

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  studentForm!: FormGroup;

  readonly isSubmitting = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.studentId();
      if (id) {
        this.loadStudent(id);
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.studentForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      lastname: ['', [Validators.required, Validators.minLength(2)]],
      ci: ['', [Validators.required, Validators.minLength(5)]],
      cellphone: ['', [Validators.required, Validators.minLength(8)]],
      email: ['', [Validators.email]],
      emergencyContact: [''],
      emergencyPhone: [''],
      status: ['activo', Validators.required],
    });
  }

  private loadStudent(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.studentService
      .getStudentById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (student) => {
          if (student) {
            this.studentForm.patchValue({
              name: student.name,
              lastname: student.lastname,
              ci: student.ci,
              cellphone: student.cellphone,
              email: student.email || '',
              emergencyContact: student.emergencyContact || '',
              emergencyPhone: student.emergencyPhone || '',
              status: student.status,
            });
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Error al cargar el estudiante');
          this.isLoading.set(false);
        },
      });
  }

  async onSubmit(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    this.resetErrors();
    this.isSubmitting.set(true);

    try {
      await this.saveStudent();
      this.saved.emit();
    } catch (error) {
      this.handleSaveError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private validateForm(): boolean {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      this.errorMessage.set('Por favor, completa todos los campos requeridos');
      return false;
    }
    return true;
  }

  private async saveStudent(): Promise<void> {
    const formValue = this.studentForm.value;

    if (this.isEditMode() && this.studentId()) {
      const updateData: UpdateStudentDto = {
        ...formValue,
        email: formValue.email || undefined,
        emergencyContact: formValue.emergencyContact || undefined,
        emergencyPhone: formValue.emergencyPhone || undefined,
      };
      await this.studentService.updateStudent(this.studentId()!, updateData);
    } else {
      const createData: CreateStudentDto = {
        ...formValue,
        email: formValue.email || undefined,
        emergencyContact: formValue.emergencyContact || undefined,
        emergencyPhone: formValue.emergencyPhone || undefined,
      };
      await this.studentService.createStudent(createData);
    }
  }

  private resetErrors(): void {
    this.errorMessage.set(null);
  }

  private handleSaveError(error: unknown): void {
    const message = error instanceof Error ? error.message : 'Error al guardar estudiante';
    this.errorMessage.set(message);
    console.error('Error al guardar estudiante:', error);
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  getFormTitle(): string {
    return this.isEditMode() ? 'Editar Estudiante' : 'Registrar Estudiante';
  }

  hasError(field: string): boolean {
    const control = this.studentForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.studentForm.get(field);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control.hasError('minLength')) {
      return `Mínimo ${control.getError('minLength').requiredLength} caracteres`;
    }
    if (control.hasError('email')) {
      return 'Email no válido';
    }
    return '';
  }
}
