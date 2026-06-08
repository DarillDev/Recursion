# Categories Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать страницу `/categories` со списком (infinite scroll, поиск, сортировка) и CRUD-операциями через диалоги.

**Architecture:** `CategoryListPageComponent` держит весь UI-state как сигналы, вызывает `CategoriesService` напрямую. Добавление/редактирование открываются через `CategoryFormDialogComponent` (получает `ICategory | undefined`), удаление — через универсальный `ConfirmationService`. Роут `/categories/{id}` не создаётся.

**Tech Stack:** Angular 21, CDK Dialog, ReactiveFormsModule, RxJS (debounceTime, switchMap, timer), Vitest.

---

## File Map

**Create:**
- `src/shared/ui-kit/confirmation/interfaces/confirmation-dialog-data.interface.ts`
- `src/shared/ui-kit/confirmation/confirmation-dialog/confirmation-dialog.component.ts`
- `src/shared/ui-kit/confirmation/confirmation-dialog/confirmation-dialog.component.html`
- `src/shared/ui-kit/confirmation/confirmation-dialog/confirmation-dialog.component.scss`
- `src/shared/ui-kit/confirmation/confirmation-dialog/confirmation-dialog.component.spec.ts`
- `src/shared/ui-kit/confirmation/confirmation.service.ts`
- `src/shared/ui-kit/confirmation/confirmation.service.spec.ts`
- `src/shared/ui-kit/confirmation/index.ts`
- `src/features/feature-categories/models/interfaces/category-form.interface.ts`
- `src/features/feature-categories/components/category-form-dialog/name-exists.validator.ts`
- `src/features/feature-categories/components/category-form-dialog/name-exists.validator.spec.ts`
- `src/features/feature-categories/components/category-form-dialog/category-form-dialog.component.ts`
- `src/features/feature-categories/components/category-form-dialog/category-form-dialog.component.html`
- `src/features/feature-categories/components/category-form-dialog/category-form-dialog.component.scss`
- `src/features/feature-categories/components/category-form-dialog/category-form-dialog.component.spec.ts`

**Modify:**
- `src/shared/api/controllers/categories/interfaces/categories-search-params.interface.ts`
- `src/features/feature-categories/pages/category-list-page/category-list-page.component.ts`
- `src/features/feature-categories/pages/category-list-page/category-list-page.component.html`
- `src/features/feature-categories/pages/category-list-page/category-list-page.component.scss`
- `src/features/feature-categories/pages/category-list-page/category-list-page.component.spec.ts`
- `src/features/feature-categories/index.ts`

---

## Task 1: Add pageSize to ICategoriesSearchParams

**Files:**
- Modify: `src/shared/api/controllers/categories/interfaces/categories-search-params.interface.ts`

- [ ] **Step 1: Update the interface**

```ts
// src/shared/api/controllers/categories/interfaces/categories-search-params.interface.ts
export interface ICategoriesSearchParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  sortDesc?: boolean;
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build -- --no-progress 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/shared/api/controllers/categories/interfaces/categories-search-params.interface.ts
git commit -m "feat(api): add pageSize to ICategoriesSearchParams"
```

---

## Task 2: Create ICategoryForm и IConfirmationDialogData

**Files:**
- Create: `src/features/feature-categories/models/interfaces/category-form.interface.ts`
- Create: `src/shared/ui-kit/confirmation/interfaces/confirmation-dialog-data.interface.ts`

- [ ] **Step 1: Create ICategoryForm**

```ts
// src/features/feature-categories/models/interfaces/category-form.interface.ts
export interface ICategoryForm {
  name: string;
}
```

- [ ] **Step 2: Create IConfirmationDialogData**

```ts
// src/shared/ui-kit/confirmation/interfaces/confirmation-dialog-data.interface.ts
export interface IConfirmationDialogData {
  title: string;
  description: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/feature-categories/models/interfaces/category-form.interface.ts \
        src/shared/ui-kit/confirmation/interfaces/confirmation-dialog-data.interface.ts
git commit -m "feat(categories): add ICategoryForm and IConfirmationDialogData interfaces"
```

---

## Task 3: ConfirmationDialogComponent

