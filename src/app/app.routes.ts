import type { Routes } from '@angular/router';
import { authGuard, publicGuard } from 'src/shared/auth';

export const routes: Routes = [
  {
    path: '',
    canActivate: [publicGuard],
    loadChildren: () => import('src/layouts/public').then((module) => module.PUBLIC_LAYOUT_ROUTES),
  },
  {
    path: 'internal',
    canActivate: [authGuard],
    loadChildren: () =>
      import('src/layouts/internal').then((module) => module.INTERNAL_LAYOUT_ROUTES),
  },
];
