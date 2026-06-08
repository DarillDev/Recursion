import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';
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
    service.confirm({ title: 'Delete item', description: 'Cannot be undone' }).subscribe();
    expect(modalSpy.open).toHaveBeenCalledWith(
      ConfirmationDialogComponent,
      { title: 'Delete item', description: 'Cannot be undone' },
    );
  });

  it('returns true when user confirms', async () => {
    modalSpy.open.mockReturnValue(of(true));
    const result = await firstValueFrom(service.confirm({ title: 't', description: 'd' }));
    expect(result).toBe(true);
  });

  it('returns false when user cancels (dialog returns undefined)', async () => {
    modalSpy.open.mockReturnValue(of(undefined));
    const result = await firstValueFrom(service.confirm({ title: 't', description: 'd' }));
    expect(result).toBe(false);
  });
});
