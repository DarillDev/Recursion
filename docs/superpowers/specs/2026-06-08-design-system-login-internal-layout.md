# Дизайн-система: токены, форма логина, internal layout

**Дата:** 2026-06-08  
**Figma:** https://www.figma.com/design/KCYaDH4HaImmOB7ZASq784/Zidium?node-id=1508-21270  
**Подход:** DS токены → обновить ui-kit → переверстать страницы (Подход A)

---

## 1. Дизайн-система — токены и шрифты

### Шрифт Roboto

- Размещается локально в `src/assets/fonts/` (woff2 файлы)
- Веса: 400 (Regular), 500 (Medium)
- Подключается через `@font-face` в `src/styles/_fonts.scss`
- `_fonts.scss` импортируется первым в `src/styles.scss`

### CSS custom properties

Файл `src/styles/_tokens.scss`, определяет переменные в `:root`.

#### Цвета
| Токен | Значение | Использование |
|---|---|---|
| `--color-primary` | `#005baa` | Кнопки, акцент |
| `--color-white` | `#ffffff` | Фоны карточек, контент |
| `--color-stroke` | `#dee2e6` | Бордеры инпутов, карточек, таблиц |
| `--color-window` | `#f9fafc` | Фон сайдбара, заголовки таблиц |
| `--color-selected` | `#edf4fb` | Активный пункт меню |

#### Текст
| Токен | Значение |
|---|---|
| `--text-primary` | `#263238` |
| `--text-secondary` | `#677379` |

#### Типографика
| Токен | Значение |
|---|---|
| `--font-family` | `'Roboto', sans-serif` |
| `--font-size-sm` | `14px` |
| `--font-size-md` | `18px` |
| `--font-size-lg` | `24px` |
| `--font-weight-regular` | `400` |
| `--font-weight-medium` | `500` |
| `--line-height-base` | `20px` |

#### Отступы и радиусы
| Токен | Значение |
|---|---|
| `--radius-sm` | `8px` |
| `--radius-md` | `10px` |
| `--radius-lg` | `15px` |
| `--gap-xs` | `4px` |
| `--gap-sm` | `8px` |
| `--gap-md` | `15px` |
| `--gap-lg` | `16px` |
| `--padding-input-x` | `16px` |
| `--padding-input-y` | `8px` |

### Глобальные стили (`src/styles.scss`)

```scss
@use 'styles/fonts';
@use 'styles/tokens';

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background: var(--color-white);
}
```

---

## 2. Обновление ui-kit компонентов

### `ui-kit-form-field` (form-field.component.scss)

Обновить существующие стили на CSS-переменные из токенов:

- Wrapper: `border: 1px solid var(--color-stroke)`, `border-radius: var(--radius-sm)`, `height: 40px`, `padding: var(--padding-input-y) var(--padding-input-x)`
- Focus-within: `border-color: var(--color-primary)`, `box-shadow: 0 0 0 3px rgba(0, 91, 170, 0.1)`
- Disabled: `background: var(--color-window)`, `opacity: 0.6`
- Hint: `font-size: var(--font-size-sm)`, `color: var(--text-secondary)`
- Error: `color: #dc3545` + `border-color: #dc3545` на wrapper при ошибке

### `ui-kit-input-field` — label

`LabelDirective` нужно добавить стиль: `font-size: 14px`, `color: var(--text-secondary)`, `margin-bottom: 4px`.

Сам `input` (через `InputDirective`): `border: none`, `outline: none`, `width: 100%`, `font-size: var(--font-size-sm)`, `color: var(--text-primary)`, `background: transparent`.

---

## 3. Форма логина (`feature-login`)

### PublicLayout

`public-layout.component.scss`:
```scss
:host {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-white);
}
```

### LoginPageComponent

Шаблон: использует `<ui-kit-input-field>` для полей Login и Password.

