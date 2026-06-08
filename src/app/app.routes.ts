import type { Routes } from '@angular/router';
import { authGuard, publicGuard } from '@shared/auth';

export const routes: Routes = [
  {
    path: '',
    canActivate: [publicGuard],
    loadChildren: () => import('@layouts/public').then((module) => module.PUBLIC_LAYOUT_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadChildren: () => import('@layouts/internal').then((module) => module.INTERNAL_LAYOUT_ROUTES),
  },
];
