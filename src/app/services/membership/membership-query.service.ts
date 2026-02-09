// services/membership/membership-query.service.ts
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
import { Membership } from '../../models/membership.model';

@Injectable()
export class MembershipQueryService {
  private readonly firestore = inject(Firestore);
  private readonly membershipsCollection = collection(this.firestore, 'memberships');

  getAll(): Observable<Membership[]> {
    const q = query(this.membershipsCollection, orderBy('name', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<Membership[]>;
  }

  getActive(): Observable<Membership[]> {
    const q = query(
      this.membershipsCollection,
      where('status', '==', 'activo'),
      orderBy('name', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Membership[]>;
  }

  getById(id: string): Observable<Membership | undefined> {
    const membershipDoc = doc(this.membershipsCollection, id);
    return docData(membershipDoc, { idField: 'id' }) as Observable<Membership | undefined>;
  }

  async create(data: Partial<Membership>): Promise<string> {
    const membershipDoc = doc(this.membershipsCollection);

    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    ) as Partial<Membership>;

    await setDoc(membershipDoc, {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return membershipDoc.id;
  }

  async update(id: string, data: Partial<Membership>): Promise<void> {
    const membershipDoc = doc(this.membershipsCollection, id);

    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    ) as Partial<Membership>;

    await updateDoc(membershipDoc, {
      ...cleanData,
      updatedAt: serverTimestamp(),
    });
  }

  async delete(id: string): Promise<void> {
    const membershipDoc = doc(this.membershipsCollection, id);
    await deleteDoc(membershipDoc);
  }

  async checkNameExists(name: string, excludeId?: string): Promise<boolean> {
    const q = query(this.membershipsCollection, where('name', '==', name));
    const snapshot = await new Promise<any>((resolve) => {
      const subscription = collectionData(q, { idField: 'id' }).subscribe((data) => {
        subscription.unsubscribe();
        resolve(data);
      });
    });

    if (excludeId) {
      return snapshot.some((m: Membership) => m.id !== excludeId);
    }
    return snapshot.length > 0;
  }
}
