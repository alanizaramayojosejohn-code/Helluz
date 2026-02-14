import { Routes } from '@angular/router'
import { adminGuard, authGuard, instructorGuard, noAuthGuard } from './guards/auth-guard'
import { AdminRoutes } from './ui/admin/routes'
import { PublicRoutes } from './ui/public/routes'
import { DevRoutes } from './ui/dev/routes'
import { InstructorRoutes } from './ui/instructor/routes'
export const routes: Routes = [
   // www.coffe.com/
   // www.coffe.com/admin/
   {
      path: '',
      loadComponent: async () => await import('./ui/public/container/component'),
      children: PublicRoutes,
   },
   {
      path: 'admin',
      canActivate: [adminGuard],
      loadComponent: async () => await import('./ui/admin/container/component'),
      children: AdminRoutes,
   },
   {
      path: 'instructor',
      canActivate: [instructorGuard],
      loadComponent: async () => await import('./ui/instructor/container/component'),
      children: InstructorRoutes,
   },
   {
      path: 'dev',
      loadComponent: async () => await import('./ui/dev/container/component'),
      children: DevRoutes,
   },
]
