import { Routes } from '@angular/router'
import { authGuard } from '../../guards/auth-guard'
import { SharedRoutes } from '../../routes/shared.routes'

export const AdminRoutes: Routes = [
   {
      path: 'home',
      data: { breadcrumb: 'Dashboard' },
      loadComponent: async () => await import('./pages/home/home.component'),
   },
   {
      path: 'usuarios',
      data: { breadcrumb: 'Usuarios' },
      loadComponent: async () => await import('./pages/users/container/component'),
   },
   {
      path: 'sucursales',
      data: { breadcrumb: 'Sucursales' },
      loadComponent: async () => await import('./pages/branches/container/component'),
   },
   {
      path: 'instructores',
      data: { breadcrumb: 'Instructores' },
      loadComponent: async () => await import('./pages/instructor/container/component'),
   },
   {
      path: 'horarios',
      data: { breadcrumb: 'Horarios' },
      loadComponent: async () => await import('./pages/schedules/container/component'),
   },
   {
      path: 'membresias',
      data: { breadcrumb: 'Membresías' },
      loadComponent: async () => await import('./pages/membership/container/component'),
   },
   {
      path: 'finanzas',
      data: { breadcrumb: 'Finanzas' },
      loadComponent: async () => await import('./pages/finance/container/component'),
   },
   {
      path: 'asistenciasi',
      data: { breadcrumb: 'Asistencias instructores' },
      loadComponent: async () => await import('./pages/instructorAttendance/container/component'),
   },
   {
      path: '',
      redirectTo: 'home',
      pathMatch: 'full',
   },
   ...SharedRoutes,
]
