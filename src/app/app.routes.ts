import { Routes } from '@angular/router'
import { authGuard, noAuthGuard } from './guards/auth-guard'
import { AdminRoutes } from './ui/admin/routes'
import { PublicRoutes } from './ui/public/routes'
import { DevRoutes } from './ui/dev/routes'
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
      loadComponent: async () => await import('./ui/admin/container/component'),
      children: AdminRoutes,
   },
   {
      path: 'dev',
      loadComponent: async () => await import('./ui/dev/container/component'),
      children: DevRoutes,
   },
]
