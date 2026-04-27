import { Component, computed, effect, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { switchMap, of } from 'rxjs'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'

import { AuthService } from '../../../../services/auth/auth.service'
import { StudentService } from '../../../../services/student/student.service'
import { StudentQueryService } from '../../../../services/student/student-query.service'
import { EnrollmentService } from '../../../../services/enrollment/enrollment.service'
import { EnrollmentQueryService } from '../../../../services/enrollment/enrollment-query.service'
import { StudentAttendanceQueryService } from '../../../../services/studentAttendance/student-attendance-query.service'
import { BranchService } from '../../../../services/branch/branch.service'
import { QueryService as BranchQueryService } from '../../../../services/branch/query.service'
import { ScheduleQueryService } from '../../../../services/schedule/schedule-query.service'

import { AuthUser } from '../../../../models/user.model'
import { Branch } from '../../../../models/branch.model'
import { Student } from '../../../../models/student.model'
import { Enrollment } from '../../../../models/enrollment.model'
import { StudentAttendance } from '../../../../models/studentattendance.model'
import { Schedule } from '../../../../models/schedule.model'

interface WeekBar {
   label: string
   count: number
   heightPx: number
   isToday: boolean
   isPast: boolean
}

interface RecentRow extends StudentAttendance {
   branchName: string
   timeLabel: string
}

@Component({
   selector: 'app-home',
   standalone: true,
   imports: [CommonModule, FormsModule, RouterLink],
   providers: [
      StudentService,
      StudentQueryService,
      EnrollmentService,
      EnrollmentQueryService,
      StudentAttendanceQueryService,
      BranchService,
      BranchQueryService,
      ScheduleQueryService,
   ],
   templateUrl: './home.component.html',
})
export default class Home {
   private readonly authService = inject(AuthService)
   private readonly studentService = inject(StudentService)
   private readonly enrollmentService = inject(EnrollmentService)
   private readonly attendanceQuery = inject(StudentAttendanceQueryService)
   private readonly branchService = inject(BranchService)
   private readonly scheduleQuery = inject(ScheduleQueryService)

   readonly user = toSignal(this.authService.currentUser$, {
      initialValue: null as AuthUser | null,
   })

   readonly branches = toSignal(this.branchService.getActiveBranches(), {
      initialValue: [] as Branch[],
   })

   readonly selectedBranchId = signal<string>('')

   private readonly branchId$ = toObservable(this.selectedBranchId)

   readonly activeStudents = toSignal(this.studentService.getActiveStudents(), {
      initialValue: [] as Student[],
   })

   readonly schedulesActive = toSignal(this.scheduleQuery.getActive(), {
      initialValue: [] as Schedule[],
   })

   readonly allEnrollments = toSignal(this.enrollmentService.getEnrollments(), {
      initialValue: [] as Enrollment[],
   })

   readonly todayAttendances = toSignal(
      this.branchId$.pipe(
         switchMap((id) =>
            id ? this.attendanceQuery.getByBranchAndDate(id, new Date()) : of([] as StudentAttendance[])
         )
      ),
      { initialValue: [] as StudentAttendance[] }
   )

   readonly weekAttendances = toSignal(
      this.branchId$.pipe(
         switchMap((id) => {
            if (!id) return of([] as StudentAttendance[])
            const { start, end } = weekRange()
            return this.attendanceQuery.getByBranchAndDateRange(id, start, end)
         })
      ),
      { initialValue: [] as StudentAttendance[] }
   )

   readonly branchEnrollments = computed<Enrollment[]>(() => {
      const id = this.selectedBranchId()
      if (!id) return []
      return this.allEnrollments().filter((e) => e.branchId === id)
   })

   readonly totalActiveStudents = computed(() => this.activeStudents().length)

   readonly newStudentsThisWeek = computed(() => {
      const { start } = weekRange()
      return this.activeStudents().filter(
         (s) => s.createdAt && s.createdAt.toDate() >= start
      ).length
   })

   readonly presentToday = computed(
      () => this.todayAttendances().filter((a) => a.status === 'presente').length
   )

   readonly activeBranchEnrollmentsCount = computed(
      () => this.branchEnrollments().filter((e) => e.status === 'activa').length
   )

   readonly attendanceRate = computed(() => {
      const total = this.activeBranchEnrollmentsCount()
      if (!total) return 0
      const rate = (this.presentToday() / total) * 100
      return Math.min(100, Math.round(rate))
   })

   readonly attendanceRingStyle = computed(() => {
      const rate = this.attendanceRate()
      return `conic-gradient(var(--color-brand-500) 0% ${rate}%, var(--color-bg-inset) ${rate}% 100%)`
   })

   readonly monthlyRevenue = computed(() => {
      const { start, end } = monthRange()
      return this.branchEnrollments()
         .filter(
            (e) =>
               e.status !== 'cancelada' &&
               e.createdAt &&
               e.createdAt.toDate() >= start &&
               e.createdAt.toDate() <= end
         )
         .reduce((sum, e) => sum + (e.cost ?? 0), 0)
   })

   readonly lastMonthRevenue = computed(() => {
      const { start, end } = previousMonthRange()
      return this.branchEnrollments()
         .filter(
            (e) =>
               e.status !== 'cancelada' &&
               e.createdAt &&
               e.createdAt.toDate() >= start &&
               e.createdAt.toDate() <= end
         )
         .reduce((sum, e) => sum + (e.cost ?? 0), 0)
   })

   readonly revenueDeltaPct = computed<number | null>(() => {
      const last = this.lastMonthRevenue()
      if (!last) return null
      return ((this.monthlyRevenue() - last) / last) * 100
   })

   readonly expiringEnrollments = computed(() => {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const limit = new Date(now)
      limit.setDate(limit.getDate() + 7)
      return this.branchEnrollments().filter(
         (e) =>
            e.status === 'activa' &&
            e.endDate &&
            e.endDate.toDate() >= now &&
            e.endDate.toDate() <= limit
      )
   })

   readonly paymentBreakdown = computed(() => {
      const { start, end } = monthRange()
      const monthEnrollments = this.branchEnrollments().filter(
         (e) =>
            e.status !== 'cancelada' &&
            e.createdAt &&
            e.createdAt.toDate() >= start &&
            e.createdAt.toDate() <= end
      )
      let qr = 0
      let cash = 0
      for (const e of monthEnrollments) {
         if (e.paymentMethod === 'Qr') qr += e.cost ?? 0
         else cash += e.cost ?? 0
      }
      const total = qr + cash
      return {
         qr,
         cash,
         total,
         qrPct: total ? Math.round((qr / total) * 100) : 0,
         cashPct: total ? Math.round((cash / total) * 100) : 0,
      }
   })

   readonly donutGradient = computed(() => {
      const { qrPct } = this.paymentBreakdown()
      return `conic-gradient(var(--color-brand-500) 0% ${qrPct}%, var(--color-text-primary) ${qrPct}% 100%)`
   })

   readonly weekBars = computed<WeekBar[]>(() => {
      const counts = [0, 0, 0, 0, 0, 0, 0]
      for (const a of this.weekAttendances()) {
         if (!a.createdAt) continue
         const d = a.createdAt.toDate()
         const wd = d.getDay()
         const idx = wd === 0 ? 6 : wd - 1
         counts[idx]++
      }
      const max = Math.max(...counts, 1)
      const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
      const todayWd = new Date().getDay()
      const todayIdx = todayWd === 0 ? 6 : todayWd - 1
      return counts.map((count, i) => ({
         label: labels[i],
         count,
         heightPx: count === 0 ? 4 : Math.round((count / max) * 128),
         isToday: i === todayIdx,
         isPast: i < todayIdx,
      }))
   })

   readonly classesToday = computed(() => {
      const dayName = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][
         new Date().getDay()
      ]
      const branchId = this.selectedBranchId()
      return this.schedulesActive()
         .filter((s) => !branchId || s.branchId === branchId)
         .filter((s) => (s.days || []).map((d) => d.toLowerCase()).includes(dayName))
   })

   readonly recentAttendances = computed<RecentRow[]>(() => {
      const branchById = new Map(this.branches().map((b) => [b.id, b]))
      return this.todayAttendances()
         .slice(0, 4)
         .map((a) => ({
            ...a,
            branchName: branchById.get(a.branchId)?.name ?? '—',
            timeLabel: a.createdAt
               ? a.createdAt.toDate().toLocaleTimeString('es-BO', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                 })
               : '--:--',
         }))
   })

   readonly lastEnrollment = computed<Enrollment | null>(() => {
      const list = this.branchEnrollments().filter((e) => e.status !== 'cancelada')
      if (!list.length) return null
      const sorted = [...list].sort(
         (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
      )
      return sorted[0]
   })

   readonly lastEnrollmentTime = computed(() => {
      const e = this.lastEnrollment()
      if (!e?.createdAt) return ''
      const diffMs = Date.now() - e.createdAt.toDate().getTime()
      const minutes = Math.round(diffMs / 60000)
      if (minutes < 1) return 'hace instantes'
      if (minutes < 60) return `hace ${minutes} min`
      const hours = Math.round(minutes / 60)
      if (hours < 24) return `hace ${hours} h`
      const days = Math.round(hours / 24)
      return `hace ${days} d`
   })

   constructor() {
      effect(() => {
         const list = this.branches()
         if (list.length && !this.selectedBranchId()) {
            this.selectedBranchId.set(list[0].id)
         }
      })
   }

   onBranchChange(value: string) {
      this.selectedBranchId.set(value)
   }

   getUserDisplayName(): string {
      const currentUser = this.user()
      if (currentUser?.name) {
         return `${currentUser.name} ${currentUser.lastname}`
      }
      if (currentUser?.email) {
         return currentUser.email.split('@')[0]
      }
      return 'Usuario'
   }

   initials(name: string): string {
      return name
         .split(/\s+/)
         .filter(Boolean)
         .slice(0, 2)
         .map((s) => s[0]?.toUpperCase() ?? '')
         .join('')
   }
}

function weekRange(): { start: Date; end: Date } {
   const now = new Date()
   const day = now.getDay()
   const offsetToMonday = day === 0 ? 6 : day - 1
   const start = new Date(now)
   start.setDate(now.getDate() - offsetToMonday)
   start.setHours(0, 0, 0, 0)
   const end = new Date(start)
   end.setDate(start.getDate() + 6)
   end.setHours(23, 59, 59, 999)
   return { start, end }
}

function monthRange(): { start: Date; end: Date } {
   const now = new Date()
   const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
   const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
   return { start, end }
}

function previousMonthRange(): { start: Date; end: Date } {
   const now = new Date()
   const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)
   const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
   return { start, end }
}
