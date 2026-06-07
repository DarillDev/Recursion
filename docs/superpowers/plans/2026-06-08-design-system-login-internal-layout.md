# Design System: токены, логин, internal layout — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать базовую дизайн-систему с CSS-токенами и шрифтом Roboto, переверстать форму логина и internal layout по Figma-макетам.

**Architecture:** CSS custom properties в `src/styles/_tokens.scss` → обновить существующие ui-kit компоненты (form-field, input-field) → переверстать login-page через существующие ui-kit компоненты → создать SidebarComponent и обновить InternalLayoutComponent.

**Tech Stack:** Angular 21 standalone, SCSS, CSS custom properties, SVG sprite, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-08-design-system-login-internal-layout.md`

---

## Карта файлов

| Файл | Действие |
|---|---|
| `public/fonts/roboto-regular.woff2` | Создать — шрифт Roboto 400 |
| `public/fonts/roboto-medium.woff2` | Создать — шрифт Roboto 500 |
| `src/styles/_fonts.scss` | Создать — @font-face объявления |
| `src/styles/_tokens.scss` | Создать — CSS custom properties |
| `src/styles.scss` | Обновить — @use + глобальный сброс |
| `src/shared/ui-kit/form-field/form-field.component.html` | Обновить — добавить `--error` класс на wrapper |
| `src/shared/ui-kit/form-field/form-field.component.scss` | Обновить — токены + error стиль |
| `src/shared/ui-kit/input/components/input-field/input-field.component.scss` | Обновить — стили label и input |
| `src/layouts/public/public-layout.component.scss` | Обновить — центрирование |
| `src/features/feature-login/pages/login-page/login-page.component.ts` | Обновить — loginError сигнал |
| `src/features/feature-login/pages/login-page/login-page.component.html` | Переверстать — карточка с ui-kit-input-field |
| `src/features/feature-login/pages/login-page/login-page.component.scss` | Написать — стили карточки |
| `src/features/feature-login/pages/login-page/login-page.component.spec.ts` | Обновить — тест loginError |
| `public/icons.svg` | Обновить — добавить menu_open, schema, settings, account_circle, logout |
| `src/shared/ui-kit/icon/enums/icon-name.enum.ts` | Обновить — добавить новые имена |
| `src/layouts/internal/components/sidebar/sidebar.component.ts` | Создать |
| `src/layouts/internal/components/sidebar/sidebar.component.html` | Создать |
| `src/layouts/internal/components/sidebar/sidebar.component.scss` | Создать |
| `src/layouts/internal/components/sidebar/sidebar.component.spec.ts` | Создать |
| `src/layouts/internal/internal-layout.component.ts` | Обновить — импорт SidebarComponent |
| `src/layouts/internal/internal-layout.component.html` | Переверстать |
| `src/layouts/internal/internal-layout.component.scss` | Написать |

---

## Task 1: Загрузить шрифт Roboto локально

**Files:**
- Create: `public/fonts/roboto-regular.woff2`
- Create: `public/fonts/roboto-medium.woff2`

- [ ] **Step 1: Скачать woff2 файлы**

```bash
mkdir -p public/fonts
curl -L "https://fonts.gstatic.com/s/roboto/v32/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2" \
  -o public/fonts/roboto-regular.woff2
curl -L "https://fonts.gstatic.com/s/roboto/v32/KFOlCnqEu92Fr1MmEU9fBBc4AMP6lQ.woff2" \
  -o public/fonts/roboto-medium.woff2
```

- [ ] **Step 2: Проверить, что файлы скачались**

```bash
ls -lh public/fonts/
```

Ожидаемый вывод: два файла по ~15–25 KB каждый.

- [ ] **Step 3: Commit**

```bash
git add public/fonts/
git commit -m "feat(ds): add Roboto font files (400, 500)"
```

---

## Task 2: Создать CSS-токены (`_tokens.scss`)

**Files:**
- Create: `src/styles/_tokens.scss`

- [ ] **Step 1: Создать директорию и файл токенов**

```bash
mkdir -p src/styles
```

Создать `src/styles/_tokens.scss`:

```scss
:root {
  // Цвета
  --color-primary: #005baa;
  --color-white: #ffffff;
  --color-stroke: #dee2e6;
  --color-window: #f9fafc;
  --color-selected: #edf4fb;
  --color-error: #dc3545;

  // Текст
  --text-primary: #263238;
  --text-secondary: #677379;

  // Типографика
  --font-family: 'Roboto', sans-serif;
  --font-size-sm: 14px;
  --font-size-md: 18px;
  --font-size-lg: 24px;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --line-height-base: 20px;

  // Радиусы
  --radius-sm: 8px;
  --radius-md: 10px;
  --radius-lg: 15px;

  // Отступы
  --gap-xs: 4px;
  --gap-sm: 8px;
  --gap-md: 15px;
  --gap-lg: 16px;
  --padding-input-x: 16px;
  --padding-input-y: 8px;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/_tokens.scss
git commit -m "feat(ds): add CSS design tokens"
```

---

## Task 3: Создать @font-face и обновить styles.scss

**Files:**
- Create: `src/styles/_fonts.scss`
- Modify: `src/styles.scss`

- [ ] **Step 1: Создать `src/styles/_fonts.scss`**

```scss
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/roboto-regular.woff2') format('woff2');
}

