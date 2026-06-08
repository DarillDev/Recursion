# Routable Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Открывать `CategoryFormDialogComponent` при навигации на `/categories/:id`, не перемонтируя страницу списка, через переиспользуемый механизм в `shared/ui-kit/modal`.

**Architecture:** Child route `/:id` монтирует `RoutableDialogComponent` (пустой шаблон) внутри `<router-outlet>` страницы списка. Компонент открывает диалог через `ModalService`, используя данные из `route.snapshot.data`, загруженные резолвером. При закрытии диалога — навигация на `..`. Функция `generateDialogRoute()` генерирует конфиг роута в одну строку.

**Tech Stack:** Angular 21 standalone, `@angular/cdk/dialog`, Angular Router (`ResolveFn`, `ActivatedRoute`), Vitest, TestBed.

---

## File Map

| Действие | Файл |
|---|---|
| Создать | `src/shared/ui-kit/modal/components/routable-dialog/routable-dialog.component.ts` |
| Создать | `src/shared/ui-kit/modal/components/routable-dialog/routable-dialog.component.spec.ts` |
| Создать | `src/shared/ui-kit/modal/utils/generate-dialog-route.ts` |
| Создать | `src/shared/ui-kit/modal/utils/generate-dialog-route.spec.ts` |
| Изменить | `src/shared/ui-kit/modal/index.ts` |
| Создать | `src/features/feature-categories/resolvers/category-by-id.resolver.ts` |
| Создать | `src/features/feature-categories/resolvers/category-by-id.resolver.spec.ts` |
| Изменить | `src/features/feature-categories/feature-categories.routes.ts` |
| Изменить | `src/features/feature-categories/pages/category-list-page/category-list-page.component.html` |

---

### Task 1: `RoutableDialogComponent`

**Files:**
- Create: `src/shared/ui-kit/modal/components/routable-dialog/routable-dialog.component.ts`
- Create: `src/shared/ui-kit/modal/components/routable-dialog/routable-dialog.component.spec.ts`

- [ ] **Step 1: Написать тест — компонент открывает диалог и навигирует назад при закрытии**

Создать файл `src/shared/ui-kit/modal/components/routable-dialog/routable-dialog.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { RoutableDialogComponent } from './routable-dialog.component';
import { ModalService } from '../../modal.service';
import { Component } from '@angular/core';
import { of } from 'rxjs';

@Component({ template: '', standalone: true })
class FakeDialogComponent {}

describe('RoutableDialogComponent', () => {
  let modalServiceSpy: { open: ReturnType<typeof vi.fn> };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    modalServiceSpy = { open: vi.fn().mockReturnValue(of(undefined)) };
    routerSpy = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RoutableDialogComponent],
      providers: [
        provideRouter([]),
        { provide: ModalService, useValue: modalServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { dialog: FakeDialogComponent, dialogData: { id: 1, name: 'Test' } },
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('should open the dialog with component and data from route', () => {
    TestBed.createComponent(RoutableDialogComponent).detectChanges();

    expect(modalServiceSpy.open).toHaveBeenCalledWith(
      FakeDialogComponent,
      { id: 1, name: 'Test' },
    );
  });

  it('should navigate to .. when dialog closes', () => {
    TestBed.createComponent(RoutableDialogComponent).detectChanges();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['..'], expect.objectContaining({ relativeTo: expect.anything() }));
  });

  it('should open dialog with null data when dialogData is absent', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: {
        snapshot: { data: { dialog: FakeDialogComponent } },
      },
    });
    TestBed.createComponent(RoutableDialogComponent).detectChanges();

    expect(modalServiceSpy.open).toHaveBeenCalledWith(FakeDialogComponent, null);
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться что падает**

```bash
npx ng test --include="src/shared/ui-kit/modal/components/routable-dialog/routable-dialog.component.spec.ts"
```

Ожидаем: FAIL — `Cannot find module './routable-dialog.component'`

- [ ] **Step 3: Создать `RoutableDialogComponent`**

Создать файл `src/shared/ui-kit/modal/components/routable-dialog/routable-dialog.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, inject, OnInit, Type } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { ModalService } from '../../modal.service';

