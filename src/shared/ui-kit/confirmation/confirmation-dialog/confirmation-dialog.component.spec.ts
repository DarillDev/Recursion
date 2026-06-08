import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';

describe('ConfirmationDialogComponent', () => {
  const dialogRefSpy = { close: vi.fn() };

  function createComponent(title: string, description: string): ReturnType<typeof TestBed.createComponent<ConfirmationDialogComponent>> {
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
