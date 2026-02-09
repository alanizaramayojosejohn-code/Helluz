import { inject, Injectable } from '@angular/core'
import { collection, collectionData, doc, docData, Firestore, DocumentReference } from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import { Branch } from '../../models/branch.model'
import { deleteDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'

@Injectable()
export class QueryService {

  private firestore = inject(Firestore)
  private branchesCollection = collection(this.firestore, 'branches')


  getAll(): Observable<Branch[]> {
    return collectionData(this.branchesCollection,{ idField: 'id'}) as Observable<Branch[]>
  }


   getById(id: string): Observable<Branch | undefined> {
      const refBranchDoc = doc(this.firestore, 'bracnhes', id)
      return docData(refBranchDoc, { idField: 'id' }) as Observable<Branch | undefined>
   }

   async existByName(name: string, excludeId?: string): Promise<boolean> {
      const normalizedName = name.trim().toLowerCase()
      const q = query(this.branchesCollection, where('name', '==', normalizedName))
      const docs = await getDocs(q)

      if (excludeId) {
         return docs.docs.some((doc) => doc.id !== excludeId)
      }

      return !docs.empty
   }

   async create(id: string, data: Partial<Branch>): Promise<void> {
      const branchDoc = doc(this.firestore, 'branches', id)
      await setDoc(branchDoc, {
         ...data,
         createdAt: serverTimestamp(),
         updatedAt: serverTimestamp(),
      })
   }

   async update(id: string, data: Partial<Branch>): Promise<void> {
      const branchDoc = doc(this.firestore, 'branches', id)
      await updateDoc(branchDoc, {
         ...data,
         updatedAt: serverTimestamp(),
      })
   }

   async delete(id: string): Promise<void> {
      const branchDoc = doc(this.firestore, 'branches', id)
      await deleteDoc(branchDoc)
   }

   getDocumentReference(id: string): DocumentReference {
      return doc(this.firestore, 'branches', id)
   }
}
