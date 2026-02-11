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
  orderBy,
  Timestamp as FirestoreTimestamp
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Enrollment } from '../../models/enrollment.model';

@Injectable()
export class EnrollmentQueryService {
  private firestore = inject(Firestore);
  private enrollmentsCollection = collection(this.firestore, 'enrollments');

  getAll(): Observable<Enrollment[]> {
    return collectionData(this.enrollmentsCollection, { idField: 'id' }).pipe(
      map(enrollments => [...enrollments].sort((a: any, b: any) =>
        b.createdAt?.toMillis() - a.createdAt?.toMillis()
      ))
    ) as Observable<Enrollment[]>;
  }

  getById(id: string): Observable<Enrollment | undefined> {
    const refEnrollmentDoc = doc(this.firestore, 'enrollments', id);
    return docData(refEnrollmentDoc, { idField: 'id' }) as Observable<Enrollment | undefined>;
  }

  getByStudent(studentId: string): Observable<Enrollment[]> {
    const q = query(
      this.enrollmentsCollection,
      where('studentId', '==', studentId),
      orderBy('startDate', 'desc')
    );

    return collectionData(q, { idField: 'id' }) as Observable<Enrollment[]>;
  }

  getActiveByStudent(studentId: string): Observable<Enrollment[]> {
    const q = query(
      this.enrollmentsCollection,
      where('studentId', '==', studentId),
      where('status', '==', 'activa')
    );

    return collectionData(q, { idField: 'id' }) as Observable<Enrollment[]>;
  }

  getByBranch(branchId: string): Observable<Enrollment[]> {
    const q = query(
      this.enrollmentsCollection,
      where('branchId', '==', branchId),
      where('status', '==', 'activa')
    );

    return collectionData(q, { idField: 'id' }).pipe(
      map(enrollments => [...enrollments].sort((a: any, b: any) =>
        a.studentName.localeCompare(b.studentName)
      ))
    ) as Observable<Enrollment[]>;
  }

  getExpiring(days: number): Observable<Enrollment[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const q = query(
      this.enrollmentsCollection,
      where('status', '==', 'activa'),
      where('endDate', '<=', FirestoreTimestamp.fromDate(futureDate))
    );

    return collectionData(q, { idField: 'id' }) as Observable<Enrollment[]>;
  }

  async create(id: string, data: Partial<Enrollment>): Promise<void> {
    const enrollmentDoc = doc(this.firestore, 'enrollments', id);
    await setDoc(enrollmentDoc, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async update(id: string, data: Partial<Enrollment>): Promise<void> {
    const enrollmentDoc = doc(this.firestore, 'enrollments', id);
    await updateDoc(enrollmentDoc, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  async delete(id: string): Promise<void> {
    const enrollmentDoc = doc(this.firestore, 'enrollments', id);
    await deleteDoc(enrollmentDoc);
  }

  async cancel(id: string): Promise<void> {
    const enrollmentDoc = doc(this.firestore, 'enrollments', id);
    await updateDoc(enrollmentDoc, {
      status: 'cancelada',
      updatedAt: serverTimestamp(),
    });
  }

  getDocumentReference(id: string): DocumentReference {
    return doc(this.firestore, 'enrollments', id);
  }
}
