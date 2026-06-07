# ui-kit-button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать переиспользуемый компонент `<ui-kit-button>` с тремя вариантами (primary, secondary, danger) и состоянием disabled.

**Architecture:** Standalone Angular компонент с шаблоном, содержащим нативный `<button>`. Хост-элемент использует `display: contents`, нативная кнопка получает все стили. Вариант передаётся через `[attr.data-variant]`, SCSS стили пишутся по `.btn[data-variant="..."]`.

**Tech Stack:** Angular 21, OnPush, signals (input()), SCSS, CSS-переменные из `_tokens.scss`, Vitest/TestBed.

---

## Файловая структура

| Файл | Действие | Назначение |
|---|---|---|
| `src/shared/ui-kit/button/button.component.ts` | Создать | Компонент |
| `src/shared/ui-kit/button/button.component.scss` | Создать | Стили |
| `src/shared/ui-kit/button/button.component.spec.ts` | Создать | Тесты |
| `src/shared/ui-kit/button/index.ts` | Создать | Barrel-экспорт |
| `src/features/feature-login/pages/login-page/login-page.component.html` | Изменить | Заменить `<button class="login-btn">` на `<ui-kit-button>` |
| `src/features/feature-login/pages/login-page/login-page.component.ts` | Изменить | Добавить импорт `ButtonComponent` |
| `src/features/feature-login/pages/login-page/login-page.component.scss` | Изменить | Удалить блок `.login-btn` |

---

## Task 1: Создать компонент ButtonComponent

**Files:**
- Create: `src/shared/ui-kit/button/button.component.ts`
- Create: `src/shared/ui-kit/button/button.component.scss`

- [ ] **Step 1: Создать файл компонента**

Создать `src/shared/ui-kit/button/button.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type TButtonVariant = 'primary' | 'secondary' | 'danger';
export type TButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'ui-kit-button',
  template: `
    <button
      class="btn"
      [attr.data-variant]="variant()"
      [type]="type()"
      [disabled]="disabled() || null"
    >
      <ng-content />
    </button>
  `,
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  public readonly variant = input<TButtonVariant>('primary');
  public readonly disabled = input<boolean>(false);
  public readonly type = input<TButtonType>('button');
}
```

- [ ] **Step 2: Создать файл стилей**

Создать `src/shared/ui-kit/button/button.component.scss`:

```scss
:host {
  display: contents;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-base);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;

  &[data-variant='primary'] {
    background: var(--color-primary);
    color: var(--color-white);

    &:hover:not(:disabled) {
      background: #004a8c;
    }

    &:active:not(:disabled) {
      background: #003a6e;
    }
  }

  &[data-variant='secondary'] {
    background: var(--color-window);
    color: var(--text-primary);
    border: 1px solid var(--color-stroke);

    &:hover:not(:disabled) {
      background: #e9ecef;
    }

    &:active:not(:disabled) {
      background: #dee2e6;
    }
  }

  &[data-variant='danger'] {
    background: var(--color-error);
    color: var(--color-white);

    &:hover:not(:disabled) {
      background: #b02a37;
    }

    &:active:not(:disabled) {
      background: #8c1e28;
    }
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}
```

- [ ] **Step 3: Создать barrel-экспорт**

Создать `src/shared/ui-kit/button/index.ts`:

```ts
export { ButtonComponent } from './button.component';
export type { TButtonVariant, TButtonType } from './button.component';
```

- [ ] **Step 4: Убедиться что сборка не падает**

```bash
npx tsc -p tsconfig.app.json --noEmit
```

Ожидаемый результат: нет вывода (0 ошибок).

- [ ] **Step 5: Коммит**

```bash
git add src/shared/ui-kit/button/
git commit -m "feat(ui-kit): add ButtonComponent with primary/secondary/danger variants"
```

---

## Task 2: Написать тесты

**Files:**
- Create: `src/shared/ui-kit/button/button.component.spec.ts`

- [ ] **Step 1: Написать тесты**

