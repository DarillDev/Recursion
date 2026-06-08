# Routable Dialog — дизайн

**Дата:** 2026-06-08  
**Фича:** открытие диалогового окна при переходе на роут `/categories/:id`

## Цель

Реализовать открытие `CategoryFormDialogComponent` при навигации на `/categories/:id` так, как если бы пользователь нажал кнопку редактирования в таблице. Список категорий при этом не должен перемонтироваться.

## Архитектура

Два новых артефакта в `shared/ui-kit/modal`, переиспользуемые для любых диалогов приложения:

1. **`RoutableDialogComponent`** — компонент с пустым шаблоном, монтируется в `<router-outlet>` родителя, открывает диалог и навигирует назад при закрытии.
2. **`generateDialogRoute()`** — функция-генератор, создаёт Angular `Route` конфиг.

Плюс **`categoryByIdResolver`** в фиче categories — загружает `ICategory` по `:id` из URL.

## Структура файлов

```
shared/ui-kit/modal/
  components/
    modal-container/          (существующий)
    routable-dialog/
      routable-dialog.component.ts   ← новый
  utils/
    generate-dialog-route.ts         ← новый
  modal.service.ts            (существующий)
  index.ts                    (дополнить экспортами)

features/feature-categories/
  resolvers/
    category-by-id.resolver.ts       ← новый
  feature-categories.routes.ts       (изменить)
  pages/category-list-page/
    category-list-page.component.html (добавить <router-outlet>)
```

## Компоненты

### `RoutableDialogComponent`

```ts
@Component({ template: '', standalone: true })
export class RoutableDialogComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly modalService = inject(ModalService);
  private readonly destroy = createDestroyer();

  public ngOnInit(): void {
    const dialogComponent = this.route.snapshot.data['dialog'] as Type<unknown>;
    const dialogData = this.route.snapshot.data['dialogData'] ?? null;

    this.modalService.open(dialogComponent, dialogData)
      .pipe(take(1), this.destroy())
      .subscribe({ complete: () => void this.router.navigate(['..'], { relativeTo: this.route }) });
  }
}
```

### `generateDialogRoute()`

```ts
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

### `categoryByIdResolver`

```ts
export const categoryByIdResolver: ResolveFn<ICategory> = (route) => {
  const id = route.paramMap.get('id')!;
  return inject(CategoriesApiService).getById(id);
};
```

Если категория не найдена (404), резолвер возвращает `EMPTY` или кидает ошибку — роутер не активирует компонент, диалог не открывается.

## Роут конфиг

```ts
// feature-categories.routes.ts
export const FEATURE_CATEGORIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/category-list-page/...').then(m => m.CategoryListPageComponent),
    children: [
      generateDialogRoute(CategoryFormDialogComponent, ':id', {
        dialogData: categoryByIdResolver,
      }),
    ],
  },
];
```

`CategoryListPageComponent` получает `<router-outlet />` в конец шаблона — outlet невидим, но нужен Angular для монтирования child route.

## Поток данных

```
Пользователь переходит на /categories/123
  ├── CategoryListPageComponent остаётся смонтированным (список не сбрасывается)
  └── categoryByIdResolver: GET /front/categories/123
        → успех: RoutableDialogComponent.ngOnInit()
            → modalService.open(CategoryFormDialogComponent, category)
                → пользователь сохраняет / отменяет / закрывает
                    → router.navigate(['..']) → /categories
        → ошибка/404: навигация не происходит
```

## Закрытие диалога

- Крестик / кнопка «Отмена» → `dialogRef.close()` → `closed` observable completes → `router.navigate(['..'])` → `/categories`
- Успешное сохранение → то же самое (список обновляется отдельно через `CategoryListService`)

## Что НЕ входит в скоуп

- Роут для добавления (`/categories/new`) — отдельная задача
- Обработка 404 в UI (тост/редирект) — отдельная задача
- Анимация открытия диалога при deep link — не требуется
