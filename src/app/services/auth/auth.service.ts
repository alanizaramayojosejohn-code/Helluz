import { inject, Injectable } from '@angular/core'
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  user,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from '@angular/fire/auth'
import {
  doc,
  docData,
  Firestore,
  setDoc,
  serverTimestamp,
  getDoc,
  deleteDoc,
} from '@angular/fire/firestore'
import { Router } from '@angular/router'
import { Observable, from, of, switchMap, map, catchError } from 'rxjs'
import { AuthUser, User } from '../../models/user.model'
import { UserPending } from '../../models/userPending'

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth = inject(Auth)
  private readonly firestore = inject(Firestore)
  private readonly router = inject(Router)

  currentUser$: Observable<AuthUser | null> = user(this.auth).pipe(
    switchMap((firebaseUser) => {
      if (!firebaseUser) {
        return of(null)
      }
      return this.getUserData(firebaseUser.uid)
    }),
    catchError(() => of(null))
  )

  private getUserData(uid: string): Observable<AuthUser | null> {
    const userDoc = doc(this.firestore, `users/${uid}`)
    return docData(userDoc, { idField: 'id' }).pipe(
      map((userData) => {
        if (!userData) return null
        const user = userData as User

        if (user.status !== 'activo') {
          this.logout()
          return null
        }

        return {
          uid: uid,
          email: user.email,
          role: user.role,
          name: user.name,
          lastname: user.lastname,
          status: user.status,
        } as AuthUser
      }),
      catchError(() => {
        this.logout()
        return of(null)
      })
    )
  }

  async loginWithEmail(email: string, password: string): Promise<void> {
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password)
      const userData = await this.getUserDataPromise(credential.user.uid)

      if (!userData) {
        await this.logout()
        throw new Error('Usuario no encontrado en el sistema')
      }

      if (userData.status !== 'activo') {
        await this.logout()
        throw new Error('Usuario inactivo. Contacta al administrador')
      }

      this.redirectByRole(userData.role)
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') throw new Error('Usuario no encontrado')
      if (error.code === 'auth/wrong-password') throw new Error('Contraseña incorrecta')
      if (error.code === 'auth/invalid-email') throw new Error('Email inválido')
      if (error.code === 'auth/user-disabled') throw new Error('Usuario deshabilitado')
      if (error.code === 'auth/too-many-requests') throw new Error('Demasiados intentos. Intenta más tarde')
      throw error
    }
  }

  async loginWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider()
      const credential = await signInWithPopup(this.auth, provider)
      const userData = await this.getUserDataPromise(credential.user.uid)

      if (!userData) {
        await this.logout()
        throw new Error('Tu cuenta de Google no está autorizada. Contacta al administrador')
      }

      if (userData.status !== 'activo') {
        await this.logout()
        throw new Error('Usuario inactivo. Contacta al administrador')
      }

      this.redirectByRole(userData.role)
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') throw new Error('Login cancelado')
      if (error.code === 'auth/popup-blocked') throw new Error('Popup bloqueado. Permite popups en tu navegador')
      throw error
    }
  }

  /**
   * Registro público: el usuario crea su cuenta con email y contraseña.
   * El sistema verifica si su email fue pre-registrado por un admin en
   * `usuariosPendientes`. Si no existe, la cuenta queda inactiva.
   */
  async registerWithEmail(email: string, password: string): Promise<void> {
    try {
      // 1. Crear cuenta en Firebase Auth
      const credential = await createUserWithEmailAndPassword(this.auth, email, password)
      const uid = credential.user.uid

      // 2. Leer pre-registro del admin (sin eliminarlo aún, las rules lo necesitan)
      const pendiente = await this.readUsuarioPendiente(email)

      // 3. Determinar rol y estado según pre-registro
      const role = pendiente?.role ?? 'instructor'
      const status = pendiente?.status ?? 'inactivo'
      const name = pendiente?.name ?? ''
      const lastname = pendiente?.lastname ?? ''

      // 4. Crear documento en Firestore
      const userRef = doc(this.firestore, 'users', uid)
      await setDoc(userRef, {
        email: email.toLowerCase(),
        name,
        lastname,
        role,
        status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: pendiente?.createdBy ?? '',
      })

      // 5. Eliminar pendiente DESPUÉS de crear el usuario exitosamente
      if (pendiente) {
        await this.deletePendienteDoc(email)
      }

      // 6. Si la cuenta quedó inactiva, cerrar sesión y avisar
      if (status !== 'activo') {
        await signOut(this.auth)
        throw new Error(
          pendiente
            ? 'Cuenta creada. Un administrador debe activarla para que puedas acceder.'
            : 'Cuenta creada, pero no tienes autorización. Contacta al administrador.'
        )
      }

      // 7. Si está activo, redirigir
      this.redirectByRole(role)
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') throw new Error('El email ya está registrado')
      if (error.code === 'auth/invalid-email') throw new Error('Email inválido')
      if (error.code === 'auth/weak-password') throw new Error('La contraseña debe tener al menos 6 caracteres')
      throw error
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email)
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') throw new Error('Usuario no encontrado')
      if (error.code === 'auth/invalid-email') throw new Error('Email inválido')
      throw error
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth)
      this.router.navigate(['/log-in'])
    } catch (error) {
      console.error('Error en logout:', error)
      throw error
    }
  }

  /** Lee el pre-registro sin eliminarlo (las Firestore rules lo necesitan al crear el user doc) */
  private async readUsuarioPendiente(email: string): Promise<UserPending | null> {
    const emailKey = email.toLowerCase()
    const pendienteRef = doc(this.firestore, 'usuariosPendientes', emailKey)
    const snap = await getDoc(pendienteRef)
    if (!snap.exists()) return null
    return snap.data() as UserPending
  }

  /** Elimina el doc de pre-registro después de crear el usuario exitosamente */
  private async deletePendienteDoc(email: string): Promise<void> {
    const emailKey = email.toLowerCase()
    const pendienteRef = doc(this.firestore, 'usuariosPendientes', emailKey)
    await deleteDoc(pendienteRef)
  }

  private async getUserDataPromise(uid: string): Promise<User | null> {
    const userDoc = doc(this.firestore, `users/${uid}`)
    return new Promise((resolve) => {
      const subscription = docData(userDoc).subscribe({
        next: (data) => {
          subscription.unsubscribe()
          resolve(data ? (data as User) : null)
        },
        error: () => {
          subscription.unsubscribe()
          resolve(null)
        },
      })
    })
  }

  private redirectByRole(role: string): void {
    if (role === 'admin') {
      this.router.navigateByUrl('/admin/home')
    } else if (role === 'instructor') {
      this.router.navigateByUrl('/instructor/home')
    } else {
      this.router.navigateByUrl('/')
    }
  }

  async isAdmin(): Promise<boolean> {
    return new Promise((resolve) => {
      this.currentUser$.subscribe((user) => {
        resolve(user?.role === 'admin' && user?.status === 'activo')
      })
    })
  }

  async isAuthenticated(): Promise<boolean> {
    return new Promise((resolve) => {
      this.currentUser$.subscribe((user) => {
        resolve(user !== null && user.status === 'activo')
      })
    })
  }
}
