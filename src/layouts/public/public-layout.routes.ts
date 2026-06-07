import type { Routes } from '@angular/router';
import { PublicLayoutComponent } from './public-layout.component';

export const PUBLIC_LAYOUT_ROUTES: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('src/features/feature-login').then((m) => m.FEATURE_LOGIN_ROUTES),
      },
    ],
  },
];
