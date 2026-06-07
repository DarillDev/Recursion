import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './public-layout.component';
export const PUBLIC_LAYOUT_ROUTES: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: 'login',
        loadChildren: () => import('@features/feature-login').then((m) => m.FEATURE_LOGIN_ROUTES),
      },
    ],
  },
];
