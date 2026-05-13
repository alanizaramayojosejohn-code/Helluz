import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core'
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms'
import { MatIconModule } from '@angular/material/icon'
import { StudentAttendanceService } from '../../../../../services/studentAttendance/student-attendance.service'
import { StudentQueryService } from '../../../../../services/student/student-query.service'
import { StudentService } from '../../../../../services/student/student.service'
import { ScheduleService } from '../../../../../services/schedule/schedule.service'
import { ScheduleQueryService } from '../../../../../services/schedule/schedule-query.service'
import { StudentAttendanceQueryService } from '../../../../../services/studentAttendance/student-attendance-query.service'
import { EnrollmentQueryService } from '../../../../../services/enrollment/enrollment-query.service'
import { EnrollmentService } from '../../../../../services/enrollment/enrollment.service'

type KioskState = 'idle' | 'submitting' | 'success' | 'warning' | 'error'

@Component({
  selector: 'x-student-attendance-mark',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
  providers: [
    StudentQueryService,
    StudentService,
    ScheduleService,
    ScheduleQueryService,
    StudentAttendanceQueryService,
    StudentAttendanceService,
    EnrollmentQueryService,
    EnrollmentService,
  ],
  templateUrl: './component.html',
})
export default class StudentAttendanceMarkComponent implements OnInit, OnDestroy {
  private readonly attendanceService = inject(StudentAttendanceService)

  readonly state = signal<KioskState>('idle')
  readonly clock = signal('')
  readonly countdown = signal(5)
  readonly personName = signal('')
  readonly sessionNumber = signal(0)
  readonly remainingSessions = signal(0)
  readonly errorMsg = signal('')

  readonly ciControl = new FormControl('', [Validators.required, Validators.minLength(5)])

  private clockInterval?: ReturnType<typeof setInterval>
  private countdownInterval?: ReturnType<typeof setInterval>

  ngOnInit(): void {
    this.tickClock()
    this.clockInterval = setInterval(() => this.tickClock(), 30000)
  }

  ngOnDestroy(): void {
    clearInterval(this.clockInterval)
    clearInterval(this.countdownInterval)
  }

  private tickClock(): void {
    const now = new Date()
    const h = now.getHours().toString().padStart(2, '0')
    const m = now.getMinutes().toString().padStart(2, '0')
    this.clock.set(`${h}:${m}`)
  }

  getFirstName(): string {
    return this.personName().split(' ')[0]
  }

  async onSubmit(): Promise<void> {
    if (this.ciControl.invalid || this.state() === 'submitting') return
    this.state.set('submitting')

    try {
      const result = await this.attendanceService.markAttendance({ ci: this.ciControl.value! })
      this.personName.set(result.studentName)
      this.sessionNumber.set(result.sessionNumber)
      this.remainingSessions.set(result.remainingSessions)
      this.state.set(result.remainingSessions === 0 ? 'warning' : 'success')
      this.startCountdown()
    } catch (error: any) {
      this.errorMsg.set(error.message ?? 'Error al registrar asistencia')
      this.state.set('error')
    }
  }

  onRetry(): void {
    clearInterval(this.countdownInterval)
    this.ciControl.reset()
    this.errorMsg.set('')
    this.countdown.set(5)
    this.state.set('idle')
  }

  private startCountdown(): void {
    this.countdown.set(5)
    this.countdownInterval = setInterval(() => {
      const n = this.countdown() - 1
      if (n <= 0) {
        clearInterval(this.countdownInterval)
        this.onRetry()
      } else {
        this.countdown.set(n)
      }
    }, 1000)
  }
}
