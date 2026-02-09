import { inject, Injectable } from '@angular/core'
import {
   collection,
   collectionData,
   doc,
   docData,
   Firestore,
   DocumentReference,
   FieldValue,
} from '@angular/fire/firestore'
import { Observable, timestamp } from 'rxjs'
import { Branch } from '../../models/branch.model'
import { addDoc, deleteDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { Student } from './../../models/student.model'

@Injectable()
export class QueryService {
   private firestore = inject(Firestore)
   private studentcollection = collection(this.firestore, 'students')

   getall(): Observable<Student[]> {
      return collectionData(this.studentcollection, { idField: 'id' }) as Observable<Student[]>
   }

   getById(id: string): Observable<Student | undefined> {
      const refStudentDoc = doc(this.firestore, 'students', id)
      return docData(refStudentDoc, { idField: 'id' }) as Observable<Student | undefined>
   }

   async create(id: string, data: Partial<Student>): Promise<void> {
      const ref = doc(this.firestore, 'Students', id)
      await setDoc(ref, {
         ...data,
         CeatedAt: serverTimestamp,
         UpdatedAt: serverTimestamp,
      })
   }

   async update(id: string, data: Partial<Student>) {
      const ref = doc(this.firestore, 'students', id)
      await updateDoc(ref, {
         ...data,
         UpdateAt: serverTimestamp,
      })
   }
   async existByCi(ci: string, excludeId?: string) {
      const q = query(this.studentcollection, where('ci', '==', ci))
      const docs = await getDocs(q)

      if (excludeId) {
         return docs.docs.some((doc) => doc.id !== excludeId)
      }

      return !docs.empty
   }

   async delete(id: string) {
      const ref = doc(this.firestore, 'students', id)
      await deleteDoc(ref)
   }

   //  getBranch()

   //  getDocumentReference(id: string): DocumentReference {
   //     return doc(this.firestore, 'branches', id)
   //  }
}
