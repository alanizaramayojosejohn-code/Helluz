// routes/shared.routes.ts
import { Routes } from '@angular/router'
import { adminOrInstructorGuard } from '../guards/auth-guard'

export const SharedRoutes: Routes = [
   {
      path: 'alumnos',
      data: { breadcrumb: 'Alumnos' },
      canActivate: [adminOrInstructorGuard],
      loadComponent: () => import('../ui/admin/pages/student/container/component'),
   },
   {
      path: 'inscripciones',
      data: { breadcrumb: 'Inscripciones' },
      canActivate: [adminOrInstructorGuard],
      loadComponent: () => import('../ui/admin/pages/enrollments/container/component'),
   },
   {
      path: 'horarios',
      data: { breadcrumb: 'Horarios' },
      canActivate: [adminOrInstructorGuard],
      loadComponent: () => import('../ui/admin/pages/schedules/container/component'),
   },
   {
      path: 'asistenciasa',
      data: { breadcrumb: 'Asistencias alumnos' },
      canActivate: [adminOrInstructorGuard],
      loadComponent: () => import('../ui/admin/pages/studentAttendance/container/component'),
   },
   {
      path: 'asistenciainstructores',
      data: { breadcrumb: 'Marcar asistencia' },
      canActivate: [adminOrInstructorGuard],
      loadComponent: () => import('../ui/public/pages/markInstructorAttendance/container/component'),
   },
]
