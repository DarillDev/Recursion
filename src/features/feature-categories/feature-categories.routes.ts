import type { Routes } from '@angular/router';
import { generateDialogRoute } from '@shared/ui-kit/modal';
import { CategoryFormDialogComponent } from './components/category-form-dialog/category-form-dialog.component';
import { categoryByIdResolver } from './resolvers/category-by-id.resolver';

export const FEATURE_CATEGORIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/category-list-page/category-list-page.component').then(
        (m) => m.CategoryListPageComponent,
      ),
    children: [
      generateDialogRoute(CategoryFormDialogComponent, ':id', {
        dialogData: categoryByIdResolver,
      }),
    ],
  },
];
