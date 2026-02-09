import { Routes } from '@angular/router'

export const AdminRoutes: Routes = [
   {
      path: '',
      loadComponent: async () => await import('./pages/home/home.component'),
   },
   {
      path: 'home',
      loadComponent: async () => await import('./pages/home/home.component'),
   },
   {
      path: 'usuarios',
      loadComponent: async () => await import('./pages/users/container/component'),
   },
   {
      path: 'sucursales',
      loadComponent: async () => await import('./pages/branches/container/component'),
   },
   {
      path: 'instructores',
      loadComponent: async () => await import('./pages/instructor/container/component'),
   },
   {
      path: 'horarios',
      loadComponent: async () => await import('./pages/schedules/container/component'),
   },
]
