// routes/shared.routes.ts
import { Routes } from '@angular/router'
import { adminOrInstructorGuard } from '../guards/auth-guard'

export const SharedRoutes: Routes = [
   {
      path: 'alumnos',
      canActivate: [adminOrInstructorGuard],
      loadComponent: () => import('../ui/admin/pages/student/container/component'),
   },
   {
      path: 'inscripciones',
      canActivate: [adminOrInstructorGuard],
      loadComponent: () => import('../ui/admin/pages/enrollments/container/component'),
   },
   {
      path: 'horarios',
      canActivate: [adminOrInstructorGuard],
      loadComponent: () => import('../ui/admin/pages/schedules/container/component'),
   },
   {
      path: 'asistenciasa',
      canActivate: [adminOrInstructorGuard],
      loadComponent: () => import('../ui/admin/pages/studentAttendance/container/component'),
   },
]
