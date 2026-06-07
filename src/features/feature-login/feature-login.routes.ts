import type { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page.component';

export const FEATURE_LOGIN_ROUTES: Routes = [
  {
    path: '',
    component: LoginPageComponent,
  },
];
