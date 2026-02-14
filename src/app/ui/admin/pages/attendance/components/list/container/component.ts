// import { Component, DestroyRef, inject, OnInit, output, signal } from '@angular/core';
// import { MatTableModule } from '@angular/material/table';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatChipsModule } from '@angular/material/chips';
// import { MatSelectModule } from '@angular/material/select';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { MatTooltipModule } from '@angular/material/tooltip';
// import { FormsModule } from '@angular/forms';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { InstructorService } from '../../../../../../../services/instructor/instructor.service';
// import { BranchService } from '../../../../../../../services/branch/branch.service';
// import { Instructor } from '../../../../../../../models/instructor.model';

// @Component({
//   selector: 'x-instructor-list',
//   imports: [
//     MatTableModule,
//     MatButtonModule,
//     MatIconModule,
//     MatChipsModule,
//     MatSelectModule,
//     MatFormFieldModule,
//     MatProgressSpinnerModule,
//     MatTooltipModule,
//     FormsModule
//   ],
//   templateUrl: './component.html',
// })
// export class InstructorList implements OnInit {
//   private readonly instructorService = inject(InstructorService);
//   private readonly branchService = inject(BranchService);
//   private readonly destroyRef = inject(DestroyRef);

//   readonly createInstructor = output<void>();
//   readonly editInstructor = output<string>();
//   readonly viewDetail = output<string>();

//   readonly instructors = signal<Instructor[]>([]);
//   readonly branches = signal<any[]>([]);
//   readonly selectedBranchId = signal<string>('all');
//   readonly isLoading = signal(false);
//   readonly errorMessage = signal<string | null>(null);

//   readonly displayedColumns = ['name', 'ci', 'cellphone', 'email', 'branch', 'status', 'actions'];

//   ngOnInit(): void {
//     this.loadData();
//   }

//   private loadData(): void {
//     this.isLoading.set(true);
//     this.errorMessage.set(null);

//     this.branchService.getActiveBranches()
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (branches) => this.branches.set(branches),
//         error: () => this.errorMessage.set('Error al cargar sucursales')
//       });

//     this.instructorService.getInstructors()
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (instructors) => {
//           this.instructors.set(instructors);
//           this.isLoading.set(false);
//         },
//         error: () => {
//           this.errorMessage.set('Error al cargar instructores');
//           this.isLoading.set(false);
//         }
//       });
//   }

//   get filteredInstructors(): Instructor[] {
//     const branchId = this.selectedBranchId();
//     const allInstructors = this.instructors();

//     if (branchId === 'all') {
//       return allInstructors;
//     }

//     return allInstructors.filter(instructor => instructor.branchId === branchId);
//   }

//   onBranchFilterChange(branchId: string): void {
//     this.selectedBranchId.set(branchId);
//   }

//   onCreateInstructor(): void {
//     this.createInstructor.emit();
//   }

//   onEditInstructor(instructor: Instructor): void {
//     this.editInstructor.emit(instructor.id);
//   }

//   onViewDetail(instructor: Instructor): void {
//     this.viewDetail.emit(instructor.id);
//   }

//   getFullName(instructor: Instructor): string {
//     return this.instructorService.getInstructorFullName(instructor);
//   }

//   getInitials(instructor: Instructor): string {
//     return `${instructor.name.charAt(0)}${instructor.lastname.charAt(0)}`.toUpperCase();
//   }
// }