@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('/fonts/roboto-medium.woff2') format('woff2');
}
```

- [ ] **Step 2: Обновить `src/styles.scss`**

```scss
@use 'styles/fonts';
@use 'styles/tokens';

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  color: var(--text-primary);
  background: var(--color-white);
}
```

- [ ] **Step 3: Запустить dev-сервер, убедиться что компилируется без ошибок**

```bash
npm start
```

Ожидаемо: сервер стартует, в браузере текст рендерится шрифтом Roboto.

- [ ] **Step 4: Commit**

```bash
git add src/styles/_fonts.scss src/styles.scss
git commit -m "feat(ds): add Roboto @font-face and global styles reset"
```

---

## Task 4: Обновить `form-field.component` — токены и error-стиль

**Files:**
- Modify: `src/shared/ui-kit/form-field/form-field.component.html`
- Modify: `src/shared/ui-kit/form-field/form-field.component.scss`

- [ ] **Step 1: Добавить `--error` модификатор в шаблон**

Файл `src/shared/ui-kit/form-field/form-field.component.html` — заменить строку с классами wrapper:

Было:
```html
<div
  class="ui-kit-form-field__wrapper"
  [class.ui-kit-form-field__wrapper--disabled]="isDisabled()"
  (click)="onWrapperClick($event)"
>
```

Стало:
```html
<div
  class="ui-kit-form-field__wrapper"
  [class.ui-kit-form-field__wrapper--disabled]="isDisabled()"
  [class.ui-kit-form-field__wrapper--error]="hasError()"
  (click)="onWrapperClick($event)"
>
```

- [ ] **Step 2: Обновить `form-field.component.scss`**

```scss
:host {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.ui-kit-form-field__wrapper {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  height: 40px;
  padding: var(--padding-input-y) var(--padding-input-x);
  border: 1px solid var(--color-stroke);
  border-radius: var(--radius-sm);
  background: var(--color-white);
  cursor: text;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(0, 91, 170, 0.1);
  }

  &--disabled {
    background: var(--color-window);
    cursor: not-allowed;
    opacity: 0.6;
    pointer-events: none;
  }

  &--error {
    border-color: var(--color-error);

    &:focus-within {
      border-color: var(--color-error);
      box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
    }
  }
}

.ui-kit-form-field__prefix,
.ui-kit-form-field__suffix {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.ui-kit-form-field__hint {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);

  &--error {
    color: var(--color-error);
  }
}
```

- [ ] **Step 3: Запустить тесты form-field**

```bash
npx ng test --include="src/shared/ui-kit/form-field/**/*.spec.ts"
```

Ожидаемо: все существующие тесты проходят.

- [ ] **Step 4: Commit**

```bash
git add src/shared/ui-kit/form-field/form-field.component.html \
        src/shared/ui-kit/form-field/form-field.component.scss
git commit -m "feat(ds): update form-field to use DS tokens, add error state"
```

---

## Task 5: Обновить `input-field.component.scss` — стили label и input

**Files:**
- Modify: `src/shared/ui-kit/input/components/input-field/input-field.component.scss`

- [ ] **Step 1: Заменить содержимое файла**

```scss
:host {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

label[uiKitLabel] {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-base);
  color: var(--text-secondary);
}

