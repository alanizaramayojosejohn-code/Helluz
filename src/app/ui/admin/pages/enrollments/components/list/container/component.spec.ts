import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { EnrollmentList } from './component'
import { EnrollmentService } from '../../../../../../../services/enrollment/enrollment.service'
import { BranchService } from '../../../../../../../services/branch/branch.service'
import { of } from 'rxjs'
import { Timestamp } from '@angular/fire/firestore'

describe('EnrollmentList', () => {
   let component: EnrollmentList
   let fixture: ComponentFixture<EnrollmentList>
   let enrollmentServiceMock: any
   let branchServiceMock: any

   const mockEnrollments = [
      {
         id: '1',
         studentId: 'student1',
         studentName: 'Juan Pérez',
         membershipId: 'membership1',
         membershipName: 'Mensual',
         branchId: 'branch1',
         branchName: 'Centro',
         startDate: Timestamp.now(),
         endDate: Timestamp.now(),
         totalSessions: 12,
         usedSessions: 3,
         remainingSessions: 9,
         allowedDays: [1, 2, 3, 4, 5],
         cost: 200,
         paymentMethod: 'Efectivo' as const,
         status: 'activa' as 'activa' | 'vencida' | 'cancelada' | 'completada'
      },
   ]

   const mockBranches = [{ id: '1', name: 'Centro', status: 'activo' }]

   beforeEach(async () => {
      enrollmentServiceMock = {
         getEnrollmentsPage: vi.fn().mockResolvedValue({
            enrollments: mockEnrollments,
            lastDoc: null,
            hasMore: false,
         }),
      }

      branchServiceMock = {
         getActiveBranches: vi.fn().mockReturnValue(of(mockBranches)),
      }

      await TestBed.configureTestingModule({
         imports: [EnrollmentList, NoopAnimationsModule],
         providers: [
            { provide: EnrollmentService, useValue: enrollmentServiceMock },
            { provide: BranchService, useValue: branchServiceMock },
         ],
      }).compileComponents()

      fixture = TestBed.createComponent(EnrollmentList)
      component = fixture.componentInstance
   })

   it('should create', () => {
      expect(component).toBeTruthy()
   })

   it('should load enrollments on init', async () => {
      fixture.detectChanges()
      await fixture.whenStable()

      expect(enrollmentServiceMock.getEnrollmentsPage).toHaveBeenCalled()
   })

   it('should emit createEnrollment event', () => {
      const spy = vi.fn()
      component.createEnrollment.subscribe(spy)

      component.onCreateEnrollment()

      expect(spy).toHaveBeenCalled()
   })

   it('should emit editEnrollment event with id', () => {
      const spy = vi.fn()
      component.editEnrollment.subscribe(spy)

      component.onEditEnrollment(mockEnrollments[0])

      expect(spy).toHaveBeenCalledWith('1')
   })

   it('should calculate sessions progress', () => {
      const progress = component.getSessionsProgress(mockEnrollments[0])
      expect(progress).toBe(25)
   })

   it('should detect expiring enrollments', () => {
      const enrollment = { ...mockEnrollments[0] }
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)
      enrollment.endDate = Timestamp.fromDate(futureDate)
      enrollment.status = 'activa'

      expect(component.isExpiringSoon(enrollment)).toBeTruthy()
   })

   it('should not detect expiring if not active', () => {
      const enrollment = { ...mockEnrollments[0] }
      enrollment.status = 'vencida'

      expect(component.isExpiringSoon(enrollment)).toBeFalsy()
   })

   it('should return correct status classes', () => {
      expect(component.getStatusClass('activa')).toBe('bg-green-100 text-green-800')
      expect(component.getStatusClass('vencida')).toBe('bg-red-100 text-red-800')
      expect(component.getStatusClass('cancelada')).toBe('bg-gray-100 text-gray-800')
      expect(component.getStatusClass('completada')).toBe('bg-blue-100 text-blue-800')
   })

   it('should return correct payment method classes', () => {
      expect(component.getPaymentStatusClass('Efectivo')).toBe('bg-green-100 text-green-800')
      expect(component.getPaymentStatusClass('Qr')).toBe('bg-blue-100 text-blue-800')
   })
})
