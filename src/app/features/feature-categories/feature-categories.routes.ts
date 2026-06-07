import { Routes } from '@angular/router';

export const FEATURE_CATEGORIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/category-list-page/category-list-page.component').then(
        (m) => m.CategoryListPageComponent,
      ),
  },
];
