import type { Routes } from '@angular/router';
import { NotFoundComponent } from './pages/not-found/not-found.component';

export const FEATURE_NOT_FOUND_ROUTES: Routes = [
  {
    path: '',
    component: NotFoundComponent,
  },
];
