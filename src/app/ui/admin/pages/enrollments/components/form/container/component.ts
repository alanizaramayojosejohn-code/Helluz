import { Component, computed, DestroyRef, HostListener, inject, input, OnInit, output, signal } from '@angular/core'
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { Observable, combineLatest, map, take, tap } from 'rxjs'
import { AsyncPipe } from '@angular/common'
import { EnrollmentService } from '../../../../../../../services/enrollment/enrollment.service'
import { BranchService } from '../../../../../../../services/branch/branch.service'
import { StudentService } from '../../../../../../../services/student/student.service'
import { MembershipService } from '../../../../../../../services/membership/membership.service'
import { AuthService } from '../../../../../../../services/auth/auth.service'
import { Enrollment, CreateEnrollmentDto, UpdateEnrollmentDto } from '../../../../../../../models/enrollment.model'
import { Branch } from '../../../../../../../models/branch.model'
import { Student } from '../../../../../../../models/student.model'
import { Membership } from '../../../../../../../models/membership.model'
import { Timestamp } from '@angular/fire/firestore'
import { ScheduleService } from '../../../../../../../services/schedule/schedule.service'
import { Schedule } from '../../../../../../../models/schedule.model'

@Component({
   selector: 'x-enrollment-form',
   standalone: true,
   imports: [ReactiveFormsModule, AsyncPipe],
   templateUrl: './component.html',
})
export class EnrollmentForm implements OnInit {
   private readonly fb = inject(FormBuilder)
   private readonly enrollmentService = inject(EnrollmentService)
   private readonly branchService = inject(BranchService)
   private readonly studentService = inject(StudentService)
   private readonly membershipService = inject(MembershipService)
   private readonly destroyRef = inject(DestroyRef)
   private readonly authService = inject(AuthService)
   private readonly scheduleService = inject(ScheduleService)

   readonly enrollmentId = input<string | null>(null)
   readonly isEditMode = input<boolean>(false)
   readonly cancel = output<void>()
   readonly saved = output<void>()

   readonly errorMessage = signal<string | null>(null)
   readonly isSubmitting = signal<boolean>(false)
   readonly currentEnrollment = signal<Enrollment | null>(null)
   readonly formValid = signal<boolean>(false)

   readonly searchText = signal<string>('')
   readonly showStudentDropdown = signal(false)
   readonly selectedStudent = signal<Student | null>(null)
   readonly showBranchDropdown = signal(false)
   readonly showScheduleDropdown = signal(false)
   readonly showMembershipDropdown = signal(false)

   readonly students$: Observable<Student[]> = combineLatest([
      this.studentService.getActiveStudents(),
      toObservable(this.searchText)
   ]).pipe(
      map(([students, term]) => {
         this.studentsCache = students; // Guardamos para el submit
         const lowTerm = term.toLowerCase().trim();
         if (!lowTerm) return students;

         return students.filter(s =>
            s.name.toLowerCase().includes(lowTerm) ||
            s.lastname.toLowerCase().includes(lowTerm) ||
            s.ci.includes(lowTerm)
         );
      })
   );

   brancheId = signal<string | null>(null)

   // ✅ Cambiar signals por observables
   branches$!: Observable<Branch[]>
   //students$!: Observable<Student[]>
   memberships$!: Observable<Membership[]>
   schedule$: Observable<Schedule[]> | null = null

   // ✅ Caches para desnormalización
   private branchesCache: Branch[] = []
   private studentsCache: Student[] = []
   private membershipsCache: Membership[] = []
   private scheduleCache: Schedule[] = []
   private currentUserId: string | null = null
   private currentUserName: string | null = null

   readonly hasErrors = computed(() => !!this.errorMessage())
   readonly canSubmit = computed(() => this.formValid() && !this.isSubmitting())

   readonly submitButtonText = computed(() => {
      if (this.isSubmitting()) return 'Guardando...'
      return this.isEditMode() ? 'Actualizar Inscripción' : 'Crear Inscripción'
   })