**Files:**
- Create: `src/shared/ui-kit/confirmation/confirmation-dialog/confirmation-dialog.component.ts`
- Create: `src/shared/ui-kit/confirmation/confirmation-dialog/confirmation-dialog.component.html`
- Create: `src/shared/ui-kit/confirmation/confirmation-dialog/confirmation-dialog.component.scss`
- Create: `src/shared/ui-kit/confirmation/confirmation-dialog/confirmation-dialog.component.spec.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/shared/ui-kit/confirmation/confirmation-dialog/confirmation-dialog.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';

describe('ConfirmationDialogComponent', () => {
  const dialogRefSpy = { close: vi.fn() };

  function createComponent(title: string, description: string) {
    TestBed.configureTestingModule({
      imports: [ConfirmationDialogComponent],
      providers: [
        { provide: DialogRef, useValue: dialogRefSpy },
        { provide: DIALOG_DATA, useValue: { title, description } },
      ],
    });
    const fixture = TestBed.createComponent(ConfirmationDialogComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => dialogRefSpy.close.mockReset());

  it('closes with true when confirmed', () => {
    const fixture = createComponent('Delete?', 'Are you sure?');
    fixture.debugElement.query(By.css('[data-testid="confirm-btn"]')).nativeElement.click();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });

  it('closes with false when cancelled', () => {
    const fixture = createComponent('Delete?', 'Are you sure?');
    fixture.debugElement.query(By.css('[data-testid="cancel-btn"]')).nativeElement.click();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx ng test --include="src/shared/ui-kit/confirmation/confirmation-dialog/confirmation-dialog.component.spec.ts"
```

Expected: FAIL — `ConfirmationDialogComponent` not found.

- [ ] **Step 3: Implement component TS**

```ts
// src/shared/ui-kit/confirmation/confirmation-dialog/confirmation-dialog.component.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import type { IConfirmationDialogData } from '../interfaces/confirmation-dialog-data.interface';
import { ModalContainerComponent } from '@shared/ui-kit/modal';
import { ButtonComponent } from '@shared/ui-kit/button';

@Component({
  selector: 'ui-kit-confirmation-dialog',
  imports: [ModalContainerComponent, ButtonComponent],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent {
  protected readonly data = inject<IConfirmationDialogData>(DIALOG_DATA);
  private readonly dialogRef = inject<DialogRef<boolean>>(DialogRef);

  protected confirm(): void {
    this.dialogRef.close(true);
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
```

- [ ] **Step 4: Implement template**

```html
<!-- src/shared/ui-kit/confirmation/confirmation-dialog/confirmation-dialog.component.html -->
<ui-kit-modal-container [title]="data.title">
  <p class="confirmation-dialog__description">{{ data.description }}</p>

  <div footer class="confirmation-dialog__footer">
    <ui-kit-button variant="secondary" data-testid="cancel-btn" (click)="cancel()">
      Отмена
    </ui-kit-button>
    <ui-kit-button variant="danger" data-testid="confirm-btn" (click)="confirm()">
      Подтвердить
    </ui-kit-button>
  </div>
</ui-kit-modal-container>
```

- [ ] **Step 5: Add empty SCSS**

```scss
// src/shared/ui-kit/confirmation/confirmation-dialog/confirmation-dialog.component.scss
.confirmation-dialog {
  &__description {
    margin: 0;
  }

  &__footer {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
}
```

- [ ] **Step 6: Run tests to verify pass**

```bash
npx ng test --include="src/shared/ui-kit/confirmation/confirmation-dialog/confirmation-dialog.component.spec.ts"
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/shared/ui-kit/confirmation/confirmation-dialog/
git commit -m "feat(ui-kit): add ConfirmationDialogComponent"
```

---

## Task 4: ConfirmationService

**Files:**
- Create: `src/shared/ui-kit/confirmation/confirmation.service.ts`
- Create: `src/shared/ui-kit/confirmation/confirmation.service.spec.ts`
- Create: `src/shared/ui-kit/confirmation/index.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/shared/ui-kit/confirmation/confirmation.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConfirmationService } from './confirmation.service';
import { ModalService } from '@shared/ui-kit/modal';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';

describe('ConfirmationService', () => {
  let service: ConfirmationService;
  const modalSpy = { open: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ConfirmationService,
        { provide: ModalService, useValue: modalSpy },
      ],
    });
    service = TestBed.inject(ConfirmationService);
    modalSpy.open.mockReset();
  });

  it('opens ConfirmationDialogComponent with title and description', () => {
    modalSpy.open.mockReturnValue(of(true));
    service.confirm('Delete item', 'Cannot be undone').subscribe();
    expect(modalSpy.open).toHaveBeenCalledWith(
      ConfirmationDialogComponent,
      { title: 'Delete item', description: 'Cannot be undone' },
    );
  });

  it('returns true when user confirms', (done) => {
    modalSpy.open.mockReturnValue(of(true));
    service.confirm('t', 'd').subscribe((result) => {
      expect(result).toBe(true);
      done();
    });
  });

  it('returns false when user cancels (dialog returns undefined)', (done) => {
    modalSpy.open.mockReturnValue(of(undefined));
    service.confirm('t', 'd').subscribe((result) => {
      expect(result).toBe(false);
      done();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx ng test --include="src/shared/ui-kit/confirmation/confirmation.service.spec.ts"
```

