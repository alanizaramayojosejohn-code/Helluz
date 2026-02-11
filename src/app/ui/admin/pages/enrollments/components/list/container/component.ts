import { Component, DestroyRef, inject, OnInit, output, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AsyncPipe, DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EnrollmentService } from '../../../../../../../services/enrollment/enrollment.service';
import { BranchService } from '../../../../../../../services/branch/branch.service';
import { Enrollment } from '../../../../../../../models/enrollment.model';
import { Branch } from '../../../../../../../models/branch.model';
import { Observable, BehaviorSubject, switchMap } from 'rxjs';

@Component({
  selector: 'x-enrollment-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    AsyncPipe,
    DatePipe
  ],
  templateUrl: './component.html',
})
export class EnrollmentList implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly branchService = inject(BranchService);
  private readonly destroyRef = inject(DestroyRef);

  readonly createEnrollment = output<void>();
  readonly editEnrollment = output<string>();
  readonly viewDetail = output<string>();

  enrollments$!: Observable<Enrollment[]>;
  branches$!: Observable<Branch[]>;

  private selectedBranchId$ = new BehaviorSubject<string | null>(null);
  private selectedStatus$ = new BehaviorSubject<string>('all');

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly displayedColumns = [
    'student',
    'membership',
    'branch',
    'dates',
    'sessions',
    'payment',
    'status',
    'actions'
  ];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.branches$ = this.branchService.getActiveBranches();

    // Cargar enrollments reactivos según filtros
    this.enrollments$ = this.selectedBranchId$.pipe(
      switchMap(branchId => {
        if (branchId) {
          return this.enrollmentService.getEnrollmentsByBranch(branchId);
        } else {
          return this.enrollmentService.getEnrollments();
        }
      }),
      takeUntilDestroyed(this.destroyRef)
    );

    this.enrollments$.subscribe({
      next: () => this.isLoading.set(false),
      error: () => {
        this.errorMessage.set('Error al cargar inscripciones');
        this.isLoading.set(false);
      }
    });
  }

  onBranchFilterChange(branchId: string): void {
    this.selectedBranchId$.next(branchId === 'all' ? null : branchId);
  }

  onStatusFilterChange(status: string): void {
    this.selectedStatus$.next(status);
  }

  onCreateEnrollment(): void {
    this.createEnrollment.emit();
  }

  onEditEnrollment(enrollment: Enrollment): void {
    this.editEnrollment.emit(enrollment.id);
  }

  onViewDetail(enrollment: Enrollment): void {
    this.viewDetail.emit(enrollment.id);
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'activa': 'bg-green-100 text-green-800',
      'vencida': 'bg-red-100 text-red-800',
      'cancelada': 'bg-gray-100 text-gray-800',
      'completada': 'bg-blue-100 text-blue-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getPaymentStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'pagado': 'bg-green-100 text-green-800',
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'parcial': 'bg-orange-100 text-orange-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getSessionsProgress(enrollment: Enrollment): number {
    return (enrollment.usedSessions / enrollment.totalSessions) * 100;
  }

  isExpiringSoon(enrollment: Enrollment): boolean {
    if (enrollment.status !== 'activa') return false;

    const today = new Date();
    const endDate = enrollment.endDate.toDate();
    const daysLeft = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return daysLeft <= 7 && daysLeft >= 0;
  }

  getDaysLeft(enrollment: Enrollment): number {
    const today = new Date();
    const endDate = enrollment.endDate.toDate();
    return Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
}