.ui-kit-input {
  flex: 1;
  border: none;
  outline: none;
  width: 100%;
  min-width: 0;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  color: var(--text-primary);
  background: transparent;

  &::placeholder {
    color: var(--color-stroke);
  }
}
```

- [ ] **Step 2: Запустить тесты**

```bash
npx ng test --include="src/shared/ui-kit/input/**/*.spec.ts"
```

Ожидаемо: тесты проходят.

- [ ] **Step 3: Commit**

```bash
git add src/shared/ui-kit/input/components/input-field/input-field.component.scss
git commit -m "feat(ds): update input-field with DS tokens for label and input"
```

---

## Task 6: Переверстать `public-layout` и форму логина

**Files:**
- Modify: `src/layouts/public/public-layout.component.scss`
- Modify: `src/features/feature-login/pages/login-page/login-page.component.ts`
- Modify: `src/features/feature-login/pages/login-page/login-page.component.html`
- Modify: `src/features/feature-login/pages/login-page/login-page.component.scss`
- Modify: `src/features/feature-login/pages/login-page/login-page.component.spec.ts`

- [ ] **Step 1: Написать тест для loginError сигнала** (TDD — сначала тест)

Файл `src/features/feature-login/pages/login-page/login-page.component.spec.ts`:

```typescript
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { LoginPageComponent } from './login-page.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_CONFIG } from '@shared/api/config';
import { AUTH_CONFIG } from 'src/shared/auth';

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_CONFIG, useValue: { baseUrl: '' } },
        { provide: AUTH_CONFIG, useValue: { loginUrl: '/front/logon', refreshUrl: '/front/logon/refresh-token' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have loginError null initially', () => {
    expect(component.loginError()).toBeNull();
  });

  it('should set loginError on server error', () => {
    component.setLoginError('Invalid credentials');
    expect(component.loginError()).toBe('Invalid credentials');
  });
});
```

- [ ] **Step 2: Запустить тесты — убедиться что они падают**

```bash
npx ng test --include="src/features/feature-login/pages/login-page/login-page.component.spec.ts"
```

Ожидаемо: FAIL — `loginError` и `setLoginError` не существуют.

- [ ] **Step 3: Обновить `login-page.component.ts`**

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/shared/auth';
import { InputFieldComponent } from '@shared/ui-kit/input/components/input-field';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, InputFieldComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  public readonly form = this.fb.nonNullable.group({
    email: ['test', [Validators.required]],
    password: ['77777', [Validators.required, Validators.minLength(5)]],
  });

  public readonly loginError = signal<string | null>(null);

  public setLoginError(message: string): void {
    this.loginError.set(message);
  }

  public onSubmit(): void {
    this.loginError.set(null);

    if (this.form.valid) {
      const { email, password } = this.form.getRawValue();

      this.authService.login(email, password).subscribe({
        next: () => {
          void this.router.navigate(['/']);
        },
        error: () => {
          this.loginError.set('Invalid credentials. Please try again.');
        },
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}

// Примечание: InputFieldComponent импортируется из '@shared/ui-kit/input/components/input-field'
```

- [ ] **Step 4: Запустить тесты — убедиться что проходят**

```bash
npx ng test --include="src/features/feature-login/pages/login-page/login-page.component.spec.ts"
```

Ожидаемо: все 3 теста PASS.

- [ ] **Step 5: Обновить `login-page.component.html`**

```html
<div class="login-card">
  <h1 class="login-card__title">Logon to Zidium</h1>

  <form class="login-card__fields" [formGroup]="form" (ngSubmit)="onSubmit()">
    <ui-kit-input-field
      formControlName="email"
      label="Login"
      type="text"
    />

    <ui-kit-input-field
      formControlName="password"
      label="Password"
      type="password"
    />

    @if (loginError(); as error) {
      <p class="login-card__error">{{ error }}</p>
    }

    <div class="login-card__action">
      <button class="login-btn" type="submit">Logon</button>
    </div>
  </form>
</div>
```

- [ ] **Step 6: Написать `login-page.component.scss`**

```scss
:host {
  display: contents;
}

.login-card {
  display: flex;
  flex-direction: column;
  gap: 25px;
  width: 439px;
  padding: 25px 20px 20px;
  border: 1px solid var(--color-stroke);
  border-radius: var(--radius-lg);
  background: var(--color-white);
}

.login-card__title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  line-height: 21px;
  color: var(--text-primary);
  text-align: center;
}

.login-card__fields {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
}

.login-card__error {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-error);
}

.login-card__action {
  display: flex;
  justify-content: center;
}

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

- [ ] **Step 7: Обновить `public-layout.component.scss`**

```scss
:host {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-white);
}
```

- [ ] **Step 8: Открыть браузер http://localhost:4200/login, проверить визуально**

Ожидаемо: по центру экрана белая карточка с бордером, заголовок "Logon to Zidium", два поля Login/Password, кнопка Logon.

- [ ] **Step 9: Commit**

```bash
git add src/layouts/public/public-layout.component.scss \
        src/features/feature-login/pages/login-page/
