import { Component, computed, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { EnrollmentService } from '../../../../../../../services/enrollment/enrollment.service';
import { BranchService } from '../../../../../../../services/branch/branch.service';
import { StudentService } from '../../../../../../../services/student/student.service';
import { MembershipService } from '../../../../../../../services/membership/membership.service';
import { Enrollment, CreateEnrollmentDto, UpdateEnrollmentDto } from '../../../../../../../models/enrollment.model';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'x-enrollment-form',
  standalone: true,
  imports: [
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatFormFieldModule
  ],
  templateUrl: './component.html',
})
export class EnrollmentForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly branchService = inject(BranchService);
  private readonly studentService = inject(StudentService);
  private readonly membershipService = inject(MembershipService);
  private readonly destroyRef = inject(DestroyRef);

  readonly enrollmentId = input<string | null>(null);
  readonly isEditMode = input<boolean>(false);
  readonly cancel = output<void>();
  readonly saved = output<void>();

  readonly errorMessage = signal<string | null>(null);
  readonly isSubmitting = signal<boolean>(false);
  readonly currentEnrollment = signal<Enrollment | null>(null);
  readonly formValid = signal<boolean>(false);
  readonly branches = signal<any[]>([]);
  readonly students = signal<any[]>([]);
  readonly memberships = signal<any[]>([]);

  readonly hasErrors = computed(() => !!this.errorMessage());
  readonly canSubmit = computed(() => this.formValid() && !this.isSubmitting());

  readonly submitButtonText = computed(() => {
    if (this.isSubmitting()) return 'Guardando...';
    return this.isEditMode() ? 'Actualizar Inscripción' : 'Crear Inscripción';
  });

  readonly statusOptions = [
    { value: 'activa', label: 'Activa' },
    { value: 'vencida', label: 'Vencida' },
    { value: 'completada', label: 'Completada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  readonly paymentMethodOptions = [
    { value: 'Efectivo', label: 'Efectivo' },
    { value: 'Qr', label: 'QR' }
  ];

  selectedMembership = signal<any | null>(null);

  enrollmentForm!: FormGroup;

  ngOnInit(): void {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    this.initForm();
    this.loadData();
    this.setupMembershipListener();
    this.loadEnrollmentIfEditMode();
  }

  private initForm(): void {
    this.enrollmentForm = this.fb.group({
      studentId: ['', Validators.required],
      branchId: ['', Validators.required],
      membershipId: ['', Validators.required],
      startDate: [new Date(), Validators.required],
      paymentMethod: ['Efectivo' as 'Efectivo' | 'Qr', Validators.required],
      status: ['activa' as 'activa' | 'vencida' | 'cancelada' | 'completada', Validators.required]
    });

    this.formValueChanges();
  }

  private formValueChanges(): void {
    this.enrollmentForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.errorMessage()) {
          this.errorMessage.set(null);
        }
      });

    this.enrollmentForm.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formValid.set(this.enrollmentForm.valid);
      });
  }

  private loadData(): void {
    this.branchService
      .getActiveBranches()
      .pipe(
        tap(branches => this.branches.set(branches)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        error: () => this.errorMessage.set('Error al cargar sucursales')
      });

    this.studentService
      .getActiveStudents()
      .pipe(
        tap(students => this.students.set(students)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        error: () => this.errorMessage.set('Error al cargar estudiantes')
      });

    this.membershipService
      .getActiveMemberships()
      .pipe(
        tap(memberships => this.memberships.set(memberships)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        error: () => this.errorMessage.set('Error al cargar membresías')
      });
  }

  private setupMembershipListener(): void {
    this.enrollmentForm.get('membershipId')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((membershipId) => {
        const membership = this.memberships().find(m => m.id === membershipId);
        this.selectedMembership.set(membership || null);
      });
  }

  private loadEnrollmentIfEditMode(): void {
    const enrollmentId = this.enrollmentId();
    if (enrollmentId && this.isEditMode()) {
      this.loadEnrollment(enrollmentId);
    }
  }

  private loadEnrollment(id: string): void {
    this.enrollmentService
      .getEnrollmentById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (enrollment) => {
          if (enrollment) {
            this.currentEnrollment.set(enrollment);

            const membership = this.memberships().find(m => m.id === enrollment.membershipId);
            this.selectedMembership.set(membership || null);

            this.enrollmentForm.patchValue({
              studentId: enrollment.studentId,
              branchId: enrollment.branchId,
              membershipId: enrollment.membershipId,
              startDate: enrollment.startDate.toDate(),
              paymentMethod: enrollment.paymentMethod,
              status: enrollment.status
            });
          }
        },
        error: () => this.errorMessage.set('Error al cargar inscripción')
      });
  }

  async onSubmit(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    this.resetErrors();
    this.isSubmitting.set(true);

    try {
      await this.saveEnrollment();
      this.saved.emit();
    } catch (error) {
      this.handleSaveError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private validateForm(): boolean {
    if (this.enrollmentForm.invalid) {
      this.enrollmentForm.markAllAsTouched();
      this.errorMessage.set('Por favor completa todos los campos requeridos correctamente');
      return false;
    }
    return true;
  }

  private resetErrors(): void {
    this.errorMessage.set(null);
  }

  private async saveEnrollment(): Promise<void> {
    const formValue = this.enrollmentForm.value;
    const membership = this.selectedMembership();

    if (!membership) {
      throw new Error('Membresía no seleccionada');
    }

    const student = this.students().find(s => s.id === formValue.studentId);
    const branch = this.branches().find(b => b.id === formValue.branchId);

    if (!student || !branch) {
      throw new Error('Datos incompletos');
    }

    const startDate = new Date(formValue.startDate);
    const endDate = this.enrollmentService.calculateEndDate(startDate, membership.durationDays);

    if (this.isEditMode() && this.enrollmentId()) {
      const currentEnrollment = this.currentEnrollment();
      if (!currentEnrollment) {
        throw new Error('No se pudo cargar la inscripción actual');
      }

      const updateData: UpdateEnrollmentDto = {
        studentId: student.id!,
        studentName: `${student.name} ${student.lastname}`,
        membershipId: membership.id!,
        membershipName: membership.name,
        branchId: branch.id!,
        branchName: branch.name,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        totalSessions: membership.totalSessions,
        usedSessions: currentEnrollment.usedSessions,
        remainingSessions: membership.totalSessions - currentEnrollment.usedSessions,
        allowedDays: membership.allowedDays,
        cost: membership.cost,
        paymentMethod: formValue.paymentMethod,
        status: formValue.status
      };

      await this.enrollmentService.updateEnrollment(this.enrollmentId()!, updateData);
    } else {
      const createData: CreateEnrollmentDto = {
        studentId: student.id!,
        studentName: `${student.name} ${student.lastname}`,
        membershipId: membership.id!,
        membershipName: membership.name,
        branchId: branch.id!,
        branchName: branch.name,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        totalSessions: membership.totalSessions,
        usedSessions: 0,
        remainingSessions: membership.totalSessions,
        allowedDays: membership.allowedDays,
        cost: membership.cost,
        paymentMethod: formValue.paymentMethod,
        status: 'activa'
      };

      await this.enrollmentService.addEnrollment(createData);
    }
  }

  private handleSaveError(error: unknown): void {
    console.error('Error al guardar inscripción:', error);

    const errorMsg = error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Error desconocido al guardar la inscripción';

    this.errorMessage.set(errorMsg);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  getFieldError(fieldName: string): string | null {
    const field = this.enrollmentForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return null;

    const errors = field.errors;
    if (errors['required']) return 'Campo requerido';

    return 'Error de validación';
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.enrollmentForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  getStudentFullName(student: any): string {
    return `${student.name} ${student.lastname}`;
  }

  getStatusLabel(status: string): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option?.label || status;
  }
}
