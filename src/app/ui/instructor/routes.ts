import { Routes } from '@angular/router'

export const InstructorRoutes: Routes = [
  {
    path: 'home',
    loadComponent: async () => await import('./pages/home/home.component'),
  },
  {
    path: 'alumnos',
    loadComponent: async () => await import('./../admin/pages/student/container/component'),
  },
  {
    path: 'inscripciones',
    loadComponent: async () => await import('./../admin/pages/enrollments/container/component'),
  },
  {
     path: '',
     redirectTo: 'home',
     pathMatch: 'full'
  },
]