Expected: FAIL — `ConfirmationService` not found.

- [ ] **Step 3: Implement ConfirmationService**

```ts
// src/shared/ui-kit/confirmation/confirmation.service.ts
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ModalService } from '@shared/ui-kit/modal';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import type { IConfirmationDialogData } from './interfaces/confirmation-dialog-data.interface';

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private readonly modalService = inject(ModalService);

  public confirm(title: string, description: string): Observable<boolean> {
    return this.modalService
      .open<boolean, IConfirmationDialogData>(ConfirmationDialogComponent, { title, description })
      .pipe(map((result) => result ?? false));
  }
}
```

- [ ] **Step 4: Create barrel index**

```ts
// src/shared/ui-kit/confirmation/index.ts
export { ConfirmationService } from './confirmation.service';
export { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
```

- [ ] **Step 5: Run tests to verify pass**

```bash
npx ng test --include="src/shared/ui-kit/confirmation/confirmation.service.spec.ts"
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/shared/ui-kit/confirmation/confirmation.service.ts \
        src/shared/ui-kit/confirmation/confirmation.service.spec.ts \
        src/shared/ui-kit/confirmation/index.ts
git commit -m "feat(ui-kit): add ConfirmationService"
```

---

## Task 5: nameExistsValidator

**Files:**
- Create: `src/features/feature-categories/components/category-form-dialog/name-exists.validator.ts`
- Create: `src/features/feature-categories/components/category-form-dialog/name-exists.validator.spec.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/features/feature-categories/components/category-form-dialog/name-exists.validator.spec.ts
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { of } from 'rxjs';
import { CategoriesService } from '@shared/api/categories';
import { nameExistsValidator } from './name-exists.validator';

describe('nameExistsValidator', () => {
  let service: jasmine.SpyObj<CategoriesService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: CategoriesService, useValue: { checkNameExists: vi.fn() } },
      ],
    });
    service = TestBed.inject(CategoriesService) as unknown as jasmine.SpyObj<CategoriesService>;
  });

  it('returns null when name does not exist', fakeAsync(() => {
    (service.checkNameExists as ReturnType<typeof vi.fn>).mockReturnValue(of(false));
    const validator = nameExistsValidator(service, null);
    const control = new FormControl('New Name');
    let result: unknown;
    validator(control)!.subscribe((r) => (result = r));
    tick(400);
    expect(result).toBeNull();
  }));

  it('returns nameExists error when name is taken', fakeAsync(() => {
    (service.checkNameExists as ReturnType<typeof vi.fn>).mockReturnValue(of(true));
    const validator = nameExistsValidator(service, null);
    const control = new FormControl('Existing');
    let result: unknown;
    validator(control)!.subscribe((r) => (result = r));
    tick(400);
    expect(result).toEqual({ nameExists: true });
  }));

  it('returns null immediately for empty control value', fakeAsync(() => {
    const validator = nameExistsValidator(service, null);
    const control = new FormControl('');
    let result: unknown;
    validator(control)!.subscribe((r) => (result = r));
    tick(0);
    expect(result).toBeNull();
    expect(service.checkNameExists).not.toHaveBeenCalled();
  }));
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx ng test --include="src/features/feature-categories/components/category-form-dialog/name-exists.validator.spec.ts"
```

Expected: FAIL.

- [ ] **Step 3: Implement validator**

```ts
// src/features/feature-categories/components/category-form-dialog/name-exists.validator.ts
import type { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import type { Observable } from 'rxjs';
import { of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import type { CategoriesService } from '@shared/api/categories';

export function nameExistsValidator(
  service: CategoriesService,
  currentId: string | null,
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value?.trim()) return of(null);
    return timer(400).pipe(
      switchMap(() =>
        service.checkNameExists({ name: control.value.trim(), id: currentId }),
      ),
      map((exists) => (exists ? { nameExists: true } : null)),
    );
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx ng test --include="src/features/feature-categories/components/category-form-dialog/name-exists.validator.spec.ts"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/feature-categories/components/category-form-dialog/name-exists.validator.ts \
        src/features/feature-categories/components/category-form-dialog/name-exists.validator.spec.ts
git commit -m "feat(categories): add nameExistsValidator async validator"
```

