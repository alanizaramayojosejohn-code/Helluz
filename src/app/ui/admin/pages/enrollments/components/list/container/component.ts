import { Component, DestroyRef, inject, OnInit, output, signal } from '@angular/core'
import { MatTableModule } from '@angular/material/table'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatChipsModule } from '@angular/material/chips'
import { MatSelectModule } from '@angular/material/select'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator'
import { AsyncPipe, DatePipe } from '@angular/common'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { EnrollmentService } from '../../../../../../../services/enrollment/enrollment.service'
import { BranchService } from '../../../../../../../services/branch/branch.service'
import { Enrollment } from '../../../../../../../models/enrollment.model'
import { Branch } from '../../../../../../../models/branch.model'
import { DocumentSnapshot } from '@angular/fire/firestore'
import { Observable } from 'rxjs'

@Component({
   selector: 'x-enrollment-list',
   imports: [
      MatTableModule,
      MatButtonModule,
      MatIconModule,
      MatChipsModule,
      MatSelectModule,
      MatFormFieldModule,
      MatProgressSpinnerModule,
      MatTooltipModule,
      MatPaginatorModule,
      DatePipe,
      AsyncPipe,
   ],
   templateUrl: './component.html',
})
export class EnrollmentList implements OnInit {
   private readonly enrollmentService = inject(EnrollmentService)
   private readonly branchService = inject(BranchService)
   private readonly destroyRef = inject(DestroyRef)

   readonly createEnrollment = output<void>()
   readonly editEnrollment = output<string>()
   readonly viewDetail = output<string>()

   enrollments$!: Observable<Enrollment[]>
   branches$!: Observable<Branch[]>

   readonly pageSize = 20
   currentPage = signal(0)
   hasMore = signal(true)

   private pageHistory: (DocumentSnapshot | null)[] = [null]
   private lastDoc: DocumentSnapshot | null = null

   private selectedBranchId = signal<string | null>(null)
   private selectedStatus = signal<string>('all')

   readonly isLoading = signal(false)
   readonly errorMessage = signal<string | null>(null)

   ngOnInit(): void {
      this.loadBranches()
      this.loadPage(0)
   }

   private loadBranches(): void {
      this.branches$ = this.branchService.getActiveBranches()
   }

   private async loadPage(pageIndex: number): Promise<void> {
      this.isLoading.set(true)
      this.errorMessage.set(null)

      try {
         await this.enrollmentService.checkExpiredEnrollments()

         const cursor = this.pageHistory[pageIndex] || null
         const result = await this.enrollmentService.getEnrollmentsPage(
            this.pageSize,
            cursor,
            this.selectedBranchId() || undefined,
            this.selectedStatus()
         )
         this.enrollments$ = new Observable<Enrollment[]>((observer) => {
            observer.next(result.enrollments)
            observer.complete()
         })

         this.lastDoc = result.lastDoc
         this.hasMore.set(result.hasMore)
         this.currentPage.set(pageIndex)

         if (result.hasMore && this.pageHistory.length === pageIndex + 1) {
            this.pageHistory.push(result.lastDoc)
         }
      } catch (error) {
         console.error('Error al cargar página:', error)
         this.errorMessage.set('Error al cargar inscripciones')
      } finally {
         this.isLoading.set(false)
      }
   }

   onPageChange(event: PageEvent): void {
      this.loadPage(event.pageIndex)
   }

   async onBranchFilterChange(branchId: string): Promise<void> {
      this.selectedBranchId.set(branchId === 'all' ? null : branchId)
      this.resetPagination()
      await this.loadPage(0)
   }

   async onStatusFilterChange(status: string): Promise<void> {
      this.selectedStatus.set(status)
      this.resetPagination()
      await this.loadPage(0)
   }

   private resetPagination(): void {
      this.currentPage.set(0)
      this.pageHistory = [null]
      this.lastDoc = null
   }

   onCreateEnrollment(): void {
      this.createEnrollment.emit()
   }

   onEditEnrollment(enrollment: Enrollment): void {
      this.editEnrollment.emit(enrollment.id)
   }

   onViewDetail(enrollment: Enrollment): void {
      this.viewDetail.emit(enrollment.id)
   }

   getStatusClass(status: string): string {
      const classes: Record<string, string> = {
         activa: 'bg-green-500 text-green-800',
         vencida: 'bg-red-100 text-red-800',
         cancelada: 'bg-gray-100 text-gray-800',
         completada: 'bg-blue-100 text-blue-800',
      }
      return classes[status] || 'bg-gray-100 text-gray-800'
   }

   // getStatusClass(status: string): string {
   //   switch(status){
   //     case 'activa':
   //        return 'bg-green-500 text-green-800';
   //        case 'vencida':
   //        return 'bg-red-100 text-red-800';
   //        case 'cancelada':
   //        return 'bg-gray-100 text-gray-800';
   //        case 'completada':
   //        return 'bg-blue-100 text-blue-800';
   //        default:
   //         return'';
   //     }
   //  }

   getPaymentStatusClass(method: string): string {
      const classes: Record<string, string> = {
         Efectivo: 'bg-green-100 text-green-800',
         Qr: 'bg-blue-100 text-blue-800',
      }
      return classes[method] || 'bg-gray-100 text-gray-800'
   }

   getSessionsProgress(enrollment: Enrollment): number {
      return (enrollment.usedSessions / enrollment.totalSessions) * 100
   }

   isExpiringSoon(enrollment: Enrollment): boolean {
      if (enrollment.status !== 'activa') return false

      const today = new Date()
      const endDate = enrollment.endDate.toDate()
      const daysLeft = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      return daysLeft <= 7 && daysLeft >= 0
   }

   getDaysLeft(enrollment: Enrollment): number {
      const today = new Date()
      const endDate = enrollment.endDate.toDate()
      return Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
   }
}
