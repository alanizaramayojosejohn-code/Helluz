import { Routes } from '@angular/router'

export const PublicRoutes: Routes = [
   {
      path: '',
      loadComponent: async () => await import('./pages/sign-up/sign-up.component'),
   },
   {
      path: 'log-in',
      loadComponent: async () => await import('./pages/log-in/log-in.component'),
   },
]
