import type { Routes } from '@angular/router';
import { InternalLayoutComponent } from './internal-layout.component';

export const INTERNAL_LAYOUT_ROUTES: Routes = [
  {
    path: '',
    component: InternalLayoutComponent,
    children: [
      {
        path: 'categories',
        loadChildren: () =>
          import('src/features/feature-categories').then((m) => m.FEATURE_CATEGORIES_ROUTES),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'categories',
      },
    ],
  },
];
