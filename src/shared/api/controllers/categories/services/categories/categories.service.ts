import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { INameExistsParams } from '../../interfaces/name-exists-params.interface';
import { CategoriesApiService } from '../categories-api/categories-api.service';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly api = inject(CategoriesApiService);

  public checkNameExists(params: INameExistsParams): Observable<boolean> {
    return this.api.checkNameExists(params);
  }
}
