import { inject, Injectable } from '@angular/core'
import {
  collection,
  doc,
  Firestore,
  getDocs,
  limit,
  query,
  orderBy,
  updateDoc,
  startAfter,
} from '@angular/fire/firestore'

@Injectable({ providedIn: 'root' })
export class MigrationService {
  private firestore = inject(Firestore)
  private readonly BATCH = 200

  async migrateStudents(): Promise<number> {
    let total = 0
    let lastDoc: any = null

    while (true) {
      const constraints: any[] = [orderBy('__name__'), limit(this.BATCH)]
      if (lastDoc) constraints.push(startAfter(lastDoc))

      const snapshot = await getDocs(query(collection(this.firestore, 'students'), ...constraints))
      if (snapshot.empty) break

      const updates = snapshot.docs
        .filter((d) => !d.data()['searchable'])
        .map((d) => {
          const data = d.data()
          const searchable = [data['name'], data['lastname'], data['ci']]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return updateDoc(doc(collection(this.firestore, 'students'), d.id), { searchable } as any)
        })

      if (updates.length > 0) {
        await Promise.all(updates)
        total += updates.length
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1]
      if (snapshot.docs.length < this.BATCH) break
    }

    return total
  }

  async migrateEnrollments(): Promise<number> {
    let total = 0
    let lastDoc: any = null

    while (true) {
      const constraints: any[] = [orderBy('__name__'), limit(this.BATCH)]
      if (lastDoc) constraints.push(startAfter(lastDoc))

      const snapshot = await getDocs(query(collection(this.firestore, 'enrollments'), ...constraints))
      if (snapshot.empty) break

      const updates = snapshot.docs
        .filter((d) => !d.data()['searchable'])
        .map((d) => {
          const data = d.data()
          const searchable = [data['studentName'], data['membershipName'], data['branchName']]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          const searchKeywords = searchable.split(/\s+/).filter(Boolean)
          return updateDoc(doc(collection(this.firestore, 'enrollments'), d.id), {
            searchable,
            searchKeywords,
          } as any)
        })

      if (updates.length > 0) {
        await Promise.all(updates)
        total += updates.length
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1]
      if (snapshot.docs.length < this.BATCH) break
    }

    return total
  }
}
