import { Component, DestroyRef, HostListener, inject, OnInit, output, signal } from '@angular/core'
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
import { FormsModule } from '@angular/forms'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { EnrollmentService } from '../../../../../../../services/enrollment/enrollment.service'
import { BranchService } from '../../../../../../../services/branch/branch.service'
import { AuthService } from '../../../../../../../services/auth/auth.service'
import { Enrollment } from '../../../../../../../models/enrollment.model'
import { Branch } from '../../../../../../../models/branch.model'
import { DocumentSnapshot } from '@angular/fire/firestore'
import { Observable, tap, take, Subject, debounceTime, distinctUntilChanged } from 'rxjs'

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
      FormsModule,
   ],
   templateUrl: './component.html',
})
export class EnrollmentList implements OnInit {
   private readonly enrollmentService = inject(EnrollmentService)
   private readonly branchService = inject(BranchService)
   private readonly authService = inject(AuthService)
   private readonly destroyRef = inject(DestroyRef)

   readonly createEnrollment = output<void>()
   readonly editEnrollment = output<string>()
   readonly viewDetail = output<string>()

   readonly enrollments = signal<Enrollment[]>([])
   branches$!: Observable<Branch[]>

   readonly pageSize = 20
   currentPage = signal(0)
   hasMore = signal(true)

   private pageHistory: (DocumentSnapshot | null)[] = [null]
   private lastDoc: DocumentSnapshot | null = null

   readonly showBranchDropdown = signal(false)
   readonly selectedBranchId = signal<string | null>(null)
   readonly selectedStatus = signal<string>('all')
   readonly isBranchAdmin = signal(false)
   private branchesCache: Branch[] = []

   readonly isLoading = signal(false)
   readonly errorMessage = signal<string | null>(null)
   readonly searchTerm = signal<string>('')
   readonly isSearching = signal(false)
   readonly searchResultsCount = signal(0)
   private readonly searchInput$ = new Subject<string>()

   ngOnInit(): void {
      this.searchInput$
         .pipe(debounceTime(2000), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
         .subscribe((term) => this.handleSearch(term))

      this.authService.currentUser$.pipe(take(1)).subscribe(user => {
         if ((user?.role === 'admin' || user?.role === 'instructor') && user.branchId) {
            this.isBranchAdmin.set(true)
            this.selectedBranchId.set(user.branchId)
         }
         this.loadBranches()
         this.loadPage(0)
      })
   }

   onSearchInput(value: string): void {
      this.searchTerm.set(value)
      this.searchInput$.next(value.trim())
   }

   clearSearch(): void {
      this.searchTerm.set('')
      this.searchInput$.next('')
   }

   private async handleSearch(term: string): Promise<void> {
      if (term.length >= 2) {
         this.isSearching.set(true)
         this.isLoading.set(true)
         const results = await this.enrollmentService.searchEnrollments(
            term,
            this.selectedBranchId() || undefined,
            this.selectedStatus()
         )
         this.enrollments.set(results)
         this.searchResultsCount.set(results.length)
         this.isLoading.set(false)
      } else if (this.isSearching()) {
         this.isSearching.set(false)
         this.searchResultsCount.set(0)
         await this.loadPage(this.currentPage())
      }
   }

   private loadBranches(): void {
      this.branches$ = this.branchService.getActiveBranches().pipe(
         tap(branches => this.branchesCache = branches)
      )
   }

   @HostListener('document:click')
   closeBranchDropdown(): void {
      this.showBranchDropdown.set(false)
   }

   toggleBranchDropdown(event: Event): void {
      event.stopPropagation()
      this.showBranchDropdown.update(v => !v)
   }

   async selectBranch(branchId: string, event: Event): Promise<void> {
      event.stopPropagation()
      this.showBranchDropdown.set(false)
      await this.onBranchFilterChange(branchId)
   }

   get selectedBranchName(): string {
      if (!this.selectedBranchId()) return 'Todas las sucursales'
      return this.branchesCache.find(b => b.id === this.selectedBranchId())?.name || 'Todas las sucursales'
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
         this.enrollments.set(result.enrollments)

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
      if (this.isSearching()) {
         const term = this.searchTerm().trim().toLowerCase()
         if (term.length >= 2) await this.handleSearch(term)
      } else {
         this.resetPagination()
         await this.loadPage(0)
      }
   }

   async onStatusFilterChange(status: string): Promise<void> {
      this.selectedStatus.set(status)
      if (this.isSearching()) {
         const term = this.searchTerm().trim().toLowerCase()
         if (term.length >= 2) await this.handleSearch(term)
      } else {
         this.resetPagination()
         await this.loadPage(0)
      }
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
