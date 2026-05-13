import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core'
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms'
import { MatIconModule } from '@angular/material/icon'
import { InstructorAttendanceService } from '../../../../../services/instructorAttendance/instructor-attendance.service'
import { InstructorAttendanceQueryService } from '../../../../../services/instructorAttendance/instructor-attendance-query.service'
import { ScheduleService } from '../../../../../services/schedule/schedule.service'
import { ScheduleQueryService } from '../../../../../services/schedule/schedule-query.service'
import { InstructorQueryService } from '../../../../../services/instructor/instructor-query.service'
import { InstructorService } from '../../../../../services/instructor/instructor.service'
import { BranchService } from '../../../../../services/branch/branch.service'
import { QueryService } from '../../../../../services/branch/query.service'

type InstructorKioskState = 'idle' | 'submitting' | 'on-time' | 'late' | 'error'

@Component({
  selector: 'x-instructor-attendance-mark',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
  providers: [
    InstructorAttendanceService,
    InstructorAttendanceQueryService,
    ScheduleService,
    ScheduleQueryService,
    InstructorQueryService,
    InstructorService,
    BranchService,
    QueryService,
  ],
  templateUrl: './component.html',
})
export default class InstructorAttendanceMarkComponent implements OnInit, OnDestroy {
  private readonly attendanceService = inject(InstructorAttendanceService)

  readonly state = signal<InstructorKioskState>('idle')
  readonly clock = signal('')
  readonly countdown = signal(5)
  readonly personName = signal('')
  readonly minutesLate = signal(0)
  readonly arrivalTime = signal('')
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

  private getCurrentTime(): string {
    const now = new Date()
    const h = now.getHours().toString().padStart(2, '0')
    const m = now.getMinutes().toString().padStart(2, '0')
    return `${h}:${m}`
  }

  getFirstName(): string {
    return this.personName().split(' ')[0]
  }

  async onSubmit(): Promise<void> {
    if (this.ciControl.invalid || this.state() === 'submitting') return

    const captured = this.getCurrentTime()
    this.state.set('submitting')

    try {
      const result = await this.attendanceService.markArrival({ ci: this.ciControl.value! })
      this.personName.set(result.instructorName)
      this.minutesLate.set(result.minutesLate)
      this.arrivalTime.set(captured)
      this.state.set(result.isLate ? 'late' : 'on-time')
      this.startCountdown()
    } catch (error: any) {
      this.errorMsg.set(error.message ?? 'Error al registrar entrada')
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