---

## Task 6: CategoryFormDialogComponent

**Files:**
- Create: `src/features/feature-categories/components/category-form-dialog/category-form-dialog.component.ts`
- Create: `src/features/feature-categories/components/category-form-dialog/category-form-dialog.component.html`
- Create: `src/features/feature-categories/components/category-form-dialog/category-form-dialog.component.scss`
- Create: `src/features/feature-categories/components/category-form-dialog/category-form-dialog.component.spec.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/features/feature-categories/components/category-form-dialog/category-form-dialog.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { of } from 'rxjs';
import { CategoriesService } from '@shared/api/categories';
import type { ICategory } from '@shared/api/categories';
import { CategoryFormDialogComponent } from './category-form-dialog.component';

const dialogRefSpy = { close: vi.fn() };
const categoriesServiceStub = { checkNameExists: vi.fn().mockReturnValue(of(false)) };

function createComponent(data: ICategory | null) {
  TestBed.configureTestingModule({
    imports: [CategoryFormDialogComponent],
    providers: [
      { provide: DialogRef, useValue: dialogRefSpy },
      { provide: DIALOG_DATA, useValue: data },
      { provide: CategoriesService, useValue: categoriesServiceStub },
    ],
  });
  const fixture = TestBed.createComponent(CategoryFormDialogComponent);
  fixture.detectChanges();
  return fixture;
}

describe('CategoryFormDialogComponent', () => {
  beforeEach(() => {
    dialogRefSpy.close.mockReset();
    categoriesServiceStub.checkNameExists.mockReturnValue(of(false));
  });

  describe('create mode (no data)', () => {
    it('shows "Добавить категорию" title', () => {
      const fixture = createComponent(null);
      const title = fixture.debugElement.query(By.css('ui-kit-modal-container'));
      expect(title.componentInstance.title()).toBe('Добавить категорию');
    });

    it('does not show Id field', () => {
      const fixture = createComponent(null);
      expect(fixture.debugElement.query(By.css('[data-testid="category-id"]'))).toBeNull();
    });
  });

  describe('edit mode (with data)', () => {
    const category: ICategory = { id: '42', name: 'Electronics', canEdit: true };

    it('shows "Редактировать категорию" title', () => {
      const fixture = createComponent(category);
      const container = fixture.debugElement.query(By.css('ui-kit-modal-container'));
      expect(container.componentInstance.title()).toBe('Редактировать категорию');
    });

    it('shows Id field', () => {
      const fixture = createComponent(category);
      expect(fixture.debugElement.query(By.css('[data-testid="category-id"]'))).not.toBeNull();
    });

    it('pre-fills name input', () => {
      const fixture = createComponent(category);
      expect(fixture.componentInstance['form'].value.name).toBe('Electronics');
    });

    it('hides Save button when canEdit is false', () => {
      const fixture = createComponent({ ...category, canEdit: false });
      expect(fixture.debugElement.query(By.css('[data-testid="save-btn"]'))).toBeNull();
    });

    it('disables name field when canEdit is false', () => {
      const fixture = createComponent({ ...category, canEdit: false });
      expect(fixture.componentInstance['form'].controls.name.disabled).toBe(true);
    });
  });

  it('closes with form value on valid submit', () => {
    const fixture = createComponent(null);
    fixture.componentInstance['form'].controls.name.setValue('New Cat');
    fixture.debugElement.query(By.css('[data-testid="save-btn"]')).nativeElement.click();
    fixture.detectChanges();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ name: 'New Cat' });
  });

  it('closes with undefined on cancel', () => {
    const fixture = createComponent(null);
    fixture.debugElement.query(By.css('[data-testid="cancel-btn"]')).nativeElement.click();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(undefined);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx ng test --include="src/features/feature-categories/components/category-form-dialog/category-form-dialog.component.spec.ts"
```

Expected: FAIL.

- [ ] **Step 3: Implement component TS**

