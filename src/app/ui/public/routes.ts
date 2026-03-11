import { Routes } from '@angular/router'

export const PublicRoutes: Routes = [
  {
    path: 'home',
    loadComponent: async () => await import('./pages/home/container/component')
  },
  {
      path: 'log-in',
      loadComponent: async () => await import('./pages/log-in/log-in.component'),
   },
   {
      path: 'asistenciaalumnos',
      loadComponent: async () => await import('./pages/markStudentAttendance/container/component'),
   },
   {
      path: 'registrarUsuario',
      loadComponent: async () => await import('./pages/registerUser/container/component'),
   },
  //  {
  //     path: 'asistenciainstructores',
  //     loadComponent: async () => await import('./pages/markInstructorAttendance/container/component'),
  //  },
   {
      path: '',
      loadComponent: async () => await import('./pages/home/container/component'),
   },
   //  {
   //   path: 'asistenciae',
   //   loadComponent: async () => await import('./../admin/pages/studentAttendance/components/mark/container/component')
   //  }
]
