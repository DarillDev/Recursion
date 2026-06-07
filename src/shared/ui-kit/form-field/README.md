# ui-kit-form-field

Обёртка поля формы. Объединяет контрол (input / select) с лейблом, префиксом, суффиксом, подсказкой и ошибкой.

## Использование

```html
<ui-kit-form-field>
  <ui-kit-label>Email</ui-kit-label>

  <span uiKitPrefix>@</span>

  <input uiKitInput [formControl]="emailCtrl" />

  <span uiKitSuffix>✓</span>

  <ui-kit-hint>Введите рабочий адрес</ui-kit-hint>
  <ui-kit-error>{{ emailCtrl | controlErrorText }}</ui-kit-error>
</ui-kit-form-field>
```

## Слоты (content projection)

| Селектор                          | Директива        | Описание                                      |
|-----------------------------------|------------------|-----------------------------------------------|
| `ui-kit-label`, `[uiKitLabel]`    | `LabelDirective` | Лейбл поля                                    |
| `[uiKitPrefix]`, `ui-kit-prefix`  | `PrefixDirective`| Контент слева от контрола                     |
| `[uiKitSuffix]`, `ui-kit-suffix`  | `SuffixDirective`| Контент справа от контрола                    |
| `ui-kit-hint`, `[uiKitHint]`      | `HintDirective`  | Подсказка под полем (скрывается при ошибке)   |
| `ui-kit-error`, `[uiKitError]`    | `ErrorDirective` | Текст ошибки (имеет приоритет над hint)       |
| *(default)*                       | —                | Сам контрол: `input[uiKitInput]` или `ui-kit-select` |

## Как работает

- Ищет контрол через токен `FORM_FIELD_CONTROL` (`contentChild`).
- Передаёт контролу список `aria-describedby` (ids hint + error) через `effect`.
- При наличии `uiKitError` — hint скрывается, обёртка получает класс `--error`.
- Клик по обёртке делегируется в `control.onContainerClick()` (фокус на input / открытие select).

## Токены

| Токен               | Что предоставляет                                    |
|---------------------|------------------------------------------------------|
| `FORM_FIELD`        | Ссылка на сам `FormFieldComponent` (для дочерних директив) |
| `FORM_FIELD_CONTROL`| Контрол внутри field — реализует `IFormFieldControl` |