```ts
// src/features/feature-categories/components/category-form-dialog/category-form-dialog.component.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import type { ICategory } from '@shared/api/categories';
import { CategoriesService } from '@shared/api/categories';
import type { ICategoryForm } from '../../models/interfaces/category-form.interface';
import { ModalContainerComponent } from '@shared/ui-kit/modal';
import { ButtonComponent } from '@shared/ui-kit/button';
import { InputFieldComponent } from '@shared/ui-kit/input/components/input-field';
import { provideControlErrors } from '@shared/ui-kit/control-error-text';
import { nameExistsValidator } from './name-exists.validator';

@Component({
  selector: 'app-category-form-dialog',
  imports: [ReactiveFormsModule, ModalContainerComponent, ButtonComponent, InputFieldComponent],
  templateUrl: './category-form-dialog.component.html',
  styleUrl: './category-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideControlErrors({ nameExists: 'Это название уже занято' }),
  ],
})
export class CategoryFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject<DialogRef<ICategoryForm>>(DialogRef);
  private readonly categoriesService = inject(CategoriesService);

  protected readonly data = inject<ICategory | null>(DIALOG_DATA, { optional: true });
  protected readonly isEditMode = this.data !== null && this.data !== undefined;

  protected readonly title = this.isEditMode ? 'Редактировать категорию' : 'Добавить категорию';

  protected readonly form = this.fb.nonNullable.group({
    name: [
      this.data?.name ?? '',
      [Validators.required],
      [nameExistsValidator(this.categoriesService, this.data?.id ?? null)],
    ],
  });

  constructor() {
    if (this.isEditMode && !this.data?.canEdit) {
      this.form.controls.name.disable();
    }
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue());
    } else {
      this.form.markAllAsTouched();
    }
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }
}
```

- [ ] **Step 4: Implement template**

```html
<!-- src/features/feature-categories/components/category-form-dialog/category-form-dialog.component.html -->
<ui-kit-modal-container [title]="title">
  <form [formGroup]="form" (ngSubmit)="onSubmit()">
    @if (isEditMode && data) {
      <p class="category-form-dialog__id" data-testid="category-id">
        <span class="category-form-dialog__id-label">Id:</span> {{ data.id }}
      </p>
    }

    <ui-kit-input-field label="Название" formControlName="name" />

    <div footer class="category-form-dialog__footer">
      <ui-kit-button type="button" variant="secondary" data-testid="cancel-btn" (click)="cancel()">
        Отмена
      </ui-kit-button>
      @if (!isEditMode || data?.canEdit) {
        <ui-kit-button type="submit" variant="primary" data-testid="save-btn">
          Сохранить
        </ui-kit-button>
      }
    </div>
  </form>
</ui-kit-modal-container>
```

- [ ] **Step 5: Add SCSS**

```scss
// src/features/feature-categories/components/category-form-dialog/category-form-dialog.component.scss
.category-form-dialog {
  &__id {
    margin: 0 0 16px;
    color: var(--color-text-secondary);
  }

  &__id-label {
    font-weight: 600;
  }

  &__footer {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
}
```

- [ ] **Step 6: Run tests to verify pass**

```bash
npx ng test --include="src/features/feature-categories/components/category-form-dialog/category-form-dialog.component.spec.ts"
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/feature-categories/components/category-form-dialog/
git commit -m "feat(categories): add CategoryFormDialogComponent"
```

---

## Task 7: CategoryListPageComponent