   readonly statusOptions = [
      { value: 'activa', label: 'Activa' },
      { value: 'vencida', label: 'Vencida' },
      { value: 'completada', label: 'Completada' },
      { value: 'cancelada', label: 'Cancelada' },
   ]

   readonly paymentMethodOptions = [
      { value: 'Efectivo', label: 'Efectivo' },
      { value: 'Qr', label: 'QR' },
   ]

   selectedMembership = signal<Membership | null>(null)

   enrollmentForm!: FormGroup

   ngOnInit(): void {
      this.initializeComponent()
   }

   private initializeComponent(): void {
      this.initForm()
      this.loadCurrentUser()
      this.loadData()
      this.setupMembershipListener()
      this.loadEnrollmentIfEditMode()
      this.setupBranchListener()
   }

   private loadCurrentUser(): void {
      this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
         if (user?.uid) {
            this.currentUserId = user.uid
            this.currentUserName = `${user.name} ${user.lastname}`
         }
      })
   }

   private initForm(): void {
      this.enrollmentForm = this.fb.group({
         studentId: ['', Validators.required],
         branchId: ['', Validators.required],
         membershipId: ['', Validators.required],
         scheduleId: ['', Validators.required],
         startDate: [this.toDateInputValue(new Date()), Validators.required],
         paymentMethod: ['Efectivo' as 'Efectivo' | 'Qr', Validators.required],
         status: ['activa' as 'activa' | 'vencida' | 'cancelada' | 'completada', Validators.required],
      })

      this.formValueChanges()
   }

   private toDateInputValue(date: Date): string {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
   }

   private formValueChanges(): void {
      this.enrollmentForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
         if (this.errorMessage()) {
            this.errorMessage.set(null)
         }
      })

      this.enrollmentForm.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
         this.formValid.set(this.enrollmentForm.valid)
      })
   }

   private setupBranchListener(): void {
      this.enrollmentForm
         .get('branchId')
         ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe((branchId) => {
            this.enrollmentForm.patchValue({ scheduleId: '' }, { emitEvent: false })

            if (branchId) {
               this.loadScheduleByBranch(branchId)
            } else {
               this.schedule$ = null
            }
         })
   }

   private loadScheduleByBranch(branchId: string): void {
      this.schedule$ = this.scheduleService
         .getSchedulesByBranch(branchId)
         .pipe(tap((schedules) => (this.scheduleCache = schedules)))
   }

   private loadData(): void {
      // Aquí solo cargas lo que no depende de filtros dinámicos
      this.branches$ = this.branchService.getActiveBranches().pipe(
         tap(b => this.branchesCache = b)
      );
      this.memberships$ = this.membershipService.getActiveMemberships().pipe(
         tap(m => this.membershipsCache = m)
      );
   }

   getBranchId(id: string): void {
      this.brancheId.set(id)
   }

   private setupMembershipListener(): void {
      this.enrollmentForm
         .get('membershipId')
         ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe((membershipId) => {
            const membership = this.membershipsCache.find((m) => m.id === membershipId)
            this.selectedMembership.set(membership || null)
         })
   }

   private loadEnrollmentIfEditMode(): void {
      const enrollmentId = this.enrollmentId()
      if (enrollmentId && this.isEditMode()) {
         this.loadEnrollment(enrollmentId)
      }
   }

   private loadEnrollment(id: string): void {
      this.enrollmentService
         .getEnrollmentById(id)
         .pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe({
            next: (enrollment) => {
               if (enrollment) {
                  this.currentEnrollment.set(enrollment)

                  const membership = this.membershipsCache.find((m) => m.id === enrollment.membershipId)
                  this.selectedMembership.set(membership || null)

                  this.enrollmentForm.patchValue({
                     studentId: enrollment.studentId,
                     branchId: enrollment.branchId,
                     membershipId: enrollment.membershipId,
                     startDate: this.toDateInputValue(enrollment.startDate.toDate()),
                     paymentMethod: enrollment.paymentMethod,
                     status: enrollment.status,
                  })

                  const cached = this.studentsCache.find(s => s.id === enrollment.studentId)
                  if (cached) {
                     this.selectedStudent.set(cached)
                  } else {
                     this.students$.pipe(take(1)).subscribe(students => {
                        const s = students.find(st => st.id === enrollment.studentId)
                        if (s) this.selectedStudent.set(s)
                     })
                  }
               }
            },
            error: () => this.errorMessage.set('Error al cargar inscripción'),
         })
   }

   async onSubmit(): Promise<void> {
      if (!this.validateForm()) {
         return
      }

      this.resetErrors()
      this.isSubmitting.set(true)

      try {
         await this.saveEnrollment()
         this.saved.emit()
      } catch (error) {
         this.handleSaveError(error)
      } finally {
         this.isSubmitting.set(false)
      }
   }

   private validateForm(): boolean {
      if (this.enrollmentForm.invalid) {
         this.enrollmentForm.markAllAsTouched()
         this.errorMessage.set('Por favor completa todos los campos requeridos correctamente')
         return false
      }
      return true
   }

   private resetErrors(): void {
      this.errorMessage.set(null)
   }

   private async saveEnrollment(): Promise<void> {
      const formValue = this.enrollmentForm.value
      const membership = this.selectedMembership()

      if (!this.currentUserId || !this.currentUserName) {
         throw new Error('No se pudo obtener el usuario actual')
      }

      if (!membership) {
         throw new Error('Membresía no seleccionada')
      }

      const student = this.studentsCache.find((s) => s.id === formValue.studentId)
      const branch = this.branchesCache.find((b) => b.id === formValue.branchId)
      const selectedSchedule = this.scheduleCache.find((s) => s.id === formValue.scheduleId)

      if (!student || !branch) {
         throw new Error('Datos incompletos')
      }

      // ✅ Fix 3: guarda el label antes de usarlo, con fallback seguro
      const scheduleLabel = selectedSchedule ? `${selectedSchedule.startTime} - ${selectedSchedule.endTime}` : ''

      const startDate = new Date(formValue.startDate)
      const endDate = this.enrollmentService.calculateEndDate(startDate, membership.durationDays)

      if (this.isEditMode() && this.enrollmentId()) {
         const currentEnrollment = this.currentEnrollment()
         if (!currentEnrollment) {
            throw new Error('No se pudo cargar la inscripción actual')
         }

         const updateData: UpdateEnrollmentDto = {
            studentId: student.id!,
            studentName: `${student.name} ${student.lastname}`,
            membershipId: membership.id!,
            membershipName: membership.name,
            branchId: branch.id!,
            branchName: branch.name,
            scheduleId: formValue.scheduleId,
            scheduleLabel: scheduleLabel, // ✅ Fix 1: era scheduleName
            instructorName: selectedSchedule?.instructorName ?? '',
            startDate: Timestamp.fromDate(startDate),
            endDate: Timestamp.fromDate(endDate),
            totalSessions: membership.totalSessions,
            usedSessions: currentEnrollment.usedSessions,
            remainingSessions: membership.totalSessions - currentEnrollment.usedSessions,
            allowedDays: membership.allowedDays,
            cost: membership.cost,
            paymentMethod: formValue.paymentMethod,
            status: formValue.status,
         }

         await this.enrollmentService.updateEnrollment(
            this.enrollmentId()!,
            updateData,
            this.currentUserId,
            this.currentUserName
         )
      } else {
         const createData: CreateEnrollmentDto = {
            studentId: student.id!,
            studentName: `${student.name} ${student.lastname}`,
            membershipId: membership.id!,
            membershipName: membership.name,
            branchId: branch.id!,
            branchName: branch.name,
            scheduleId: formValue.scheduleId,
            scheduleLabel: scheduleLabel,
            instructorName: selectedSchedule?.instructorName ?? '',
            startDate: Timestamp.fromDate(startDate), // ✅ Fix 2: faltaban estas dos
            endDate: Timestamp.fromDate(endDate),
            totalSessions: membership.totalSessions,
            usedSessions: 0,
            remainingSessions: membership.totalSessions,
            allowedDays: membership.allowedDays,
            cost: membership.cost,
            paymentMethod: formValue.paymentMethod,
            status: 'activa',
         }

         await this.enrollmentService.addEnrollment(createData, this.currentUserId, this.currentUserName)
      }
   }

   private handleSaveError(error: unknown): void {
      console.error('Error al guardar inscripción:', error)

      const errorMsg =
         error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : 'Error desconocido al guardar la inscripción'

      this.errorMessage.set(errorMsg)
   }

   @HostListener('document:click')
   closeAllDropdowns(): void {
      this.showStudentDropdown.set(false)
      this.showBranchDropdown.set(false)
      this.showScheduleDropdown.set(false)
      this.showMembershipDropdown.set(false)
   }

   onComboInput(event: Event): void {
      const input = event.target as HTMLInputElement
      this.searchText.set(input.value)
      this.showStudentDropdown.set(true)
   }

   onComboFocus(event: Event): void {
      event.stopPropagation()
      this.showStudentDropdown.set(true)
   }

   selectStudent(student: Student, event: Event): void {
      event.stopPropagation()
      this.selectedStudent.set(student)
      this.enrollmentForm.patchValue({ studentId: student.id })
      this.searchText.set('')
      this.showStudentDropdown.set(false)
   }

   clearStudent(event: Event): void {
      event.stopPropagation()
      this.selectedStudent.set(null)
      this.enrollmentForm.patchValue({ studentId: '' })
      this.searchText.set('')
   }

   toggleStudentDropdown(event: Event): void {
      event.stopPropagation()
      this.showStudentDropdown.update(v => !v)
   }

   selectBranch(branch: Branch, event: Event): void {
      event.stopPropagation()
      this.enrollmentForm.patchValue({ branchId: branch.id })
      this.showBranchDropdown.set(false)
   }

   toggleBranchDropdown(event: Event): void {
      event.stopPropagation()
      this.showBranchDropdown.update(v => !v)
      this.showScheduleDropdown.set(false)
      this.showMembershipDropdown.set(false)
   }

   selectSchedule(schedule: Schedule, event: Event): void {
      event.stopPropagation()
      this.enrollmentForm.patchValue({ scheduleId: schedule.id })
      this.showScheduleDropdown.set(false)
   }

   toggleScheduleDropdown(event: Event): void {
      event.stopPropagation()
      this.showScheduleDropdown.update(v => !v)
      this.showBranchDropdown.set(false)
      this.showMembershipDropdown.set(false)
   }

   selectMembership(membership: Membership, event: Event): void {
      event.stopPropagation()
      this.enrollmentForm.patchValue({ membershipId: membership.id })
      this.showMembershipDropdown.set(false)
   }

   toggleMembershipDropdown(event: Event): void {
      event.stopPropagation()
      this.showMembershipDropdown.update(v => !v)
      this.showBranchDropdown.set(false)
      this.showScheduleDropdown.set(false)
   }

   get selectedBranch(): Branch | null {
      const id = this.enrollmentForm.get('branchId')?.value
      return this.branchesCache.find(b => b.id === id) || null
   }

   get selectedScheduleItem(): Schedule | null {
      const id = this.enrollmentForm.get('scheduleId')?.value
      return this.scheduleCache.find(s => s.id === id) || null
   }

   onCancel(): void {
      this.cancel.emit()
   }

   getFieldError(fieldName: string): string | null {
      const field = this.enrollmentForm.get(fieldName)
      if (!field || !field.errors || !field.touched) return null

      const errors = field.errors
      if (errors['required']) return 'Campo requerido'

      return 'Error de validación'
   }

   hasFieldError(fieldName: string): boolean {
      const field = this.enrollmentForm.get(fieldName)
      return !!(field?.invalid && field?.touched)
   }

   getStudentFullName(student: Student): string {
      return `${student.name} ${student.lastname}`
   }

   getStatusLabel(status: string): string {
      const option = this.statusOptions.find((opt) => opt.value === status)
      return option?.label || status
   }
}
