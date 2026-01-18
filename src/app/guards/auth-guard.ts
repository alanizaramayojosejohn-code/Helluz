import { inject } from '@angular/core'
import { Router, CanActivateFn } from '@angular/router'
import { AuthService } from '../services/auth.service'
import { map, take } from 'rxjs/operators'
import { User } from 'firebase/auth'

export const authGuard: CanActivateFn = (route, state) => {
   const authService: AuthService = inject(AuthService)
   const router: Router = inject(Router)

   return authService.user$.pipe(
      take(1),
      map((user: User | null) => {
         if (user) {
            return true
         } else {
            router.navigate(['/login'], {
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

   return authService.user$.pipe(
      take(1),
      map((user) => {
         if (!user) {
            return true
         } else {
            router.navigate(['/home'])
            return false
         }
      })
   )
}