**Files:**
- Modify: `src/features/feature-categories/pages/category-list-page/category-list-page.component.ts`
- Modify: `src/features/feature-categories/pages/category-list-page/category-list-page.component.html`
- Modify: `src/features/feature-categories/pages/category-list-page/category-list-page.component.scss`
- Modify: `src/features/feature-categories/pages/category-list-page/category-list-page.component.spec.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/features/feature-categories/pages/category-list-page/category-list-page.component.spec.ts
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, Subject } from 'rxjs';
import { CategoriesService } from '@shared/api/categories';
import { ConfirmationService } from '@shared/ui-kit/confirmation';
import { ModalService } from '@shared/ui-kit/modal';
import type { ICategory } from '@shared/api/categories';
import { CategoryListPageComponent } from './category-list-page.component';

const mockCategory = (id: string, name: string, canEdit = true): ICategory => ({
  id, name, canEdit,
});

describe('CategoryListPageComponent', () => {
  const categoriesServiceStub = {
    getList: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const confirmationServiceStub = { confirm: vi.fn() };
  const modalServiceStub = { open: vi.fn() };

  function createComponent() {
    categoriesServiceStub.getList.mockReturnValue(of([]));
    TestBed.configureTestingModule({
      imports: [CategoryListPageComponent],
      providers: [
        { provide: CategoriesService, useValue: categoriesServiceStub },
        { provide: ConfirmationService, useValue: confirmationServiceStub },
        { provide: ModalService, useValue: modalServiceStub },
      ],
    });
    const fixture = TestBed.createComponent(CategoryListPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    categoriesServiceStub.getList.mockReset();
    confirmationServiceStub.confirm.mockReset();
    modalServiceStub.open.mockReset();
  });

  it('loads first page on init', () => {
    categoriesServiceStub.getList.mockReturnValue(of([]));
    createComponent();
    expect(categoriesServiceStub.getList).toHaveBeenCalledWith({
      pageNumber: 0,
      pageSize: 21,
      search: '',
      sortDesc: false,
    });
  });

  it('sets hasMore to false when page returns less than PAGE_SIZE items', () => {
    const items = Array.from({ length: 5 }, (_, i) => mockCategory(`${i}`, `Cat ${i}`));
    categoriesServiceStub.getList.mockReturnValue(of(items));
    const fixture = createComponent();
    expect(fixture.componentInstance['hasMore']()).toBe(false);
  });

  it('sets hasMore to true when page returns PAGE_SIZE+1 items', () => {
    const items = Array.from({ length: 21 }, (_, i) => mockCategory(`${i}`, `Cat ${i}`));
    categoriesServiceStub.getList.mockReturnValue(of(items));
    const fixture = createComponent();
    expect(fixture.componentInstance['hasMore']()).toBe(true);
  });

  it('shows only PAGE_SIZE items when 21 returned', () => {
    const items = Array.from({ length: 21 }, (_, i) => mockCategory(`${i}`, `Cat ${i}`));
    categoriesServiceStub.getList.mockReturnValue(of(items));
    const fixture = createComponent();
    expect(fixture.componentInstance['items']().length).toBe(20);
  });

  it('resets list and reloads on search change', fakeAsync(() => {
    const page1 = [mockCategory('1', 'Apple')];
    categoriesServiceStub.getList.mockReturnValue(of(page1));
    const fixture = createComponent();
    const searchPage = [mockCategory('2', 'Avocado')];
    categoriesServiceStub.getList.mockReturnValue(of(searchPage));
    fixture.componentInstance['onSearchChange']('Av');
    tick(300);
    expect(fixture.componentInstance['items']()).toEqual(searchPage);
  }));

  it('toggles sortDesc and reloads', () => {
    categoriesServiceStub.getList.mockReturnValue(of([]));
    const fixture = createComponent();
    expect(fixture.componentInstance['sortDesc']()).toBe(false);
    fixture.componentInstance['onSortToggle']();
    expect(fixture.componentInstance['sortDesc']()).toBe(true);
    expect(categoriesServiceStub.getList).toHaveBeenCalledWith(
      expect.objectContaining({ sortDesc: true }),
    );
  });

  it('opens CategoryFormDialog on add and creates item', fakeAsync(() => {
    categoriesServiceStub.getList.mockReturnValue(of([]));
    const fixture = createComponent();
    const newItem = mockCategory('99', 'New');
    modalServiceStub.open.mockReturnValue(of({ name: 'New' }));
    categoriesServiceStub.create.mockReturnValue(of(newItem));
    fixture.componentInstance['onAdd']();
    tick();
    expect(categoriesServiceStub.create).toHaveBeenCalledWith({ name: 'New' });
    expect(fixture.componentInstance['items']()).toContain(newItem);
  }));

  it('opens CategoryFormDialog on edit and updates item', fakeAsync(() => {
    const original = mockCategory('1', 'Old');
    categoriesServiceStub.getList.mockReturnValue(of([original]));
    const fixture = createComponent();
    const updated = mockCategory('1', 'Updated');
    modalServiceStub.open.mockReturnValue(of({ name: 'Updated' }));
    categoriesServiceStub.update.mockReturnValue(of(updated));
    fixture.componentInstance['onEdit'](original);
    tick();
    expect(fixture.componentInstance['items']()[0]).toEqual(updated);
  }));

  it('deletes item after confirmation', fakeAsync(() => {
    const item = mockCategory('1', 'ToDelete');
    categoriesServiceStub.getList.mockReturnValue(of([item]));
    const fixture = createComponent();
    confirmationServiceStub.confirm.mockReturnValue(of(true));
    categoriesServiceStub.delete.mockReturnValue(of(void 0));
    fixture.componentInstance['onDelete'](item);
    tick();
    expect(fixture.componentInstance['items']()).not.toContain(item);
  }));

  it('does not delete when confirmation is false', fakeAsync(() => {
    const item = mockCategory('1', 'Keep');
    categoriesServiceStub.getList.mockReturnValue(of([item]));
    const fixture = createComponent();
    confirmationServiceStub.confirm.mockReturnValue(of(false));
    fixture.componentInstance['onDelete'](item);
    tick();
    expect(categoriesServiceStub.delete).not.toHaveBeenCalled();
  }));
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx ng test --include="src/features/feature-categories/pages/category-list-page/category-list-page.component.spec.ts"
```