@Component({
  selector: 'ui-kit-routable-dialog',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutableDialogComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly modalService = inject(ModalService);

  public ngOnInit(): void {
    const dialogComponent = this.route.snapshot.data['dialog'] as Type<unknown>;
    const dialogData = (this.route.snapshot.data['dialogData'] as unknown) ?? null;

    this.modalService
      .open(dialogComponent, dialogData)
      .pipe(take(1))
      .subscribe({ complete: () => void this.router.navigate(['..'], { relativeTo: this.route }) });
  }
}
```

- [ ] **Step 4: Запустить тест — убедиться что проходит**

```bash
npx ng test --include="src/shared/ui-kit/modal/components/routable-dialog/routable-dialog.component.spec.ts"
```

Ожидаем: PASS — 3 теста зелёных.

- [ ] **Step 5: Коммит**

```bash
git add src/shared/ui-kit/modal/components/routable-dialog/
git commit -m "feat(ui-kit/modal): add RoutableDialogComponent"
```

---

### Task 2: `generateDialogRoute`

**Files:**
- Create: `src/shared/ui-kit/modal/utils/generate-dialog-route.ts`
- Create: `src/shared/ui-kit/modal/utils/generate-dialog-route.spec.ts`

- [ ] **Step 1: Написать тест**

Создать файл `src/shared/ui-kit/modal/utils/generate-dialog-route.spec.ts`:

```ts
import { Component } from '@angular/core';
import { generateDialogRoute } from './generate-dialog-route';
import { RoutableDialogComponent } from '../components/routable-dialog/routable-dialog.component';

@Component({ template: '', standalone: true })
class FakeDialogComponent {}

const fakeResolver = () => ({ id: 1, name: 'Test' });

describe('generateDialogRoute', () => {
  it('should return route with RoutableDialogComponent', () => {
    const route = generateDialogRoute(FakeDialogComponent, ':id');

    expect(route.component).toBe(RoutableDialogComponent);
  });

  it('should set dialog component in route data', () => {
    const route = generateDialogRoute(FakeDialogComponent, ':id');

    expect(route.data?.['dialog']).toBe(FakeDialogComponent);
  });

  it('should set path correctly', () => {
    const route = generateDialogRoute(FakeDialogComponent, ':id');

    expect(route.path).toBe(':id');
  });

  it('should include resolve when provided', () => {
    const route = generateDialogRoute(FakeDialogComponent, ':id', { dialogData: fakeResolver });

    expect(route.resolve?.['dialogData']).toBe(fakeResolver);
  });

  it('should have empty resolve when not provided', () => {
    const route = generateDialogRoute(FakeDialogComponent, ':id');

    expect(route.resolve).toEqual({});
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться что падает**

```bash
npx ng test --include="src/shared/ui-kit/modal/utils/generate-dialog-route.spec.ts"
```

Ожидаем: FAIL — `Cannot find module './generate-dialog-route'`

- [ ] **Step 3: Создать `generateDialogRoute`**

Создать файл `src/shared/ui-kit/modal/utils/generate-dialog-route.ts`:

```ts
import type { ResolveData, Route } from '@angular/router';
import type { Type } from '@angular/core';
import { RoutableDialogComponent } from '../components/routable-dialog/routable-dialog.component';

export function generateDialogRoute(
  component: Type<unknown>,
  path: string,
  resolve?: ResolveData,
): Route {
  return {
    path,
    component: RoutableDialogComponent,
    data: { dialog: component },
    resolve: resolve ?? {},
  };
}
```

- [ ] **Step 4: Запустить тест — убедиться что проходит**

```bash
npx ng test --include="src/shared/ui-kit/modal/utils/generate-dialog-route.spec.ts"
```

Ожидаем: PASS — 5 тестов зелёных.

- [ ] **Step 5: Коммит**

```bash
git add src/shared/ui-kit/modal/utils/
git commit -m "feat(ui-kit/modal): add generateDialogRoute utility"
```

---

### Task 3: Обновить экспорты `modal/index.ts`

**Files:**
- Modify: `src/shared/ui-kit/modal/index.ts`

- [ ] **Step 1: Добавить экспорты**

Текущее содержимое `src/shared/ui-kit/modal/index.ts`:
```ts
export { ModalService } from './modal.service';
export { ModalContainerComponent } from './modal-container/modal-container.component';
```

Заменить на:
```ts
export { ModalService } from './modal.service';
export { ModalContainerComponent } from './modal-container/modal-container.component';
export { RoutableDialogComponent } from './components/routable-dialog/routable-dialog.component';
export { generateDialogRoute } from './utils/generate-dialog-route';
```

- [ ] **Step 2: Проверить lint**

```bash
npm run lint -- --quiet
```

Ожидаем: 0 ошибок.

- [ ] **Step 3: Коммит**

```bash
git add src/shared/ui-kit/modal/index.ts
git commit -m "feat(ui-kit/modal): export RoutableDialogComponent and generateDialogRoute"
```

---

### Task 4: `categoryByIdResolver`

**Files:**
- Create: `src/features/feature-categories/resolvers/category-by-id.resolver.ts`
- Create: `src/features/feature-categories/resolvers/category-by-id.resolver.spec.ts`

- [ ] **Step 1: Написать тест**

Создать файл `src/features/feature-categories/resolvers/category-by-id.resolver.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import type { ActivatedRouteSnapshot } from '@angular/router';
import { API_CONFIG } from '@shared/api/config';
import { categoryByIdResolver } from './category-by-id.resolver';
import { runInInjectionContext } from '@angular/core';

describe('categoryByIdResolver', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_CONFIG, useValue: { baseUrl: '' } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should call GET /front/categories/:id with numeric id', () => {
    const fakeRoute = { paramMap: { get: () => '42' } } as unknown as ActivatedRouteSnapshot;

    runInInjectionContext(TestBed, () => categoryByIdResolver(fakeRoute, null!)).subscribe();

    const req = httpMock.expectOne('/front/categories/42');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 42, name: 'Test', canEdit: true });
  });

  it('should return the category from the server', (done) => {
    const fakeRoute = { paramMap: { get: () => '7' } } as unknown as ActivatedRouteSnapshot;
    const expected = { id: 7, name: 'Alpha', canEdit: false };

    runInInjectionContext(TestBed, () => categoryByIdResolver(fakeRoute, null!)).subscribe((result) => {
      expect(result).toEqual(expected);
      done();
    });

    httpMock.expectOne('/front/categories/7').flush(expected);
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться что падает**

```bash
npx ng test --include="src/features/feature-categories/resolvers/category-by-id.resolver.spec.ts"
```

Ожидаем: FAIL — `Cannot find module './category-by-id.resolver'`

- [ ] **Step 3: Создать резолвер**

Создать файл `src/features/feature-categories/resolvers/category-by-id.resolver.ts`:

```ts
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
```

- [ ] **Step 4: Запустить тест — убедиться что проходит**

```bash
npx ng test --include="src/features/feature-categories/resolvers/category-by-id.resolver.spec.ts"
```

Ожидаем: PASS — 2 теста зелёных.

- [ ] **Step 5: Коммит**

```bash
git add src/features/feature-categories/resolvers/
git commit -m "feat(categories): add categoryByIdResolver"
```

---

### Task 5: Подключить всё в роутинге и шаблоне

**Files:**
- Modify: `src/features/feature-categories/feature-categories.routes.ts`
- Modify: `src/features/feature-categories/pages/category-list-page/category-list-page.component.html`

- [ ] **Step 1: Обновить роут конфиг**

Заменить содержимое `src/features/feature-categories/feature-categories.routes.ts`:

```ts
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
```

- [ ] **Step 2: Добавить `<router-outlet>` в шаблон списка**

В конец файла `src/features/feature-categories/pages/category-list-page/category-list-page.component.html` добавить:

```html
<div class="header">
  <h1 class="title">Categories</h1>
  @if (canEdit()) {
    <ui-kit-button variant="primary" (click)="onAdd()">+ Add</ui-kit-button>
  }
</div>

<ui-kit-search-input
  class="search"
  placeholder="Search"
  [formControl]="searchControl"
/>

<app-category-table
  class="table"
  [items]="items()"
  [isLoading]="isLoading()"
  [sort]="sort()"
  [canEdit]="canEdit()"
  [hasMore]="hasMore()"
  (sortToggle)="onSortToggle($event)"
  (edit)="onEdit($event)"
  (delete)="onDelete($event)"
  (loadMore)="onLoadMore()"
/>

<router-outlet />
```

- [ ] **Step 3: Добавить `RouterOutlet` в импорты компонента**

В `src/features/feature-categories/pages/category-list-page/category-list-page.component.ts` добавить `RouterOutlet` в массив `imports`:

```ts
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-category-list-page',
  imports: [ButtonComponent, SearchInputComponent, ReactiveFormsModule, CategoryTableComponent, RouterOutlet],
  ...
})
```

- [ ] **Step 4: Проверить lint и сборку**

```bash
npm run lint -- --quiet && npm run build 2>&1 | tail -20
```

Ожидаем: 0 ошибок lint, сборка успешна.

- [ ] **Step 5: Запустить все тесты**

```bash
npm test
```

Ожидаем: все тесты зелёные.

- [ ] **Step 6: Коммит**

```bash
git add src/features/feature-categories/feature-categories.routes.ts \
        src/features/feature-categories/pages/category-list-page/category-list-page.component.html \
        src/features/feature-categories/pages/category-list-page/category-list-page.component.ts
git commit -m "feat(categories): open edit dialog on /categories/:id route"
```

---

### Task 6: Ручное тестирование

- [ ] **Step 1: Запустить dev server**

```bash
npm start
```

- [ ] **Step 2: Проверить открытие диалога по URL**

1. Открыть `http://localhost:4200/categories`
2. Убедиться, что список загружается нормально
3. Скопировать любой `id` из таблицы
4. Перейти напрямую в адресной строке на `http://localhost:4200/categories/{id}`
5. Ожидаем: список остаётся на месте, диалог редактирования открывается с данными категории
6. Закрыть диалог (крестик или Cancel)
7. Ожидаем: редирект на `/categories`, список на месте, диалог закрыт

- [ ] **Step 3: Проверить что кнопка Edit в таблице всё ещё работает**

1. Кликнуть по кнопке Edit в строке таблицы
2. Ожидаем: диалог открывается, URL меняется на `/categories/{id}`
3. Сохранить изменения
4. Ожидаем: диалог закрывается, список обновляется, URL возвращается на `/categories`
