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
   {
      path: 'membresias',
      loadComponent: async () => await import('./pages/membership/container/component'),
   },
   {
    path: 'alumnos',
    loadComponent: async () => await import('./pages/student/container/component'),
   },
   {
    path: 'inscripciones',
    loadComponent: async () => await import('./pages/enrollments/container/component'),
   },

]