Expected: FAIL.

- [ ] **Step 3: Implement component TS**

```ts
// src/features/feature-categories/pages/category-list-page/category-list-page.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, filter, switchMap } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CategoriesService } from '@shared/api/categories';
import type { ICategory } from '@shared/api/categories';
import { ModalService } from '@shared/ui-kit/modal';
import { ConfirmationService } from '@shared/ui-kit/confirmation';
import { CategoryFormDialogComponent } from '../../components/category-form-dialog/category-form-dialog.component';
import type { ICategoryForm } from '../../models/interfaces/category-form.interface';
import { ButtonComponent } from '@shared/ui-kit/button';
import { SearchInputComponent } from '@shared/ui-kit/input/components/search-input';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-category-list-page',
  imports: [ButtonComponent, SearchInputComponent, FormsModule],
  templateUrl: './category-list-page.component.html',
  styleUrl: './category-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryListPageComponent implements OnInit {
  private readonly categoriesService = inject(CategoriesService);
  private readonly modalService = inject(ModalService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly items = signal<ICategory[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly hasMore = signal(true);
  protected readonly sortDesc = signal(false);
  protected readonly searchValue = signal('');

  protected readonly canAdd = computed(() => {
    const list = this.items();
    return list.length === 0 || list.some((i) => i.canEdit);
  });

  private readonly searchSubject = new Subject<string>();
  private pageNumber = 0;
  private readonly PAGE_SIZE = 20;

  public ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        this.searchValue.set(query);
        this.loadPage(true);
      });

    this.loadPage(true);
  }

  protected onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  protected onSortToggle(): void {
    this.sortDesc.update((v) => !v);
    this.loadPage(true);
  }

  protected onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 100;
    if (nearBottom && this.hasMore() && !this.isLoading()) {
      this.loadPage(false);
    }
  }

  protected onAdd(): void {
    this.modalService
      .open<ICategoryForm>(CategoryFormDialogComponent)
      .pipe(
        filter(Boolean),
        switchMap((form) => this.categoriesService.create(form)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((created) => {
        this.items.update((list) => [created, ...list]);
      });
  }

  protected onEdit(category: ICategory): void {
    this.modalService
      .open<ICategoryForm, ICategory>(CategoryFormDialogComponent, category)
      .pipe(
        filter(Boolean),
        switchMap((form) => this.categoriesService.update(category.id, form)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((updated) => {
        this.items.update((list) => list.map((i) => (i.id === updated.id ? updated : i)));
      });
  }

  protected onDelete(category: ICategory): void {
    this.confirmationService
      .confirm('Удалить категорию', `Удалить "${category.name}"? Это действие необратимо.`)
      .pipe(
        filter(Boolean),
        switchMap(() => this.categoriesService.delete(category.id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.items.update((list) => list.filter((i) => i.id !== category.id));
      });
  }

  private loadPage(reset: boolean): void {
    if (reset) {
      this.pageNumber = 0;
      this.items.set([]);
      this.hasMore.set(true);
    }

    this.isLoading.set(true);

    this.categoriesService
      .getList({
        pageNumber: this.pageNumber,
        pageSize: this.PAGE_SIZE + 1,
        search: this.searchValue(),
        sortDesc: this.sortDesc(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        const hasMore = result.length > this.PAGE_SIZE;
        const page = hasMore ? result.slice(0, this.PAGE_SIZE) : result;
        this.hasMore.set(hasMore);
        this.items.update((list) => [...list, ...page]);
        this.pageNumber++;
        this.isLoading.set(false);
      });
  }
}
```

- [ ] **Step 4: Implement template**

