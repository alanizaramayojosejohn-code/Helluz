import { inject, Injectable } from '@angular/core'
import {
   Firestore,
   collection,
   collectionData,
   doc,
   docData,
   query,
   where,
   orderBy,
   Timestamp,
   updateDoc,
   deleteDoc,
   setDoc,
   getDocs,
   limit,
} from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import { InstructorAttendance } from '../../models/instructorAttendance.model'

@Injectable()
export class InstructorAttendanceQueryService {
   private readonly firestore = inject(Firestore)
   private readonly collectionName = 'instructorAttendances'

   getById(id: string): Observable<InstructorAttendance | undefined> {
      const docRef = doc(this.firestore, this.collectionName, id)
      return docData(docRef, { idField: 'id' }) as Observable<InstructorAttendance | undefined>
   }

   getByBranchAndDate(
      branchId: string,
      date: Date,
      status?: 'presente' | 'retrasado' | 'falta' | 'permiso' | 'salida-anticipada'
   ): Observable<InstructorAttendance[]> {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const col = collection(this.firestore, this.collectionName)

      let q
      if (status) {
         q = query(
            col,
            where('branchId', '==', branchId),
            where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
            where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
            where('status', '==', status),
            orderBy('createdAt', 'desc')
         )
      } else {
         q = query(
            col,
            where('branchId', '==', branchId),
            where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
            where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
            orderBy('createdAt', 'desc')
         )
      }

      return collectionData(q, { idField: 'id' }) as Observable<InstructorAttendance[]>
   }
   async checkAlreadyMarkedToday(instructorId: string, scheduleId: string, date: Date): Promise<boolean> {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const col = collection(this.firestore, this.collectionName)
      const q = query(
         col,
         where('instructorId', '==', instructorId),
         where('scheduleId', '==', scheduleId),
         where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
         where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
         limit(1)
      )

      const snapshot = await getDocs(q)
      return !snapshot.empty
   }
   
   async create(id: string, data: InstructorAttendance): Promise<void> {
      const docRef = doc(this.firestore, this.collectionName, id)
      await setDoc(docRef, {
         ...data,
         createdAt: Timestamp.now(),
      })
   }

   async update(id: string, data: Partial<InstructorAttendance>): Promise<void> {
      const docRef = doc(this.firestore, this.collectionName, id)
      await updateDoc(docRef, data)
   }

   async delete(id: string): Promise<void> {
      const docRef = doc(this.firestore, this.collectionName, id)
      await deleteDoc(docRef)
   }
}