Разметка карточки:
```
.login-card
  padding: 25px 20px 20px
  border: 1px solid var(--color-stroke)
  border-radius: var(--radius-lg)
  width: 439px
  display: flex; flex-direction: column; gap: 25px

.login-card__title
  Roboto Medium 24px, color: var(--text-primary), text-align: center

.login-card__fields
  display: flex; flex-direction: column; gap: var(--gap-md)

.login-card__action
  display: flex; justify-content: center
```

Кнопка "Logon":
```
background: var(--color-primary)
color: var(--color-white)
font: Medium 14px Roboto
padding: 10px 20px
border-radius: var(--radius-sm)
border: none; cursor: pointer
```

Состояния ошибок:
- "Не заполнено" → поля невалидны при submit → `hasError()` в `ui-kit-form-field` показывает `ui-kit-error`
- "Ошибка входа" → сигнал `loginError` в компоненте → показывается текстовый блок под полями (`color: #dc3545`, 14px)

**Изменения в `LoginPageComponent`:**
- Добавить `signal<string | null>('') loginError` 
- В `onSubmit()` при ошибке сервера → `loginError.set('Invalid credentials')`
- Шаблон: `<ui-kit-input-field>` с labels "Login" и "Password", error directives, кнопка Logon

---

## 4. Internal Layout

### Структура файлов

```
src/layouts/internal/
  internal-layout.component.ts   ← добавить SidebarComponent
  internal-layout.component.html ← aside + main
  internal-layout.component.scss
  components/
    sidebar/
      sidebar.component.ts
      sidebar.component.html
      sidebar.component.scss
```

### InternalLayoutComponent

HTML:
```html
<app-sidebar />
<main class="internal-layout__content">
  <router-outlet />
</main>
```

Стили `:host`:
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
}
```

### SidebarComponent

Размеры: `width: 78px`, `height: 100vh`, `background: var(--color-window)`, `padding: 20px`.

Структура:
```
[toggle кнопка — иконка menu_open]
[nav: schema icon, settings icon (active)]
[spacer flex-1]
[bottom: account_circle icon, logout icon]
```

Иконки через `<ui-kit-icon>` с SVG-спрайтом `public/icons.svg`.

Иконка (menu item):
```scss
.sidebar__item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 9px;
  border-radius: var(--radius-sm);
  cursor: pointer;

  &--active {
    background: var(--color-selected);
  }
}
```

Активный пункт (settings) определяется через `RouterLinkActive` или сигналом.

SVG иконки для `public/icons.svg`: `menu_open`, `schema`, `settings`, `account_circle`, `logout` — Material Icons 20px.

---

## Файлы для изменения / создания

| Файл | Действие |
|---|---|
| `src/assets/fonts/` | Создать — woff2 файлы Roboto 400/500 |
| `src/styles/_fonts.scss` | Создать — @font-face |
| `src/styles/_tokens.scss` | Создать — CSS custom properties |
| `src/styles.scss` | Обновить — @use, глобальные сбросы |
| `src/shared/ui-kit/form-field/form-field.component.scss` | Обновить — токены |
| `src/shared/ui-kit/input/components/input-field/input-field.component.scss` | Обновить — токены |
| `src/layouts/public/public-layout.component.scss` | Обновить — centering |
| `src/features/feature-login/pages/login-page/login-page.component.html` | Переверстать |
| `src/features/feature-login/pages/login-page/login-page.component.ts` | Добавить loginError signal |
| `src/features/feature-login/pages/login-page/login-page.component.scss` | Написать |
| `src/layouts/internal/internal-layout.component.html` | Переверстать |
| `src/layouts/internal/internal-layout.component.scss` | Написать |
| `src/layouts/internal/components/sidebar/sidebar.component.ts` | Создать |
| `src/layouts/internal/components/sidebar/sidebar.component.html` | Создать |
| `src/layouts/internal/components/sidebar/sidebar.component.scss` | Создать |
| `public/icons.svg` | Обновить — добавить иконки |
