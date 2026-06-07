# OpenAPI → TypeScript Mapping

## Type mapping

| OpenAPI | TypeScript |
|---------|-----------|
| `string` | `string` |
| `integer` / `number` | `number` |
| `boolean` | `boolean` |
| `array` of `T` | `T[]` |
| `object` with `properties` | inline interface or named interface |
| `$ref: '#/components/schemas/Foo'` | resolve and use `IFoo` |
| `nullable: true` | `T \| null` |
| optional (not in `required[]`) | `T?` |

## Resolving `$ref`

Recursively resolve `$ref` chains from `components/schemas`. If a schema is used in multiple places, extract it as a named interface.

## DTO vs domain model decision

**Keep only domain model (no DTO)** when:
- All response fields match 1:1 with what the feature needs
- No renaming or transformation needed

**Create separate DTO** when:
- Response has extra server-only fields (e.g. `_links`, `meta`)
- Pagination wrapper: `{ items: T[], total: number, page: number }` — DTO wraps list, domain model = item type
- Field names differ from desired domain names

**Create mapper** (in `<resource>.service.ts` using `map()`) when:
- DTO and domain model differ
- Otherwise, pass through directly

## Pagination pattern

Server returns `{ items: IFoo[], totalCount: number, ... }`:
```ts
// dtos/foo-list-response-dto.interface.ts
export interface IFooListResponseDto {
  items: IFoo[];
  totalCount: number;
}

// services/foo/foo.service.ts — strip wrapper
public getList(params?: IFooSearchParams): Observable<IFoo[]> {
  return this.fooApiService.getList(params).pipe(map(r => r.items));
}
```

## Search params pattern

GET list with optional query params:
```ts
// interfaces/foo-search-params.interface.ts
export interface IFooSearchParams {
  pageNumber?: number;
  search?: string;
  sortDesc?: boolean;
}
```

Nullable optional `id` check param:
```ts
// interfaces/name-exists-params.interface.ts
export interface INameExistsParams {
  name: string;
  id?: string | null;
}
```
