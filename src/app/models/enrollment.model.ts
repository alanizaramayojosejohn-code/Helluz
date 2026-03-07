import { DocumentSnapshot, Timestamp } from '@angular/fire/firestore'

export interface Enrollment {
   id: string
   studentId: string
   studentName: string
   membershipId: string
   membershipName: string
   branchId: string
   branchName: string

   startDate: Timestamp
   endDate: Timestamp

   totalSessions: number
   usedSessions: number
   remainingSessions: number

   allowedDays: number[]

   cost: number
   paymentMethod: 'Qr' | 'Efectivo'

   status: 'activa' | 'vencida' | 'cancelada' | 'completada'

   scheduleId?:     string   // id del horario
   scheduleLabel?:  string   // ej: "08:00 - 09:00"
   instructorName?: string   // ej: "Juan Pérez"

   createdAt?:      Timestamp
   updatedAt?:      Timestamp
   createdBy?:      string
   createdByName?:  string
   updatedBy?:      string
   updatedByName?:  string
}

export type CreateEnrollmentDto = Omit<Enrollment, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateEnrollmentDto = Partial<Omit<Enrollment, 'id' | 'createdAt' | 'updatedAt'>>

export interface EnrollmentFormValue {
   studentId:      string
   membershipId:   string
   branchId:       string
   startDate:      Date
   paymentStatus:  'pendiente' | 'pagado' | 'parcial'
   scheduleSelect: string
}

export interface EnrollmentPage {
   enrollments: Enrollment[]
   lastDoc:     DocumentSnapshot | null
   hasMore:     boolean
   total?:      number
}
