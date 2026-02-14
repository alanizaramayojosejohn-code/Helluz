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
import { doc, docData, Firestore, setDoc, serverTimestamp } from '@angular/fire/firestore'
import { Router } from '@angular/router'
import { Observable, from, of, switchMap, map, catchError } from 'rxjs'
import { AuthUser, User } from '../../models/user.model'

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

         console.log('✅ Login exitoso, rol:', userData.role)

         // ✅ Forzar recarga completa (solución temporal pero funcional)
         if (userData.role === 'admin') {
            window.location.href = '/admin/home'
         } else if (userData.role === 'instructor') {
            window.location.href = '/instructor/home'
         } else {
            window.location.href = '/'
         }
      } catch (error: any) {
         console.error('Error en login:', error)

         if (error.code === 'auth/user-not-found') {
            throw new Error('Usuario no encontrado')
         } else if (error.code === 'auth/wrong-password') {
            throw new Error('Contraseña incorrecta')
         } else if (error.code === 'auth/invalid-email') {
            throw new Error('Email inválido')
         } else if (error.code === 'auth/user-disabled') {
            throw new Error('Usuario deshabilitado')
         } else if (error.code === 'auth/too-many-requests') {
            throw new Error('Demasiados intentos. Intenta más tarde')
         }

         throw error
      }
   }

   async loginWithGoogle(): Promise<void> {
      try {
         const provider = new GoogleAuthProvider()
         const credential = await signInWithPopup(this.auth, provider)

         // Verificar que el usuario exista en Firestore
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
         console.error('Error en login con Google:', error)

         if (error.code === 'auth/popup-closed-by-user') {
            throw new Error('Login cancelado')
         } else if (error.code === 'auth/popup-blocked') {
            throw new Error('Popup bloqueado. Permite popups en tu navegador')
         }

         throw error
      }
   }

   // Crear usuario (solo admin) - IMPORTANTE: Esto debe ejecutarse desde el backend
   // Por seguridad, Firebase no permite crear usuarios con password desde el cliente
   // Esta función es solo de referencia. Debes usar Firebase Admin SDK en Cloud Functions
   async createUserInAuth(email: string, password: string): Promise<string> {
      try {
         // NOTA: Esta función NO debe usarse directamente desde el cliente
         // Es solo para mostrar la lógica. Implementa esto en Cloud Functions
         const credential = await createUserWithEmailAndPassword(this.auth, email, password)

         // Importante: Cerrar sesión inmediatamente para no loguear al admin como el nuevo usuario
         await signOut(this.auth)

         return credential.user.uid
      } catch (error: any) {
         console.error('Error al crear usuario:', error)

         if (error.code === 'auth/email-already-in-use') {
            throw new Error('El email ya está en uso')
         } else if (error.code === 'auth/invalid-email') {
            throw new Error('Email inválido')
         } else if (error.code === 'auth/weak-password') {
            throw new Error('La contraseña debe tener al menos 6 caracteres')
         }

         throw error
      }
   }

   // Enviar email de recuperación de contraseña
   async sendPasswordReset(email: string): Promise<void> {
      try {
         await sendPasswordResetEmail(this.auth, email)
      } catch (error: any) {
         console.error('Error al enviar email de recuperación:', error)

         if (error.code === 'auth/user-not-found') {
            throw new Error('Usuario no encontrado')
         } else if (error.code === 'auth/invalid-email') {
            throw new Error('Email inválido')
         }

         throw error
      }
   }

   // Logout
   async logout(): Promise<void> {
      try {
         await signOut(this.auth)
         this.router.navigate(['/log-in'])
      } catch (error) {
         console.error('Error en logout:', error)
         throw error
      }
   }

   // Helpers privados
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
      console.log('🔄 Redirigiendo usuario con rol:', role)

      if (role === 'admin') {
         console.log('➡️ Navegando a /admin/home')
         this.router.navigateByUrl('/admin/home')
      } else if (role === 'instructor') {
         console.log('➡️ Navegando a /instructor/home')
         this.router.navigateByUrl('/instructor/home')
      } else {
         console.log('➡️ Navegando a /')
         this.router.navigateByUrl('/')
      }
   }
   // Verificar si el usuario actual es admin
   async isAdmin(): Promise<boolean> {
      return new Promise((resolve) => {
         this.currentUser$.subscribe((user) => {
            resolve(user?.role === 'admin' && user?.status === 'activo')
         })
      })
   }

   // Verificar si el usuario está autenticado
   async isAuthenticated(): Promise<boolean> {
      return new Promise((resolve) => {
         this.currentUser$.subscribe((user) => {
            resolve(user !== null && user.status === 'activo')
         })
      })
   }
}