git commit -m "feat(login): restyle login page with DS tokens"
```

---

## Task 7: Добавить иконки в SVG-спрайт и обновить EEIconName

**Files:**
- Modify: `public/icons.svg`
- Modify: `src/shared/ui-kit/icon/enums/icon-name.enum.ts`

- [ ] **Step 1: Добавить иконки в `public/icons.svg`**

Добавить внутрь `<svg>` перед закрывающим тегом следующие символы (Material Icons 20×20):

```xml
  <symbol id="icon-menu-open" viewBox="0 0 24 24">
    <path d="M3 18h13v-2H3v2zm0-5h10v-2H3v2zm0-7v2h13V6H3zm18 9.59L17.42 12 21 8.41 19.59 7l-5 5 5 5L21 15.59z" fill="currentColor"/>
  </symbol>

  <symbol id="icon-schema" viewBox="0 0 24 24">
    <path d="M14 9v2h-3V9H9v2H6V9H4v6h2v-2h3v2h2v-2h3v2h2V9h-2zM4 3H2v4h2V5h16v2h2V3h-2V1h-2v2H6V1H4v2zm16 18H4v-2H2v4h20v-4h-2v2z" fill="currentColor"/>
  </symbol>

  <symbol id="icon-settings" viewBox="0 0 24 24">
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor"/>
  </symbol>

  <symbol id="icon-account-circle" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor"/>
  </symbol>

  <symbol id="icon-logout" viewBox="0 0 24 24">
    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
  </symbol>
```

- [ ] **Step 2: Обновить `src/shared/ui-kit/icon/enums/icon-name.enum.ts`**

```typescript
export enum EEIconName {
  Edit = 'edit',
  Mail = 'mail',
  Location = 'location',
  Calendar = 'calendar',
  ChevronDown = 'chevron-down',
  Close = 'close',
  Search = 'search',
  MenuOpen = 'menu-open',
  Schema = 'schema',
  Settings = 'settings',
  AccountCircle = 'account-circle',
  Logout = 'logout',
}
```

- [ ] **Step 3: Commit**

```bash
git add public/icons.svg src/shared/ui-kit/icon/enums/icon-name.enum.ts
git commit -m "feat(ds): add sidebar icons to SVG sprite and EEIconName"
```

---

## Task 8: Создать SidebarComponent

**Files:**
- Create: `src/layouts/internal/components/sidebar/sidebar.component.spec.ts`
- Create: `src/layouts/internal/components/sidebar/sidebar.component.ts`
- Create: `src/layouts/internal/components/sidebar/sidebar.component.html`
- Create: `src/layouts/internal/components/sidebar/sidebar.component.scss`

- [ ] **Step 1: Написать тест (TDD — сначала тест)**

Создать `src/layouts/internal/components/sidebar/sidebar.component.spec.ts`:

```typescript
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render nav items', () => {
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.sidebar__item');
    expect(items.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться что падает**

```bash
npx ng test --include="src/layouts/internal/components/sidebar/sidebar.component.spec.ts"
```

Ожидаемо: FAIL — `SidebarComponent` не существует.

- [ ] **Step 3: Создать `sidebar.component.ts`**

`icon/index.ts` экспортирует `EEIconName` под алиасом `EIconName` — использовать именно этот импорт.

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent, EIconName } from '@shared/ui-kit/icon';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  protected readonly EIconName = EIconName;
}
```

- [ ] **Step 4: Создать `sidebar.component.html`**

```html
<nav class="sidebar__nav">
  <div class="sidebar__top">
    <button class="sidebar__item sidebar__toggle" type="button" aria-label="Toggle menu">
      <ds-icon [name]="EIconName.MenuOpen" [size]="20" />
    </button>
  </div>

  <div class="sidebar__links">
    <a
      class="sidebar__item"
      routerLink="/categories"
      routerLinkActive="sidebar__item--active"
      aria-label="Categories"
    >
      <ds-icon [name]="EIconName.Settings" [size]="20" />
    </a>
  </div>

  <div class="sidebar__bottom">
    <button class="sidebar__item" type="button" aria-label="Account">
      <ds-icon [name]="EIconName.AccountCircle" [size]="20" />
    </button>

    <button class="sidebar__item" type="button" aria-label="Logout">
      <ds-icon [name]="EIconName.Logout" [size]="20" />
    </button>
  </div>
