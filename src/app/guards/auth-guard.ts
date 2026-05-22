import { inject } from '@angular/core'
import { Router, CanActivateFn } from '@angular/router'
import { map, take } from 'rxjs/operators'
import { AuthService } from '../services/auth/auth.service'
import { AuthUser } from '../models/user.model'

export const authGuard: CanActivateFn = (route, state) => {
   const authService: AuthService = inject(AuthService)
   const router: Router = inject(Router)

   return authService.currentUser$.pipe(
      take(1),
      map((user: AuthUser | null) => {
         if (user && user.status === 'activo') {
            return true
         } else {
            router.navigate(['/log-in'], {
               queryParams: { returnUrl: state.url },
            })
            return false
         }
      })
   )
}

export const noAuthGuard: CanActivateFn = (route, state) => {
   const authService = inject(AuthService)
   const router = inject(Router)

   return authService.currentUser$.pipe(
      take(1),
      map((user) => {
         if (!user) {
            return true
         } else {
            if (user.role === 'superAdmin' || user.role === 'admin') {
               router.navigate(['/admin/home'])
            } else {
               router.navigate(['/instructor/home'])
            }
            return false
         }
      })
   )
}

/** Permite acceso a cualquier usuario con rol de administración (superAdmin o admin de sucursal) */
export const adminGuard: CanActivateFn = (route, state) => {
   const authService = inject(AuthService)
   const router = inject(Router)

   return authService.currentUser$.pipe(
      take(1),
      map((user: AuthUser | null) => {
         if (user && user.status === 'activo' && (user.role === 'superAdmin' || user.role === 'admin')) {
            return true
         } else {
            router.navigate(['/log-in'])
            return false
         }
      })
   )
}

/** Permite acceso solo a superAdmin (gestión global: usuarios, sucursales) */
export const superAdminGuard: CanActivateFn = (route, state) => {
   const authService = inject(AuthService)
   const router = inject(Router)

   return authService.currentUser$.pipe(
      take(1),
      map((user: AuthUser | null) => {
         if (user && user.status === 'activo' && user.role === 'superAdmin') {
            return true
         } else {
            router.navigate(['/admin/home'])
            return false
         }
      })
   )
}

export const instructorGuard: CanActivateFn = (route, state) => {
   const authService = inject(AuthService)
   const router = inject(Router)

   return authService.currentUser$.pipe(
      take(1),
      map((user: AuthUser | null) => {
         if (user && user.status === 'activo' && user.role === 'instructor') {
            return true
         } else {
            router.navigate(['/log-in'])
            return false
         }
      })
   )
}

export const adminOrInstructorGuard: CanActivateFn = (route, state) => {
   const authService = inject(AuthService)
   const router = inject(Router)

   return authService.currentUser$.pipe(
      take(1),
      map((user: AuthUser | null) => {
         if (user && user.status === 'activo' && (user.role === 'superAdmin' || user.role === 'admin' || user.role === 'instructor')) {
            return true
         } else {
            router.navigate(['/log-in'])
            return false
         }
      })
   )
}
