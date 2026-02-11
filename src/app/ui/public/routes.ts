import { Routes } from '@angular/router'

export const PublicRoutes: Routes = [
   {
      path: 'log-in',
      loadComponent: async () => await import('./pages/log-in/log-in.component'),
   },
   {
      path: 'asistencia',
      loadComponent: async () => await import('./pages/attendance-kiosk/container/component'),
   },
   {
      path: '',
      loadComponent: async () => await import('./pages/sign-up/sign-up.component'),
   },
]
