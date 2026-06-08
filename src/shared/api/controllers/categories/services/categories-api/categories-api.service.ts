import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { ApiService } from '@shared/api/core';
import type { ICreateCategoryDto } from '../../dtos/create-category-dto.interface';
import type { IUpdateCategoryDto } from '../../dtos/update-category-dto.interface';
import type { ICategory } from '../../interfaces/category.interface';
import type { ICategoriesSearchParams } from '../../interfaces/categories-search-params.interface';
import type { INameExistsParams } from '../../interfaces/name-exists-params.interface';
import type { ICategoriesListResult } from '../../interfaces/categories-list-result.interface';

@Injectable({ providedIn: 'root' })
export class CategoriesApiService {
  private readonly apiService = inject(ApiService);

  private readonly url = '/front/categories';

  public getList(params?: ICategoriesSearchParams): Observable<ICategoriesListResult> {
    return this.apiService.get(this.url, params);
  }

  public getById(id: number): Observable<ICategory> {
    return this.apiService.get(`${this.url}/${id}`);
  }

  public create(body: ICreateCategoryDto): Observable<ICategory> {
    return this.apiService.post(this.url, body);
  }

  public update(id: number, body: IUpdateCategoryDto): Observable<ICategory> {
    // POST по спецификации Swagger — сервер не поддерживает PUT/PATCH для этого endpoint
    return this.apiService.post(`${this.url}/${id}`, body);
  }

  public delete(id: number): Observable<void> {
    return this.apiService.delete(`${this.url}/${id}`);
  }

  public checkNameExists(params: INameExistsParams): Observable<boolean> {
    return this.apiService.get(`${this.url}/name-exists`, params);
  }
}
