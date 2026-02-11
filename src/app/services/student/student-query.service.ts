// services/student/student-query.service.ts
import { inject, Injectable } from '@angular/core'
import {
   collection,
   collectionData,
   doc,
   docData,
   Firestore,
   query,
   serverTimestamp,
   setDoc,
   updateDoc,
   where,
   orderBy,
   deleteDoc,
} from '@angular/fire/firestore'
import { map, Observable } from 'rxjs'
import { Student } from '../../models/student.model'

@Injectable()
export class StudentQueryService {
   private readonly firestore = inject(Firestore)
   private readonly studentsCollection = collection(this.firestore, 'students')

   getAll(): Observable<Student[]> {
      const q = query(this.studentsCollection, orderBy('lastname', 'asc'))
      return collectionData(q, { idField: 'id' }) as Observable<Student[]>
   }

   getActive(): Observable<Student[]> {
      const q = query(this.studentsCollection, where('status', '==', 'activo'), orderBy('lastname', 'asc'))
      return collectionData(q, { idField: 'id' }) as Observable<Student[]>
   }

   getById(id: string): Observable<Student | undefined> {
      const studentDoc = doc(this.studentsCollection, id)
      return docData(studentDoc, { idField: 'id' }) as Observable<Student | undefined>
   }

   getByCi(ci: string): Observable<Student | null> {
      const q = query(this.studentsCollection, where('ci', '==', ci))
      return collectionData(q, { idField: 'id' }).pipe(
         map((students) => (students.length ? (students[0] as Student) : null))
      )
   }

   async create(data: Partial<Student>): Promise<string> {
      const studentDoc = doc(this.studentsCollection)

      const cleanData = Object.fromEntries(
         Object.entries(data).filter(([_, value]) => value !== undefined)
      ) as Partial<Student>

      await setDoc(studentDoc, {
         ...cleanData,
         createdAt: serverTimestamp(),
         updatedAt: serverTimestamp(),
      })

      return studentDoc.id
   }

   async update(id: string, data: Partial<Student>): Promise<void> {
      const studentDoc = doc(this.studentsCollection, id)

      const cleanData = Object.fromEntries(
         Object.entries(data).filter(([_, value]) => value !== undefined)
      ) as Partial<Student>

      await updateDoc(studentDoc, {
         ...cleanData,
         updatedAt: serverTimestamp(),
      })
   }

   async delete(id: string): Promise<void> {
      const studentDoc = doc(this.studentsCollection, id)
      await deleteDoc(studentDoc)
   }

   async checkCiExists(ci: string, excludeId?: string): Promise<boolean> {
      const q = query(this.studentsCollection, where('ci', '==', ci))
      const snapshot = await new Promise<any>((resolve) => {
         const subscription = collectionData(q, { idField: 'id' }).subscribe((data) => {
            subscription.unsubscribe()
            resolve(data)
         })
      })

      if (excludeId) {
         return snapshot.some((s: Student) => s.id !== excludeId)
      }
      return snapshot.length > 0
   }
}
