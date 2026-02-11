import { Component, computed, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EnrollmentService } from '../../../../../../../services/enrollment/enrollment.service';
import { BranchService } from '../../../../../../../services/branch/branch.service';
import { StudentService } from '../../../../../../../services/student/student.service';
import { MembershipService } from '../../../../../../../services/membership/membership.service';
import { Enrollment, CreateEnrollmentDto } from '../../../../../../../models/enrollment.model';
import { Branch } from '../../../../../../../models/branch.model';
import { Student } from '../../../../../../../models/student.model';
import { Membership } from '../../../../../../../models/membership.model';
import { Observable, tap } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'x-enrollment-form',
  imports: [
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    AsyncPipe
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
  readonly formValid = signal<boolean>(false);

  // Observables
  branches$!: Observable<Branch[]>;
  students$!: Observable<Student[]>;
  memberships$!: Observable<Membership[]>;

  // Cache
  private branchesCache: Branch[] = [];
  private studentsCache: Student[] = [];
  private membershipsCache: Membership[] = [];

  // Computed
  selectedMembership = signal<Membership | null>(null);

  readonly hasErrors = computed(() => !!this.errorMessage());
  readonly canSubmit = computed(() => this.formValid() && !this.isSubmitting());

  readonly submitButtonText = computed(() => {
    if (this.isSubmitting()) return 'Guardando...';
    return this.isEditMode() ? 'Actualizar Inscripción' : 'Crear Inscripción';
  });

  enrollmentForm!: FormGroup;

  ngOnInit(): void {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    this.initForm();
    this.loadData();
    this.setupMembershipListener();
  }

  private initForm(): void {
    this.enrollmentForm = this.fb.group({
      studentId: ['', Validators.required],
      branchId: ['', Validators.required],
      membershipId: ['', Validators.required],
      startDate: [new Date(), Validators.required],
      paymentMethod: ['Efectivo', Validators.required]
    });

    this.formValueChanges();
  }

  private loadData(): void {
    this.branches$ = this.branchService.getActiveBranches().pipe(
      tap(branches => this.branchesCache = branches)
    );

    this.students$ = this.studentService.getActiveStudents().pipe(
      tap(students => this.studentsCache = students)
    );

    this.memberships$ = this.membershipService.getActiveMemberships().pipe(
      tap(memberships => this.membershipsCache = memberships)
    );
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

  private setupMembershipListener(): void {
    this.enrollmentForm.get('membershipId')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((membershipId) => {
        const membership = this.membershipsCache.find(m => m.id === membershipId);
        this.selectedMembership.set(membership || null);
      });
  }

  async onSubmit(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    this.errorMessage.set(null);
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
      this.errorMessage.set('Por favor completa todos los campos requeridos');
      return false;
    }
    return true;
  }

  private async saveEnrollment(): Promise<void> {
    const formValue = this.enrollmentForm.value;
    const membership = this.selectedMembership();

    if (!membership) {
      throw new Error('Membresía no seleccionada');
    }

    // Obtener datos desnormalizados
    const student = this.studentsCache.find(s => s.id === formValue.studentId);
    const branch = this.branchesCache.find(b => b.id === formValue.branchId);

    if (!student || !branch) {
      throw new Error('Datos incompletos');
    }

    // Calcular fechas
    const startDate = new Date(formValue.startDate);
    const endDate = this.enrollmentService.calculateEndDate(startDate, membership.durationDays);

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

  private handleSaveError(error: unknown): void {
    console.error('Error al guardar inscripción:', error);

    const errorMsg = error instanceof Error
      ? error.message
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

  getStudentFullName(student: Student): string {
    return `${student.name} ${student.lastname}`;
  }
}
