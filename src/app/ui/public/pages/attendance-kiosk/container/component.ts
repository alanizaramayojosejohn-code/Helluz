import { Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, interval } from 'rxjs';
import { AttendanceService } from '../../../../../services/attendance/attendance.service';
import { ScheduleService } from '../../../../../services/schedule/schedule.service';
import { BranchService } from '../../../../../services/branch/branch.service';
import { Schedule } from '../../../../../models/schedule.model';
import { Branch } from '../../../../../models/branch.model';

@Component({
  selector: 'x-attendance-kiosk',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    DatePipe
  ],
  templateUrl: './component.html',
  styleUrl: './component.css'
})
export default class AttendanceKioskComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly attendanceService = inject(AttendanceService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly branchService = inject(BranchService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly currentTime = signal(new Date());

  branches$!: Observable<Branch[]>;
  schedules = signal<Schedule[]>([]);

  attendanceForm!: FormGroup;

  readonly hasError = computed(() => !!this.errorMessage());
  readonly hasSuccess = computed(() => !!this.successMessage());

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    this.setupClock();
    this.setupBranchListener();
  }

  private initForm(): void {
    this.attendanceForm = this.fb.group({
      branchId: ['', Validators.required],
      ci: ['', [Validators.required, Validators.pattern(/^\d{7,10}$/)]],
      scheduleId: ['', Validators.required]
    });
  }

  private loadBranches(): void {
    this.branches$ = this.branchService.getActiveBranches();
  }

  private setupClock(): void {
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentTime.set(new Date());
      });
  }

  private setupBranchListener(): void {
    this.attendanceForm.get('branchId')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((branchId) => {
        if (branchId) {
          this.loadSchedulesByBranch(branchId);
        } else {
          this.schedules.set([]);
        }
      });
  }

  private loadSchedulesByBranch(branchId: string): void {
    this.scheduleService.getSchedulesByBranch(branchId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (schedules) => {
          const activeSchedules = schedules.filter(s => s.status === 'activo');
          this.schedules.set(activeSchedules);
        },
        error: () => {
          this.schedules.set([]);
        }
      });
  }

  async onSubmit(): Promise<void> {
    if (this.attendanceForm.invalid) {
      this.attendanceForm.markAllAsTouched();
      this.showError('Por favor completa todos los campos');
      return;
    }

    this.isSubmitting.set(true);
    this.clearMessages();

    try {
      const formValue = this.attendanceForm.value;

      const result = await this.attendanceService.markAttendance({
        ci: formValue.ci,
        scheduleId: formValue.scheduleId
      });

      this.showSuccess(`${result.message} - Bienvenido/a ${result.personName}`);

      // Limpiar solo CI y horario
      this.attendanceForm.patchValue({
        ci: '',
        scheduleId: ''
      });

      // Focus en el input de CI
      setTimeout(() => {
        const ciInput = document.getElementById('ciInput');
        ciInput?.focus();
      }, 100);

      // Limpiar mensaje después de 5 segundos
      setTimeout(() => {
        this.successMessage.set(null);
      }, 5000);

    } catch (error) {
      this.handleError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    this.errorMessage.set(null);
  }

  private showError(message: string): void {
    this.errorMessage.set(message);
    this.successMessage.set(null);
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  private handleError(error: unknown): void {
    console.error('Error al marcar asistencia:', error);

    const errorMsg = error instanceof Error
      ? error.message
      : 'Error al registrar asistencia. Intenta de nuevo';

    this.showError(errorMsg);
  }

  getDisciplineName(disciplineId: string): string {
    return disciplineId;
  }

  getScheduleTime(schedule: Schedule): string {
    return `${schedule.startTime} - ${schedule.endTime}`;
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.attendanceForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  getFieldError(fieldName: string): string | null {
    const field = this.attendanceForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return null;

    const errors = field.errors;
    if (errors['required']) return 'Campo requerido';
    if (errors['pattern']) return 'CI inválido (7-10 dígitos)';

    return 'Error de validación';
  }
}
