// components/list/container/component.ts
import { Component, DestroyRef, inject, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Student } from '../../../../../../../models/student.model';
import { StudentService } from '../../../../../../../services/student/student.service';

@Component({
  selector: 'x-student-list',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    AsyncPipe,
  ],
  templateUrl: './component.html',
})
export class StudentList implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly createStudent = output<void>();
  readonly editStudent = output<string>();
  readonly viewDetail = output<string>();

  students$!: Observable<Student[]>;

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly statusFilter = signal<'all' | 'activo' | 'inactivo'>('all');

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.students$ = this.studentService.getStudents();

    this.students$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.isLoading.set(false),
        error: () => {
          this.errorMessage.set('Error al cargar estudiantes');
          this.isLoading.set(false);
        },
      });
  }

  onCreateStudent(): void {
    this.createStudent.emit();
  }

  onEditStudent(student: Student): void {
    if (student.id) {
      this.editStudent.emit(student.id);
    }
  }

  onViewDetail(student: Student): void {
    if (student.id) {
      this.viewDetail.emit(student.id);
    }
  }

  async onToggleStatus(student: Student): Promise<void> {
    if (!student.id) return;

    try {
      await this.studentService.toggleStatus(student.id, student.status);
    } catch (error) {
      this.errorMessage.set('Error al cambiar el estado');
    }
  }

  onStatusFilterChange(status: 'all' | 'activo' | 'inactivo'): void {
    this.statusFilter.set(status);
  }

  filterStudents(students: Student[]): Student[] {
    const filter = this.statusFilter();
    if (filter === 'all') return students;
    return students.filter(s => s.status === filter);
  }

  getFullName(student: Student): string {
    return `${student.name} ${student.lastname}`;
  }
}
