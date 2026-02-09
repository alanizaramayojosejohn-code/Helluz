import { Injectable, inject } from '@angular/core'
import {
   Firestore,
   collection,
   doc,
   setDoc,
   getDoc,
   updateDoc,
   collectionData,
   query,
   where,
   Timestamp,
} from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import { AppUser, UserCreate, UserRole } from '../../models/user.model'

@Injectable({
   providedIn: 'root',
})
export class UserService {
   private firestore = inject(Firestore)
   private usersCollection = collection(this.firestore, 'users')

   async createOrUpdateUser(uid: string, userData: Partial<UserCreate>): Promise<void> {
      const userDoc = doc(this.firestore, `users/${uid}`)
      const userSnapshot = await getDoc(userDoc)

      if (!userSnapshot.exists()) {
         await setDoc(userDoc, {
            ...userData,
            role: 'cajero',
            isActive: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
         })
      } else {
         await updateDoc(userDoc, {
            email: userData.email,
            displayName: userData.displayName,
            updatedAt: Timestamp.now(),
         })
      }
   }

   async getUserByUid(uid: string): Promise<AppUser | null> {
      const userDoc = doc(this.firestore, `users/${uid}`)
      const snapshot = await getDoc(userDoc)

      if (snapshot.exists()) {
         return { id: snapshot.id, ...snapshot.data() } as AppUser
      }
      return null
   }

   getUsers(): Observable<AppUser[]> {
      return collectionData(this.usersCollection, { idField: 'id' }) as Observable<AppUser[]>
   }

   async updateUserRole(uid: string, role: UserRole): Promise<void> {
      const userDoc = doc(this.firestore, `users/${uid}`)
      await updateDoc(userDoc, {
         role,
         updatedAt: Timestamp.now(),
      })
   }

   async toggleUserStatus(uid: string, isActive: boolean): Promise<void> {
      const userDoc = doc(this.firestore, `users/${uid}`)
      await updateDoc(userDoc, {
         isActive,
         updatedAt: Timestamp.now(),
      })
   }
}
