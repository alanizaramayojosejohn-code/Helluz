import { inject, Injectable } from '@angular/core';
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
  deleteDoc,
  setDoc,
  getDocs,
  limit,
  updateDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { StudentAttendance } from '../../models/studentattendance.model';

@Injectable()
export class StudentAttendanceQueryService {
  private readonly firestore = inject(Firestore);
  private readonly collectionName = 'studentAttendances';

  getById(id: string): Observable<StudentAttendance | undefined> {
    const docRef = doc(this.firestore, this.collectionName, id);
    return docData(docRef, { idField: 'id' }) as Observable<StudentAttendance | undefined>;
  }

  getByBranchAndDate(
    branchId: string,
    date: Date,
    status?: 'presente' | 'falta' | 'permiso'
  ): Observable<StudentAttendance[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const col = collection(this.firestore, this.collectionName);

    let q;
    if (status) {
      q = query(
        col,
        where('branchId', '==', branchId),
        where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
        where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        col,
        where('branchId', '==', branchId),
        where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
        where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('createdAt', 'desc')
      );
    }

    return collectionData(q, { idField: 'id' }) as Observable<StudentAttendance[]>;
  }

  async checkAlreadyMarkedToday(studentId: string, date: Date): Promise<boolean> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const col = collection(this.firestore, this.collectionName);
  const q = query(
    col,
    where('studentId', '==', studentId),
    where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
    where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
    limit(1)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

  async create(id: string, data: StudentAttendance): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    await setDoc(docRef, {
      ...data,
      createdAt: Timestamp.now()
    });
  }

  async update(id: string, data: Partial<StudentAttendance>): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    await updateDoc(docRef, data);
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    await deleteDoc(docRef);
  }
}
