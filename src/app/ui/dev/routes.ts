import { Routes } from '@angular/router'

export const DevRoutes: Routes = [
   {
      path: '',
      loadComponent: async () => await import('./seed/container/component'),
   },
   {
      path: 'seed',
      loadComponent: async () => await import('./seed/container/component'),
   },
]
