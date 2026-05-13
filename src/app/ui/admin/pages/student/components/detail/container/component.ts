// components/detail/container/component.ts
import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { StudentService } from '../../../../../../../services/student/student.service';
import { Student } from '../../../../../../../models/student.model';
import { ConfirmDialogService } from '../../../../../../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'x-student-detail',
  imports: [DatePipe],
  templateUrl: './component.html',
})
export class StudentDetail implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly studentId = input.required<string>();

  readonly edit = output<string>();
  readonly close = output<void>();

  readonly student = signal<Student | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadStudent();
  }

  private loadStudent(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.studentService
      .getStudentById(this.studentId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (student) => {
          if (student) {
            this.student.set(student);
          } else {
            this.errorMessage.set('Estudiante no encontrado');
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Error al cargar el estudiante');
          this.isLoading.set(false);
        },
      });
  }

  onEdit(): void {
    const id = this.studentId();
    if (id) {
      this.edit.emit(id);
    }
  }

  onClose(): void {
    this.close.emit();
  }

  async onToggleStatus(): Promise<void> {
    const student = this.student();
    if (!student?.id) return;

    try {
      await this.studentService.toggleStatus(student.id, student.status);
    } catch (error) {
      this.errorMessage.set('Error al cambiar el estado');
    }
  }

  async onDelete(): Promise<void> {
    const student = this.student();
    if (!student?.id) return;

    this.confirmDialog
      .confirmDelete(`${student.name} ${student.lastname}`, 'al estudiante')
      .subscribe(async (confirmed) => {
        if (!confirmed) return;
        try {
          this.isLoading.set(true);
          await this.studentService.deleteStudent(student.id!);
          this.close.emit();
        } catch (error) {
          this.errorMessage.set('Error al eliminar el estudiante');
          this.isLoading.set(false);
        }
      });
  }

  getFullName(): string {
    const student = this.student();
    if (!student) return '';
    return `${student.name} ${student.lastname}`;
  }

  getInitials(): string {
    const s = this.student();
    if (!s) return '?';
    const first = s.name?.[0] ?? '';
    const last = s.lastname?.[0] ?? '';
    return (first + last).toUpperCase() || '?';
  }

  getCreatedAtDate(): Date | null {
    const student = this.student();
    if (!student?.createdAt) return null;
    return student.createdAt.toDate();
  }

  getUpdatedAtDate(): Date | null {
    const student = this.student();
    if (!student?.updatedAt) return null;
    return student.updatedAt.toDate();
  }
}