```html
<!-- src/features/feature-categories/pages/category-list-page/category-list-page.component.html -->
<div class="category-list-page">
  <div class="category-list-page__header">
    <h1 class="category-list-page__title">Categories</h1>
    @if (canAdd()) {
      <ui-kit-button variant="primary" (click)="onAdd()">Добавить</ui-kit-button>
    }
  </div>

  <ui-kit-search-input
    class="category-list-page__search"
    placeholder="Поиск..."
    [ngModel]="searchValue()"
    (ngModelChange)="onSearchChange($event)"
  />

  <div class="category-list-page__table-container" (scroll)="onScroll($event)">
    <table class="category-list-page__table">
      <thead>
        <tr>
          <th class="category-list-page__col-id">Id</th>
          <th
            class="category-list-page__col-name category-list-page__sortable"
            (click)="onSortToggle()"
          >
            Name
            <span class="category-list-page__sort-icon">{{ sortDesc() ? '↓' : '↑' }}</span>
          </th>
          <th class="category-list-page__col-actions"></th>
        </tr>
      </thead>
      <tbody>
        @for (item of items(); track item.id) {
          <tr class="category-list-page__row">
            <td class="category-list-page__col-id">{{ item.id }}</td>
            <td class="category-list-page__col-name">{{ item.name }}</td>
            <td class="category-list-page__col-actions">
              @if (item.canEdit) {
                <ui-kit-button variant="secondary" (click)="onEdit(item)">Изменить</ui-kit-button>
                <ui-kit-button variant="danger" (click)="onDelete(item)">Удалить</ui-kit-button>
              }
            </td>
          </tr>
        }
      </tbody>
    </table>

    @if (isLoading()) {
      <div class="category-list-page__loading">Загрузка...</div>
    }

    @if (!isLoading() && items().length === 0) {
      <div class="category-list-page__empty">Записей не найдено</div>
    }
  </div>
</div>
```

- [ ] **Step 5: Add SCSS**

```scss
// src/features/feature-categories/pages/category-list-page/category-list-page.component.scss
.category-list-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px;
  gap: 16px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }

  &__search {
    width: 320px;
  }

  &__table-container {
    flex: 1;
    overflow-y: auto;
    border: 1px solid var(--color-border);
    border-radius: 8px;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;

    th,
    td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }

    th {
      background: var(--color-bg-secondary);
      font-weight: 600;
      white-space: nowrap;
    }
  }

  &__sortable {
    cursor: pointer;
    user-select: none;

    &:hover {
      background: var(--color-bg-hover);
    }
  }

  &__sort-icon {
    margin-left: 4px;
  }

  &__col-id {
    width: 80px;
    color: var(--color-text-secondary);
  }

  &__col-actions {
    width: 180px;
    text-align: right;

    ui-kit-button + ui-kit-button {
      margin-left: 8px;
    }
  }

  &__loading,
  &__empty {
    padding: 24px;
    text-align: center;
    color: var(--color-text-secondary);
  }
}
```

- [ ] **Step 6: Run tests to verify pass**

```bash
npx ng test --include="src/features/feature-categories/pages/category-list-page/category-list-page.component.spec.ts"
```

Expected: PASS.

- [ ] **Step 7: Run all tests**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/features/feature-categories/pages/category-list-page/
git commit -m "feat(categories): implement CategoryListPageComponent with CRUD and infinite scroll"
```

---

## Task 8: Barrel exports + финальный билд

**Files:**
- Modify: `src/features/feature-categories/index.ts`

- [ ] **Step 1: Update categories feature barrel**

```ts
// src/features/feature-categories/index.ts
export { FEATURE_CATEGORIES_ROUTES } from './feature-categories.routes';
```

> Примечание: диалоговые компоненты не экспортируются из barrel — они используются только внутри фичи и открываются через `ModalService`.

- [ ] **Step 2: Run full build**

```bash
npm run build -- --no-progress 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 3: Run dev server и проверить вручную**

```bash
npm start
```

Открыть `http://localhost:4200/categories`. Проверить:
- [ ] список загружается
- [ ] поиск фильтрует с задержкой 300 мс
- [ ] клик по "Name" переключает сортировку
- [ ] скролл вниз подгружает следующую страницу
- [ ] Add открывает диалог, после сохранения запись появляется в начале списка
- [ ] Edit открывает диалог с заполненными данными, после сохранения запись обновляется
- [ ] Delete показывает диалог подтверждения, после подтверждения запись пропадает

- [ ] **Step 4: Финальный коммит**

```bash
git add src/features/feature-categories/index.ts
git commit -m "feat(categories): categories feature complete"
```