</nav>
```

- [ ] **Step 5: Создать `sidebar.component.scss`**

```scss
:host {
  display: flex;
  flex-direction: column;
  width: 78px;
  height: 100vh;
  background: var(--color-window);
  padding: 20px 9px;
  flex-shrink: 0;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--gap-lg);
}

.sidebar__top {
  display: flex;
  justify-content: center;
}

.sidebar__links {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}

.sidebar__bottom {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.sidebar__item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 9px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s;

  &:hover {
    background: var(--color-selected);
  }

  &--active {
    background: var(--color-selected);
  }
}

.sidebar__toggle {
  color: var(--text-secondary);
}
```

- [ ] **Step 6: Запустить тесты — убедиться что проходят**

```bash
npx ng test --include="src/layouts/internal/components/sidebar/sidebar.component.spec.ts"
```

Ожидаемо: 2 теста PASS.

- [ ] **Step 7: Commit**

```bash
git add src/layouts/internal/components/sidebar/
git commit -m "feat(internal-layout): create SidebarComponent"
```

---

## Task 9: Переверстать InternalLayoutComponent

**Files:**
- Modify: `src/layouts/internal/internal-layout.component.ts`
- Modify: `src/layouts/internal/internal-layout.component.html`
- Modify: `src/layouts/internal/internal-layout.component.scss`

- [ ] **Step 1: Обновить `internal-layout.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-internal-layout',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './internal-layout.component.html',
  styleUrl: './internal-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InternalLayoutComponent {}
```

- [ ] **Step 2: Обновить `internal-layout.component.html`**

```html
<app-sidebar />
<main class="internal-layout__content">
  <router-outlet />
</main>
```

- [ ] **Step 3: Написать `internal-layout.component.scss`**

```scss
:host {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--color-white);
}

.internal-layout__content {
  flex: 1;
  padding: 25px;
  overflow-y: auto;
  min-width: 0;
}
```

- [ ] **Step 4: Запустить тесты internal-layout**

```bash
npx ng test --include="src/layouts/internal/internal-layout.component.spec.ts"
```

Ожидаемо: тест `should create` PASS (нужно добавить `provideRouter([])` в beforeEach если тест упадёт с ошибкой роутера).

Если тест упадёт с ошибкой `NullInjectorError: No provider for ActivatedRoute`, обновить `internal-layout.component.spec.ts`:

```typescript
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { InternalLayoutComponent } from './internal-layout.component';

describe('InternalLayoutComponent', () => {
  let component: InternalLayoutComponent;
  let fixture: ComponentFixture<InternalLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InternalLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(InternalLayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

- [ ] **Step 5: Открыть браузер http://localhost:4200, убедиться что виден сайдбар и контент**

Ожидаемо: слева сайдбар 78px с иконками на `#f9fafc` фоне, справа контент страницы categories.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/internal/internal-layout.component.ts \
        src/layouts/internal/internal-layout.component.html \
        src/layouts/internal/internal-layout.component.scss \
        src/layouts/internal/internal-layout.component.spec.ts
git commit -m "feat(internal-layout): implement sidebar + content layout"
```

---

## Task 10: Финальная проверка и запуск всех тестов

- [ ] **Step 1: Запустить все тесты**

```bash
npm test
```

Ожидаемо: все тесты PASS.

- [ ] **Step 2: Запустить линтер**

```bash
npm run lint
```

Ожидаемо: нет ошибок.

- [ ] **Step 3: Проверить логин в браузере**

1. Открыть http://localhost:4200/login
2. Убедиться: карточка по центру, шрифт Roboto, поля с label, кнопка "Logon"
3. Нажать Logon без заполнения — поля должны показать ошибку через `ui-kit-form-field`
4. Ввести неверные данные — должен появиться текст ошибки под полями

- [ ] **Step 4: Проверить internal layout в браузере**

1. Войти с `test / 77777`
2. Убедиться: сайдбар слева (78px, `#f9fafc`), иконки, активная иконка settings подсвечена `#edf4fb`
3. Контент справа с паддингом 25px
