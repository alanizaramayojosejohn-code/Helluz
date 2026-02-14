import { Routes } from '@angular/router'

export const PublicRoutes: Routes = [
   {
      path: 'log-in',
      loadComponent: async () => await import('./pages/log-in/log-in.component'),
   },
   {
      path: '',
      loadComponent: async () => await import('./pages/log-in/log-in.component'),
   },
   //  {
   //   path: 'asistenciae',
   //   loadComponent: async () => await import('./../admin/pages/studentAttendance/components/mark/container/component')
   //  }
]
