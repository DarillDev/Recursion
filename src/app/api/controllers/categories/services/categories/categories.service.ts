import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ICreateCategoryDto } from '../../dtos/create-category-dto.interface';
import type { IUpdateCategoryDto } from '../../dtos/update-category-dto.interface';
import type { ICategory } from '../../interfaces/category.interface';
import type { ICategoriesSearchParams } from '../../interfaces/categories-search-params.interface';
import type { INameExistsParams } from '../../interfaces/name-exists-params.interface';
import { CategoriesApiService } from '../categories-api/categories-api.service';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly api = inject(CategoriesApiService);

  public getList(params?: ICategoriesSearchParams): Observable<ICategory[]> {
    return this.api.getList(params).pipe(map((response) => response.items));
  }

  public getById(id: string): Observable<ICategory> {
    return this.api.getById(id);
  }

  public create(body: ICreateCategoryDto): Observable<ICategory> {
    return this.api.create(body);
  }

  public update(id: string, body: IUpdateCategoryDto): Observable<ICategory> {
    return this.api.update(id, body);
  }

  public delete(id: string): Observable<void> {
    return this.api.delete(id);
  }

  public checkNameExists(params: INameExistsParams): Observable<boolean> {
    return this.api.checkNameExists(params);
  }
}
