import { inject } from '@angular/core';
import type { ResolveFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import type { ICategory } from '@shared/api/categories';
import { CategoriesApiService } from '@shared/api/categories';

export const categoryByIdResolver: ResolveFn<ICategory> = (
  route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
) => {
  const id = Number(route.paramMap.get('id'));

  return inject(CategoriesApiService).getById(id);
};
