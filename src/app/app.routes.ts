import type { Routes } from '@angular/router';
import { authGuard, publicGuard } from '@auth';

export const routes: Routes = [
  {
    path: '',
    canActivate: [publicGuard],
    loadChildren: () => import('@layouts/public').then((module) => module.PUBLIC_LAYOUT_ROUTES),
  },
  {
    path: 'internal',
    canActivate: [authGuard],
    loadChildren: () => import('@layouts/internal').then((module) => module.INTERNAL_LAYOUT_ROUTES),
  },
];
