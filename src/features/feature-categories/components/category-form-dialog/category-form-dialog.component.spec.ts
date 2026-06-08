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
      const container = fixture.debugElement.query(By.css('ui-kit-modal-container'));
      expect(container.componentInstance.title()).toBe('Добавить категорию');
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
