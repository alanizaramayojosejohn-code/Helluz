import { inject, Injectable } from '@angular/core';
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
  orderBy
} from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { Instructor } from '../../models/instructor.model';

@Injectable()
export class InstructorQueryService {
  private firestore = inject(Firestore);
  private instructorsCollection = collection(this.firestore, 'instructors');

  getAll(): Observable<Instructor[]> {
    return collectionData(this.instructorsCollection, { idField: 'id' }).pipe(
      map(instructors => [...instructors].sort((a: any, b: any) => {
        const lastNameCompare = a.lastname.localeCompare(b.lastname);
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.name.localeCompare(b.name);
      }))
    ) as Observable<Instructor[]>;
  }

  getById(id: string): Observable<Instructor | undefined> {
    const refInstructorDoc = doc(this.firestore, 'instructors', id);
    return docData(refInstructorDoc, { idField: 'id' }) as Observable<Instructor | undefined>;
  }

  getByBranch(branchId: string): Observable<Instructor[]> {
    const q = query(
      this.instructorsCollection,
      where('branchId', '==', branchId),
      where('status', '==', 'activo')
    );

    return collectionData(q, { idField: 'id' }).pipe(
      map(instructors => [...instructors].sort((a: any, b: any) => {
        const lastNameCompare = a.lastname.localeCompare(b.lastname);
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.name.localeCompare(b.name);
      }))
    ) as Observable<Instructor[]>;
  }

  getActive(): Observable<Instructor[]> {
    const q = query(
      this.instructorsCollection,
      where('status', '==', 'activo')
    );

    return collectionData(q, { idField: 'id' }).pipe(
      map(instructors => [...instructors].sort((a: any, b: any) => {
        const lastNameCompare = a.lastname.localeCompare(b.lastname);
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.name.localeCompare(b.name);
      }))
    ) as Observable<Instructor[]>;
  }

  async existByCi(ci: string, excludeId?: string): Promise<boolean> {
    const normalizedCi = ci.trim();
    const q = query(this.instructorsCollection, where('ci', '==', normalizedCi));
    const docs = await getDocs(q);

    if (excludeId) {
      return docs.docs.some((doc) => doc.id !== excludeId);
    }

    return !docs.empty;
  }

  async create(id: string, data: Partial<Instructor>): Promise<void> {
    const instructorDoc = doc(this.firestore, 'instructors', id);
    await setDoc(instructorDoc, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async update(id: string, data: Partial<Instructor>): Promise<void> {
    const instructorDoc = doc(this.firestore, 'instructors', id);
    await updateDoc(instructorDoc, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  async delete(id: string): Promise<void> {
    const instructorDoc = doc(this.firestore, 'instructors', id);
    await deleteDoc(instructorDoc);
  }

  async softDelete(id: string): Promise<void> {
    const instructorDoc = doc(this.firestore, 'instructors', id);
    await updateDoc(instructorDoc, {
      status: 'inactivo',
      updatedAt: serverTimestamp(),
    });
  }

  getDocumentReference(id: string): DocumentReference {
    return doc(this.firestore, 'instructors', id);
  }
}

