import { inject, Injectable } from '@angular/core'
import {
   collection,
   collectionData,
   doc,
   docData,
   Firestore,
   DocumentReference,
   deleteDoc,
   getDocs,
   query,
   serverTimestamp,
   setDoc,
   where,
   orderBy,
   Timestamp as FirestoreTimestamp,
} from '@angular/fire/firestore'
import { Observable, map } from 'rxjs'
import { Attendance } from '../../models/attendance.model'

@Injectable()
export class AttendanceQueryService {
   private firestore = inject(Firestore)
   private attendancesCollection = collection(this.firestore, 'attendances')

   getAll(): Observable<Attendance[]> {
      const q = query(this.attendancesCollection, orderBy('date', 'desc'))

      return collectionData(q, { idField: 'id' }) as Observable<Attendance[]>
   }

   getById(id: string): Observable<Attendance | undefined> {
      const refAttendanceDoc = doc(this.firestore, 'attendances', id)
      return docData(refAttendanceDoc, { idField: 'id' }) as Observable<Attendance | undefined>
   }

   getByStudent(studentId: string): Observable<Attendance[]> {
      const q = query(this.attendancesCollection, where('studentId', '==', studentId), orderBy('date', 'desc'))

      return collectionData(q, { idField: 'id' }) as Observable<Attendance[]>
   }

   getByEnrollment(enrollmentId: string): Observable<Attendance[]> {
      const q = query(this.attendancesCollection, where('enrollmentId', '==', enrollmentId), orderBy('date', 'desc'))

      return collectionData(q, { idField: 'id' }) as Observable<Attendance[]>
   }

   getBySchedule(scheduleId: string, date: Date): Observable<Attendance[]> {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const q = query(
         this.attendancesCollection,
         where('scheduleId', '==', scheduleId),
         where('date', '>=', FirestoreTimestamp.fromDate(startOfDay)),
         where('date', '<=', FirestoreTimestamp.fromDate(endOfDay))
      )

      return collectionData(q, { idField: 'id' }) as Observable<Attendance[]>
   }

   getByBranchAndDate(branchId: string, date: Date): Observable<Attendance[]> {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const q = query(
         this.attendancesCollection,
         where('branchId', '==', branchId),
         where('date', '>=', FirestoreTimestamp.fromDate(startOfDay)),
         where('date', '<=', FirestoreTimestamp.fromDate(endOfDay)),
         orderBy('date', 'asc')
      )

      return collectionData(q, { idField: 'id' }) as Observable<Attendance[]>
   }

   async checkAlreadyMarked(personId: string, scheduleId: string, date: Date): Promise<boolean> {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const q = query(
         this.attendancesCollection,
         where('personId', '==', personId), // Cambiado de studentId a personId
         where('scheduleId', '==', scheduleId),
         where('date', '>=', FirestoreTimestamp.fromDate(startOfDay)),
         where('date', '<=', FirestoreTimestamp.fromDate(endOfDay))
      )

      const docs = await getDocs(q)
      return !docs.empty
   }

   async create(id: string, data: Partial<Attendance>): Promise<void> {
      const attendanceDoc = doc(this.firestore, 'attendances', id)
      await setDoc(attendanceDoc, {
         ...data,
         createdAt: serverTimestamp(),
      })
   }

   async delete(id: string): Promise<void> {
      const attendanceDoc = doc(this.firestore, 'attendances', id)
      await deleteDoc(attendanceDoc)
   }

   getDocumentReference(id: string): DocumentReference {
      return doc(this.firestore, 'attendances', id)
   }
}
