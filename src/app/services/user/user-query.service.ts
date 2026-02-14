// services/user/user-query.service.ts
import { inject, Injectable } from '@angular/core';
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
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from '../../models/user.model';

@Injectable()
export class UserQueryService {
  private readonly firestore = inject(Firestore);
  private readonly usersCollection = collection(this.firestore, 'users');

  getAll(): Observable<User[]> {
    const q = query(this.usersCollection, orderBy('lastname', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<User[]>;
  }

  getActive(): Observable<User[]> {
    const q = query(
      this.usersCollection,
      where('status', '==', 'activo'),
      orderBy('lastname', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<User[]>;
  }

  getByRole(role: string): Observable<User[]> {
    const q = query(
      this.usersCollection,
      where('role', '==', role),
      where('status', '==', 'activo'),
      orderBy('lastname', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<User[]>;
  }

  getById(id: string): Observable<User | undefined> {
    const userDoc = doc(this.usersCollection, id);
    return docData(userDoc, { idField: 'id' }) as Observable<User | undefined>;
  }

  async create(uid: string, data: Partial<User>): Promise<void> {
    const userDoc = doc(this.usersCollection, uid);

    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    ) as Partial<User>;

    await setDoc(userDoc, {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async update(id: string, data: Partial<User>): Promise<void> {
    const userDoc = doc(this.usersCollection, id);

    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    ) as Partial<User>;

    await updateDoc(userDoc, {
      ...cleanData,
      updatedAt: serverTimestamp(),
    });
  }

  async delete(id: string): Promise<void> {
    const userDoc = doc(this.usersCollection, id);
    await deleteDoc(userDoc);
  }

  async checkEmailExists(email: string, excludeId?: string): Promise<boolean> {
    const q = query(this.usersCollection, where('email', '==', email));
    const snapshot = await new Promise<any>((resolve) => {
      const subscription = collectionData(q, { idField: 'id' }).subscribe((data) => {
        subscription.unsubscribe();
        resolve(data);
      });
    });

    if (excludeId) {
      return snapshot.some((u: User) => u.id !== excludeId);
    }
    return snapshot.length > 0;
  }
}