Создать `src/shared/ui-kit/button/button.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ButtonComponent } from './button.component';

@Component({
  imports: [ButtonComponent],
  template: `<ui-kit-button [variant]="variant" [disabled]="disabled" [type]="type">Click</ui-kit-button>`,
})
class TestHostComponent {
  variant: 'primary' | 'secondary' | 'danger' = 'primary';
  disabled = false;
  type: 'button' | 'submit' | 'reset' = 'button';
}

describe('ButtonComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let btn: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    btn = fixture.nativeElement.querySelector('button');
  });

  it('should create', () => {
    expect(btn).toBeTruthy();
  });

  it('should render ng-content text', () => {
    expect(btn.textContent?.trim()).toBe('Click');
  });

  it('should apply default variant "primary"', () => {
    expect(btn.getAttribute('data-variant')).toBe('primary');
  });

  it('should apply secondary variant', () => {
    fixture.componentInstance.variant = 'secondary';
    fixture.detectChanges();
    expect(btn.getAttribute('data-variant')).toBe('secondary');
  });

  it('should apply danger variant', () => {
    fixture.componentInstance.variant = 'danger';
    fixture.detectChanges();
    expect(btn.getAttribute('data-variant')).toBe('danger');
  });

  it('should not be disabled by default', () => {
    expect(btn.disabled).toBe(false);
  });

  it('should set disabled attribute when disabled=true', () => {
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    expect(btn.disabled).toBe(true);
  });

  it('should have default type "button"', () => {
    expect(btn.type).toBe('button');
  });

  it('should set type="submit"', () => {
    fixture.componentInstance.type = 'submit';
    fixture.detectChanges();
    expect(btn.type).toBe('submit');
  });
});
```

- [ ] **Step 2: Запустить тесты и убедиться что они проходят**

```bash
npx ng test --include="src/shared/ui-kit/button/button.component.spec.ts"
```

Ожидаемый результат: `9 passed`.

- [ ] **Step 3: Коммит**

```bash
git add src/shared/ui-kit/button/button.component.spec.ts
git commit -m "test(ui-kit): add ButtonComponent tests"
```

---

## Task 3: Заменить .login-btn на ui-kit-button

**Files:**
- Modify: `src/features/feature-login/pages/login-page/login-page.component.html`
- Modify: `src/features/feature-login/pages/login-page/login-page.component.ts`
- Modify: `src/features/feature-login/pages/login-page/login-page.component.scss`

- [ ] **Step 1: Обновить шаблон login-page**

В `src/features/feature-login/pages/login-page/login-page.component.html` заменить:

```html
    <div class="login-card__action">
      <button class="login-btn" type="submit">Logon</button>
    </div>
```

на:

```html
    <div class="login-card__action">
      <ui-kit-button variant="primary" type="submit">Logon</ui-kit-button>
    </div>
```

- [ ] **Step 2: Добавить импорт в компонент**

В `src/features/feature-login/pages/login-page/login-page.component.ts` добавить `ButtonComponent` в `imports`:

```ts
import { ButtonComponent } from '@shared/ui-kit/button';

@Component({
  // ...
  imports: [
    // ... существующие импорты ...
    ButtonComponent,
  ],
})
```

- [ ] **Step 3: Удалить стили .login-btn**

В `src/features/feature-login/pages/login-page/login-page.component.scss` полностью удалить блок:

```scss
.login-btn {
  padding: 10px 20px;
  background: var(--color-primary);
  color: var(--color-white);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-base);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;

  &:hover {
    background: #004a8c;
  }

  &:active {
    background: #003a6e;
  }
}
```

- [ ] **Step 4: Проверить сборку**

```bash
npx tsc -p tsconfig.app.json --noEmit
```

Ожидаемый результат: нет вывода (0 ошибок).

- [ ] **Step 5: Коммит**

```bash
git add src/features/feature-login/
git commit -m "refactor(login): replace native button with ui-kit-button"
```
