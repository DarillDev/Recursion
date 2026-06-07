# ControlErrorTextPipe

Пайп для отображения текста ошибки валидации формы. Принимает `ValidationErrors` и возвращает строку по первому ключу ошибки, используя карту сообщений из DI.

## Импорт

```ts
import { ControlErrorTextPipe, provideControlErrors } from '@ui-pipes/control-error-text';
```

## Базовое использование

```html
<input [formControl]="control" />
<span *ngIf="control.errors">{{ control.errors | controlErrorText }}</span>
```

Или с `@if`:

```html
@if (control.errors; as errors) {
  <span>{{ errors | controlErrorText }}</span>
}
```

Пайп возвращает пустую строку если `errors` равен `null` или `undefined`.

## Встроенные ошибки

| Ключ        | Сообщение                              |
|-------------|----------------------------------------|
| `required`  | Поле обязательно для заполнения        |
| `email`     | Некорректный email                     |
| `minlength` | Минимум `{requiredLength}` символов    |
| `maxlength` | Максимум `{requiredLength}` символов   |
| `min`       | Минимальное значение: `{min}`          |
| `max`       | Максимальное значение: `{max}`         |

Если ключ не найден в карте — возвращается `Unknown error: {key}`.

## Расширение карты ошибок

### Глобально — в `app.config.ts`

```ts
import { provideControlErrors } from '@ui-pipes/control-error-text';

export const appConfig: ApplicationConfig = {
  providers: [
    provideControlErrors(new Map([
      ['pattern', 'Недопустимый формат'],
      ['serverError', 'Ошибка сервера'],
    ])),
  ],
};
```

### Локально — в отдельном компоненте

Провайдер, объявленный в компоненте, действует только для его дерева инжекторов:

```ts
@Component({
  providers: [
    provideControlErrors(new Map([
      ['required', 'Это поле нельзя оставлять пустым'],
    ])),
  ],
})
export class MyFormComponent {}
```

### Переопределение

Новый ключ **перезаписывает** родительское сообщение. Остальные ошибки наследуются — каждый уровень получает карту родителя через `skipSelf` и добавляет свои записи поверх.

```
app.config.ts         → required: 'Поле обязательно' (DEFAULT)
  └─ PageComponent    → provideControlErrors({ required: 'Заполните поле' })  ← переопределяет
       └─ FormField   → required: 'Заполните поле'  ← видит переопределённое
```

### Динамические сообщения

Значение в карте может быть функцией `(errors: ValidationErrors) => string` для доступа к параметрам ошибки:

```ts
provideControlErrors(new Map([
  ['minlength', (e) => `Нужно ещё ${e['minlength'].requiredLength - e['minlength'].actualLength} символов`],
]))
```

## API

### `ControlErrorTextPipe`

| Аргумент  | Тип                              | Описание                        |
|-----------|----------------------------------|---------------------------------|
| `errors`  | `ValidationErrors \| null \| undefined` | Объект ошибок из `AbstractControl.errors` |

### `provideControlErrors(map)`

| Параметр | Тип             | Описание                         |
|----------|-----------------|----------------------------------|
| `map`    | `TErrorsTextMap` | Карта новых или переопределённых сообщений |

Возвращает `FactoryProvider` для передачи в `providers`.

### `TErrorsTextMap`

```ts
type TErrorsTextMap = Map<string, string | ((errors: ValidationErrors) => string)>;
```
