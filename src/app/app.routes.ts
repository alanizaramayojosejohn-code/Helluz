import { SignUpComponent } from './pages/auth/sign-up/sign-up.component'
import { Routes } from '@angular/router'

import { LogInComponent } from './pages/auth/log-in/log-in.component'
import { authGuard, noAuthGuard } from './guards/auth-guard'
import { AdminRoutes } from './ui/admin/routes'
export const routes: Routes = [
   // www.coffe.com/
   // www.coffe.com/admin/
   {
      path: '',
      loadComponent: () => import('./pages/auth/sign-up/sign-up.component').then((m) => m.SignUpComponent),
   },
   {
      path: 'auth',
      children: [
         {
            path: 'log-in',
            component: LogInComponent,
            canActivate: [noAuthGuard], // Previene acceso si ya está autenticado
         },
         {
            path: 'sign-up',
            component: SignUpComponent,
            canActivate: [noAuthGuard], // Previene acceso si ya está autenticado
         },
      ],
   },

   {
      path: 'admin',
      loadComponent: async () => await import('./ui/admin/container/component'),
      children: AdminRoutes,
   },
]
