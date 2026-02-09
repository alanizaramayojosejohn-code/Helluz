import { Injectable, signal, inject } from '@angular/core'
import {
   Auth,
   createUserWithEmailAndPassword,
   signInWithEmailAndPassword,
   signInWithPopup,
   GoogleAuthProvider,
   signOut,
   authState,
   User as FirebaseUser,
} from '@angular/fire/auth'
import { Observable } from 'rxjs'
import { Router } from '@angular/router'
import { UserService } from './../user/user.service'
import { AppUser, UserRole } from '../../models/user.model'

@Injectable({
   providedIn: 'root',
})
export class AuthService {
   private auth = inject(Auth)
   private router = inject(Router)
   private userService = inject(UserService)

   user$: Observable<FirebaseUser | null>
   currentUser = signal<FirebaseUser | null>(null)
   userData = signal<AppUser | null>(null)
   currentRole = signal<UserRole | null>(null)

   constructor() {
      this.user$ = authState(this.auth)

      this.user$.subscribe(async (firebaseUser) => {
         this.currentUser.set(firebaseUser)

         if (firebaseUser) {
            await this.loadUserData(firebaseUser.uid)
         } else {
            this.userData.set(null)
            this.currentRole.set(null)
         }
      })
   }

   private async loadUserData(uid: string) {
      try {
         const user = await this.userService.getUserByUid(uid)
         if (user) {
            this.userData.set(user)
            this.currentRole.set(user.role)
         }
      } catch (error) {
         console.error('Error loading user data:', error)
      }
   }

   async registerWithEmail(email: string, password: string, displayName: string = 'Usuario') {
      try {
         const credential = await createUserWithEmailAndPassword(this.auth, email, password)

         await this.userService.createOrUpdateUser(credential.user.uid, {
            email: credential.user.email!,
            displayName,
            role: 'instructor',
            isActive: true
         })

         await this.loadUserData(credential.user.uid)
         return credential
      } catch (error: any) {
         throw this.handleError(error)
      }
   }

   async loginWithEmail(email: string, password: string) {
      try {
         const credential = await signInWithEmailAndPassword(this.auth, email, password)
         await this.loadUserData(credential.user.uid)
         return credential
      } catch (error: any) {
         throw this.handleError(error)
      }
   }

   async loginWithGoogle() {
      try {
         const provider = new GoogleAuthProvider()
         provider.setCustomParameters({
            prompt: 'select_account',
         })
         const credential = await signInWithPopup(this.auth, provider)

         await this.userService.createOrUpdateUser(credential.user.uid, {
            email: credential.user.email!,
            displayName: credential.user.displayName || 'Usuario',
            role: 'instructor',
            isActive: true
         })

         await this.loadUserData(credential.user.uid)
         return credential
      } catch (error: any) {
         throw this.handleError(error)
      }
   }

   async logout() {
      try {
         await signOut(this.auth)
         this.userData.set(null)
         this.currentRole.set(null)
         this.router.navigate(['/log-in'])
      } catch (error: any) {
         throw this.handleError(error)
      }
   }

   getCurrentUser(): FirebaseUser | null {
      return this.auth.currentUser
   }

   isAuthenticated(): boolean {
      return this.currentUser() !== null
   }

   hasRole(role: UserRole): boolean {
      return this.currentRole() === role
   }

   isAdmin(): boolean {
      return this.currentRole() === 'admin'
   }

   hasAnyRole(roles: UserRole[]): boolean {
      const currentRole = this.currentRole()
      return currentRole ? roles.includes(currentRole) : false
   }

   private handleError(error: any): string {
      let errorMessage = 'Ocurrió un error'

      switch (error.code) {
         case 'auth/email-already-in-use':
            errorMessage = 'Este email ya está registrado'
            break
         case 'auth/invalid-email':
            errorMessage = 'Email inválido'
            break
         case 'auth/weak-password':
            errorMessage = 'La contraseña debe tener al menos 6 caracteres'
            break
         case 'auth/user-not-found':
            errorMessage = 'Usuario no encontrado'
            break
         case 'auth/wrong-password':
            errorMessage = 'Contraseña incorrecta'
            break
         case 'auth/invalid-credential':
            errorMessage = 'Credenciales inválidas'
            break
         case 'auth/popup-closed-by-user':
            errorMessage = 'Ventana cerrada antes de completar el inicio de sesión'
            break
         case 'auth/cancelled-popup-request':
            errorMessage = 'Solo se puede abrir una ventana a la vez'
            break
         default:
            errorMessage = error.message
      }

      return errorMessage
   }
}
