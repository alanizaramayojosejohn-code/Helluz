import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { InstructorService } from '../../../../../../../services/instructor/instructor.service'
import { Instructor } from '../../../../../../../models/instructor.model'
import { ConfirmDialogService } from '../../../../../../../../shared/services/confirm-dialog.service'

@Component({
   selector: 'x-instructor-detail',
   imports: [],
   templateUrl: './component.html',
})
export class InstructorDetail implements OnInit {
   private readonly instructorService = inject(InstructorService)
   private readonly confirmDialog = inject(ConfirmDialogService)
   private readonly destroyRef = inject(DestroyRef)

   readonly instructorId = input.required<string>()
   readonly edit = output<string>()
   readonly back = output<void>()

   readonly instructor = signal<Instructor | null>(null)
   readonly isLoading = signal(true)
   readonly errorMessage = signal<string | null>(null)
   readonly isDeleting = signal(false)

   ngOnInit(): void {
      this.loadInstructor()
   }

   private loadInstructor(): void {
      this.isLoading.set(true)
      this.errorMessage.set(null)

      this.instructorService
         .getInstructorById(this.instructorId())
         .pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe({
            next: (instructor) => {
               if (instructor) {
                  this.instructor.set(instructor)
               } else {
                  this.errorMessage.set('Instructor no encontrado')
               }
               this.isLoading.set(false)
            },
            error: () => {
               this.errorMessage.set('Error al cargar instructor')
               this.isLoading.set(false)
            },
         })
   }

   onEdit(): void {
      this.edit.emit(this.instructorId())
   }

   onBack(): void {
      this.back.emit()
   }

   async onDelete(): Promise<void> {
      const instructor = this.instructor()
      if (!instructor) return

      this.confirmDialog.confirmDelete(this.getFullName(instructor), 'al instructor').subscribe(async (confirmed) => {
         if (!confirmed) return
         this.isDeleting.set(true)
         try {
            await this.instructorService.deleteInstructor(this.instructorId())
            this.back.emit()
         } catch (error) {
            this.errorMessage.set('Error al eliminar instructor')
            this.isDeleting.set(false)
         }
      })
   }

   getFullName(instructor: Instructor): string {
      return this.instructorService.getInstructorFullName(instructor)
   }

   getInitials(instructor: Instructor): string {
      return `${instructor.name.charAt(0)}${instructor.lastname.charAt(0)}`.toUpperCase()
   }
}
