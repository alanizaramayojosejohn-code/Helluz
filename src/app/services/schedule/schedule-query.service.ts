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
   updateDoc,
   where,
   orderBy,
} from '@angular/fire/firestore'
import { map, Observable } from 'rxjs'
import { Schedule } from '../../models/schedule.model'

@Injectable()
export class ScheduleQueryService {
   private firestore = inject(Firestore)
   private schedulesCollection = collection(this.firestore, 'schedules')

   getAll(): Observable<Schedule[]> {
      return collectionData(this.schedulesCollection, { idField: 'id' }) as Observable<Schedule[]>
   }

   getById(id: string): Observable<Schedule | undefined> {
      const refScheduleDoc = doc(this.firestore, 'schedules', id)
      return docData(refScheduleDoc, { idField: 'id' }) as Observable<Schedule | undefined>
   }
   // En getByBranch
   getByBranch(branchId: string): Observable<Schedule[]> {
      const q = query(this.schedulesCollection, where('branchId', '==', branchId))
      return collectionData(q, { idField: 'id' }) as Observable<Schedule[]>
   }

   // En getByDay
   getByDay(branchId: string, day: string): Observable<Schedule[]> {
      const q = query(
         this.schedulesCollection,
         where('branchId', '==', branchId),
         where('day', '==', day),
         where('status', '==', 'activo')
      )

      return collectionData(q, { idField: 'id' }).pipe(
         map((schedules) => [...schedules].sort((a: any, b: any) => a.startTime.localeCompare(b.startTime)))
      ) as Observable<Schedule[]>
   }

   async checkTimeConflict(
      branchId: string,
      day: string,
      startTime: string,
      endTime: string,
      excludeId?: string
   ): Promise<boolean> {
      const q = query(
         this.schedulesCollection,
         where('branchId', '==', branchId),
         where('day', '==', day),
         where('status', '==', 'activo')
      )
      const docs = await getDocs(q)
      const schedules = docs.docs
         .map((doc) => ({ id: doc.id, ...doc.data() }) as Schedule)
         .filter((schedule) => (excludeId ? schedule.id !== excludeId : true))

      return schedules.some((schedule) => this.timesOverlap(startTime, endTime, schedule.startTime, schedule.endTime))
   }

   private timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
      const [h1Start, m1Start] = start1.split(':').map(Number)
      const [h1End, m1End] = end1.split(':').map(Number)
      const [h2Start, m2Start] = start2.split(':').map(Number)
      const [h2End, m2End] = end2.split(':').map(Number)

      const time1Start = h1Start * 60 + m1Start
      const time1End = h1End * 60 + m1End
      const time2Start = h2Start * 60 + m2Start
      const time2End = h2End * 60 + m2End

      return time1Start < time2End && time2Start < time1End
   }

   async create(data: Partial<Schedule>): Promise<string> {
      const scheduleDoc = doc(this.schedulesCollection)

      // Eliminar campos undefined
      const cleanData = Object.fromEntries(
         Object.entries(data).filter(([_, value]) => value !== undefined)
      ) as Partial<Schedule>
      await setDoc(scheduleDoc, {
         ...cleanData,
         createdAt: serverTimestamp(),
         updatedAt: serverTimestamp(),
      })
      return scheduleDoc.id
   }

   async update(id: string, data: Partial<Schedule>): Promise<void> {
      const scheduleDoc = doc(this.firestore, 'schedules', id)
      await updateDoc(scheduleDoc, {
         ...data,
         //  instructorId: data.instructorId ?? null,
         updatedAt: serverTimestamp(),
      })
   }

   async delete(id: string): Promise<void> {
      const scheduleDoc = doc(this.firestore, 'schedules', id)
      await deleteDoc(scheduleDoc)
   }

   async softDelete(id: string): Promise<void> {
      const scheduleDoc = doc(this.firestore, 'schedules', id)
      await updateDoc(scheduleDoc, {
         status: 'inactivo',
         updatedAt: serverTimestamp(),
      })
   }

   getDocumentReference(id: string): DocumentReference {
      return doc(this.firestore, 'schedules', id)
   }
}
