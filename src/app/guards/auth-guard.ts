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

// Guard para prevenir acceso a login/register si ya está autenticado
export const noAuthGuard: CanActivateFn = (route, state) => {
   const authService = inject(AuthService)
   const router = inject(Router)

   return authService.currentUser$.pipe(
      take(1),
      map((user) => {
         if (!user) {
            return true
         } else {
            // Redirigir según el rol
            if (user.role === 'admin') {
               router.navigate(['/admin/home'])
            } else {
               router.navigate(['/instructor/home'])
            }
            return false
         }
      })
   )
}

// Guard para verificar que sea admin
export const adminGuard: CanActivateFn = (route, state) => {
   const authService = inject(AuthService)
   const router = inject(Router)

   return authService.currentUser$.pipe(
      take(1),
      map((user: AuthUser | null) => {
         if (user && user.status === 'activo' && user.role === 'admin') {
            return true
         } else {
            router.navigate(['/log-in'])
            return false
         }
      })
   )
}

// Guard para verificar que sea instructor
export const instructorGuard: CanActivateFn = (route, state) => {
   const authService = inject(AuthService)
   const router = inject(Router)

   console.log('🛡️ instructorGuard ejecutándose...') // Debug

   return authService.currentUser$.pipe(
      take(1),
      map((user: AuthUser | null) => {
         console.log('🛡️ instructorGuard - Usuario recibido:', user) // Debug

         if (user && user.status === 'activo' && user.role === 'instructor') {
            console.log('✅ instructorGuard permitido') // Debug
            return true
         } else {
            console.log('❌ instructorGuard bloqueado') // Debug
            console.log('   - Usuario existe:', !!user)
            console.log('   - Status:', user?.status)
            console.log('   - Role:', user?.role)
            router.navigate(['/log-in'])
            return false
         }
      })
   )
}
