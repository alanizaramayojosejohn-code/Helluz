import { Routes } from '@angular/router'

export const AdminRoutes: Routes = [
   {
      path: 'home',
      loadComponent: async () => await import('./pages/home/home.component'),
   },
   {
      path: 'usuarios',
      loadComponent: async () => await import('./pages/users/container/component'),
   },
]
