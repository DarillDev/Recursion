# File Templates

All paths relative to `src/app/api/controllers/<resource>/`.

## Domain model interface

```ts
// interfaces/<resource>.interface.ts
export interface IFoo {
  id: string;
  name: string;
  // ... fields from spec
}
```

## Search params interface

```ts
// interfaces/<resource>-search-params.interface.ts
export interface IFooSearchParams {
  pageNumber?: number;
  search?: string;
  sortDesc?: boolean;
}
```

## Create/Update DTOs

```ts
// dtos/create-<resource>-dto.interface.ts
export interface ICreateFooDto {
  name: string;
}

// dtos/update-<resource>-dto.interface.ts
export interface IUpdateFooDto {
  name: string;
}
```

## List response DTO (only if server wraps list)

```ts
// dtos/<resource>-list-response-dto.interface.ts
import type { IFoo } from '../interfaces/foo.interface';

export interface IFooListResponseDto {
  items: IFoo[];
  totalCount: number;
}
```

## Raw HTTP service

```ts
// services/<resource>-api/<resource>-api.service.ts
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@api/core';
import type { IFooListResponseDto } from '../../dtos/foo-list-response-dto.interface';
import type { ICreateFooDto } from '../../dtos/create-foo-dto.interface';
import type { IUpdateFooDto } from '../../dtos/update-foo-dto.interface';
import type { IFoo } from '../../interfaces/foo.interface';
import type { IFooSearchParams } from '../../interfaces/foo-search-params.interface';

@Injectable({ providedIn: 'root' })
export class FooApiService {
  private readonly apiService = inject(ApiService);

  private readonly url = '/front/foos';

  public getList(params?: IFooSearchParams): Observable<IFooListResponseDto> {
    return this.apiService.get(this.url, params);
  }

  public getById(id: string): Observable<IFoo> {
    return this.apiService.get(`${this.url}/${id}`);
  }

  public create(body: ICreateFooDto): Observable<IFoo> {
    return this.apiService.post(this.url, body);
  }

  public update(id: string, body: IUpdateFooDto): Observable<IFoo> {
    return this.apiService.post(`${this.url}/${id}`, body);
  }

  public delete(id: string): Observable<void> {
    return this.apiService.delete(`${this.url}/${id}`);
  }
}
```

## Public service (with mapping)

```ts
// services/<resource>/<resource>.service.ts
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ICreateFooDto } from '../../dtos/create-foo-dto.interface';
import type { IUpdateFooDto } from '../../dtos/update-foo-dto.interface';
import type { IFoo } from '../../interfaces/foo.interface';
import type { IFooSearchParams } from '../../interfaces/foo-search-params.interface';
import { FooApiService } from '../foo-api/foo-api.service';

@Injectable({ providedIn: 'root' })
export class FooService {
  private readonly fooApiService = inject(FooApiService);

  public getList(params?: IFooSearchParams): Observable<IFoo[]> {
    return this.fooApiService.getList(params).pipe(map(r => r.items));
  }

  public getById(id: string): Observable<IFoo> {
    return this.fooApiService.getById(id);
  }

  public create(body: ICreateFooDto): Observable<IFoo> {
    return this.fooApiService.create(body);
  }

  public update(id: string, body: IUpdateFooDto): Observable<IFoo> {
    return this.fooApiService.update(id, body);
  }

  public delete(id: string): Observable<void> {
    return this.fooApiService.delete(id);
  }
}
```

## Barrel index.ts

```ts
// index.ts — export types first, then classes
export type { IFooListResponseDto } from './dtos/foo-list-response-dto.interface';
export type { ICreateFooDto } from './dtos/create-foo-dto.interface';
export type { IUpdateFooDto } from './dtos/update-foo-dto.interface';

export type { IFoo } from './interfaces/foo.interface';
export type { IFooSearchParams } from './interfaces/foo-search-params.interface';

export { FooApiService } from './services/foo-api/foo-api.service';
export { FooService } from './services/foo/foo.service';
```

## README.md

```markdown
# Foo controller

HTTP-слой для <описание ресурса>.

**Swagger:** <swagger-url>

## Endpoints

| Метод    | URL                  | Описание                          |
| -------- | -------------------- | --------------------------------- |
| `GET`    | `/front/foos`        | Список (пагинация, поиск)         |
| `POST`   | `/front/foos`        | Создание                          |
| `GET`    | `/front/foos/:id`    | Получение по id                   |
| `POST`   | `/front/foos/:id`    | Обновление                        |
| `DELETE` | `/front/foos/:id`    | Удаление                          |

## Сервисы

| Сервис              | Метод                             | Описание                      |
| ------------------- | --------------------------------- | ----------------------------- |
| `FooApiService`     | `getList(params?)`                | GET /front/foos               |
| `FooApiService`     | `getById(id)`                     | GET /front/foos/:id           |
| `FooApiService`     | `create(body)`                    | POST /front/foos              |
| `FooApiService`     | `update(id, body)`                | POST /front/foos/:id          |
| `FooApiService`     | `delete(id)`                      | DELETE /front/foos/:id        |
| `FooService`        | `getList(params?)` → `IFoo[]`     | Unwraps pagination DTO        |
| `FooService`        | `getById(id)` → `IFoo`            | Pass-through                  |
| `FooService`        | `create(body)` → `IFoo`           | Pass-through                  |
| `FooService`        | `update(id, body)` → `IFoo`       | Pass-through                  |
| `FooService`        | `delete(id)` → `void`             | Pass-through                  |
```
