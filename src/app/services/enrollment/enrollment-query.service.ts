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
  Timestamp as FirestoreTimestamp,
  DocumentSnapshot,
  QueryConstraint,
  startAfter,
  limit
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Enrollment } from '../../models/enrollment.model';

@Injectable()
export class EnrollmentQueryService {
  private firestore = inject(Firestore);
  private enrollmentsCollection = collection(this.firestore, 'enrollments');
  private readonly collectionName = 'enrollments';

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


  async getEnrollmentsPage(
    pageSize: number = 20,
    lastDoc: DocumentSnapshot | null = null,
    branchId?: string,
    status?: string
  ): Promise<{
    enrollments: Enrollment[];
    lastDoc: DocumentSnapshot | null;
    hasMore: boolean;
  }> {
    try {
      const col = collection(this.firestore, this.collectionName);
      const constraints: QueryConstraint[] = [];

      // Filtros opcionales
      if (branchId) {
        constraints.push(where('branchId', '==', branchId));
      }

      if (status && status !== 'all') {
        constraints.push(where('status', '==', status));
      }

      // Ordenamiento
      constraints.push(orderBy('createdAt', 'desc'));

      // Paginación
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      constraints.push(limit(pageSize + 1)); // +1 para saber si hay más

      const q = query(col, ...constraints);
      const snapshot = await getDocs(q);

      const enrollments: Enrollment[] = [];
      const docs = snapshot.docs;

      // Verificar si hay más páginas
      const hasMore = docs.length > pageSize;

      // Tomar solo los registros solicitados
      const docsToProcess = hasMore ? docs.slice(0, pageSize) : docs;

      docsToProcess.forEach(doc => {
        enrollments.push({
          id: doc.id,
          ...doc.data()
        } as Enrollment);
      });

      // Guardar el último documento para la siguiente página
      const newLastDoc = docsToProcess.length > 0
        ? docsToProcess[docsToProcess.length - 1]
        : null;

      return {
        enrollments,
        lastDoc: newLastDoc,
        hasMore
      };

    } catch (error) {
      console.error('Error al obtener página de inscripciones:', error);
      throw error;
    }
  }

  /**
   * Cuenta el total de inscripciones (opcional, para mostrar "Página 1 de X")
   */
  async countEnrollments(branchId?: string, status?: string): Promise<number> {
    try {
      const col = collection(this.firestore, this.collectionName);
      const constraints: QueryConstraint[] = [];

      if (branchId) {
        constraints.push(where('branchId', '==', branchId));
      }

      if (status && status !== 'all') {
        constraints.push(where('status', '==', status));
      }

      const q = query(col, ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.size;
    } catch (error) {
      console.error('Error al contar inscripciones:', error);
      return 0;
    }
  }

}
