import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { EnrollmentService } from './enrollment.service'
import { EnrollmentQueryService } from './enrollment-query.service'
import { of } from 'rxjs'
import { Timestamp } from '@angular/fire/firestore'

describe('EnrollmentService', () => {
   let service: EnrollmentService
   let queryServiceMock: any

   const mockEnrollment = {
      id: '1',
      studentId: 'student1',
      studentName: 'Juan Pérez',
      membershipId: 'membership1',
      membershipName: 'Mensual',
      branchId: 'branch1',
      branchName: 'Sucursal Centro',
      startDate: Timestamp.now(),
      endDate: Timestamp.now(),
      totalSessions: 12,
      usedSessions: 3,
      remainingSessions: 9,
      allowedDays: [1, 2, 3, 4, 5],
      cost: 200,
      paymentMethod: 'Efectivo' as const,
      status: 'activa' as const,
      createdBy: 'user123',
      createdByName: 'Admin User',
   }

   beforeEach(() => {
      queryServiceMock = {
         getAll: vi.fn().mockReturnValue(of([mockEnrollment])),
         getById: vi.fn().mockReturnValue(of(mockEnrollment)),
         getActiveByStudent: vi.fn().mockReturnValue(of([])), // ✅ Mock para validación
         create: vi.fn().mockResolvedValue(undefined),
         update: vi.fn().mockResolvedValue(undefined),
         delete: vi.fn().mockResolvedValue(undefined),
      }

      TestBed.configureTestingModule({
         providers: [EnrollmentService, { provide: EnrollmentQueryService, useValue: queryServiceMock }],
      })

      service = TestBed.inject(EnrollmentService)
   })

   it('should be created', () => {
      expect(service).toBeTruthy()
   })

   it('should get enrollments', async () => {
      const enrollments = await new Promise((resolve) => {
         service.getEnrollments().subscribe((enrollments) => {
            resolve(enrollments)
         })
      })

      expect(Array.isArray(enrollments)).toBe(true)
      expect((enrollments as any).length).toBe(1)
      expect((enrollments as any)[0].id).toBe('1')
      expect(queryServiceMock.getAll).toHaveBeenCalled()
   })

   it('should get enrollment by id', async () => {
      const enrollment = await new Promise((resolve) => {
         service.getEnrollmentById('1').subscribe((enrollment) => {
            resolve(enrollment)
         })
      })

      expect(enrollment).toBeTruthy()
      expect((enrollment as any)?.id).toBe('1')
      expect(queryServiceMock.getById).toHaveBeenCalledWith('1')
   })

   it('should calculate end date correctly', () => {
      const startDate = new Date('2024-01-01')
      const durationDays = 30

      const endDate = service.calculateEndDate(startDate, durationDays)

      expect(endDate.getDate()).toBe(30)
      expect(endDate.getMonth()).toBe(0)

      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      expect(diffDays).toBe(30)
   })

   it('should add enrollment successfully', async () => {
      vi.spyOn(service as any, 'getActiveEnrollmentsByStudentPromise').mockResolvedValue([])

      const createData = {
         studentId: 'student1',
         studentName: 'Juan Pérez',
         membershipId: 'membership1',
         membershipName: 'Mensual',
         branchId: 'branch1',
         branchName: 'Centro',
         startDate: Timestamp.now(),
         endDate: Timestamp.now(),
         totalSessions: 12,
         usedSessions: 0,
         remainingSessions: 12,
         allowedDays: [1, 2, 3, 4, 5],
         cost: 200,
         paymentMethod: 'Efectivo' as const,
         status: 'activa' as const,
      }

      const currentUserId = 'user123'
      const currentUserName = 'Admin User'

      const id = await service.addEnrollment(createData, currentUserId, currentUserName)

      expect(id).toBeTruthy()
      expect(queryServiceMock.create).toHaveBeenCalled()

      const createCall = queryServiceMock.create.mock.calls[0]
      expect(createCall[1].createdBy).toBe(currentUserId)
      expect(createCall[1].createdByName).toBe(currentUserName)
   })

   it('should throw error when student has active enrollment in same branch', async () => {
      vi.spyOn(service as any, 'getActiveEnrollmentsByStudentPromise').mockResolvedValue([
         {
            id: 'existing-1',
            branchId: 'branch1',
            status: 'activa',
         },
      ])

      const createData = {
         studentId: 'student1',
         studentName: 'Juan Pérez',
         membershipId: 'membership1',
         membershipName: 'Mensual',
         branchId: 'branch1',
         branchName: 'Centro',
         startDate: Timestamp.now(),
         endDate: Timestamp.now(),
         totalSessions: 12,
         usedSessions: 0,
         remainingSessions: 12,
         allowedDays: [1, 2, 3, 4, 5],
         cost: 200,
         paymentMethod: 'Efectivo' as const,
         status: 'activa' as const,
      }

      await expect(service.addEnrollment(createData, 'user123', 'Admin User')).rejects.toThrow(
         'El alumno ya tiene una inscripción activa en esta sucursal'
      )
   })

   it('should allow enrollment in different branch', async () => {
      vi.spyOn(service as any, 'getActiveEnrollmentsByStudentPromise').mockResolvedValue([
         {
            id: 'existing-1',
            branchId: 'branch-other',
            status: 'activa',
         },
      ])

      const createData = {
         studentId: 'student1',
         studentName: 'Juan Pérez',
         membershipId: 'membership1',
         membershipName: 'Mensual',
         branchId: 'branch1',
         branchName: 'Centro',
         startDate: Timestamp.now(),
         endDate: Timestamp.now(),
         totalSessions: 12,
         usedSessions: 0,
         remainingSessions: 12,
         allowedDays: [1, 2, 3, 4, 5],
         cost: 200,
         paymentMethod: 'Efectivo' as const,
         status: 'activa' as const,
      }

      const id = await service.addEnrollment(createData, 'user123', 'Admin User')

      expect(id).toBeTruthy()
      expect(queryServiceMock.create).toHaveBeenCalled()
   })
})
