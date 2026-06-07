# ui-kit-button — Спецификация

**Дата:** 2026-06-08
**Figma:** https://www.figma.com/design/KCYaDH4HaImmOB7ZASq784/Zidium?node-id=1508-21459

## Цель

Переиспользуемый компонент кнопки для всего приложения. Заменяет разрозненные нативные `<button>` с локальными стилями (`.login-btn` и др.).

## API

```ts
@Input() variant: 'primary' | 'secondary' | 'danger' = 'primary';
@Input() disabled: boolean = false;
@Input() type: 'button' | 'submit' | 'reset' = 'button';
```

Контент — через `<ng-content>` (текст кнопки).

## Варианты (по макетам)

| Variant | Фон | Текст |
|---|---|---|
| `primary` | `--color-primary` (синий) | белый |
| `secondary` | светло-серый | тёмный |
| `danger` | тёмно-красный | белый |

## Состояния

- **normal** — базовый вид
- **hover** — затемнение фона
- **active** — более сильное затемнение
- **disabled** — `opacity: 0.4`, `cursor: not-allowed`, `pointer-events: none`

## Структура файлов

```
src/shared/ui-kit/button/
  button.component.ts
  button.component.scss
  index.ts
```

Экспорт через `@shared/ui-kit/button` (алиас уже покрыт `@shared/ui-kit/*`).

## Реализация

- Standalone компонент, `ChangeDetectionStrategy.OnPush`
- Хост-элемент — сам `<button>`: `host: { '[attr.disabled]': 'disabled || null', '[attr.type]': 'type' }`
- Вариант применяется через атрибут на хосте: `host: { '[attr.data-variant]': 'variant' }`, стили пишутся по `:host([data-variant="primary"])`
- SCSS использует CSS-переменные из дизайн-системы (`--color-primary`, `--color-border-*`, `--radius-sm` и т.д.)
- Нет зависимостей от других ui-kit компонентов

## Использование

```html
<ui-kit-button variant="primary" type="submit">Save</ui-kit-button>
<ui-kit-button variant="secondary" (click)="close()">Close</ui-kit-button>
<ui-kit-button variant="danger" [disabled]="isLoading()" (click)="delete()">Delete</ui-kit-button>
```

## Что НЕ входит в scope

- Иконки внутри кнопки
- Состояние `loading` (спиннер)
- Размеры (sm/md/lg) — один размер по макету
