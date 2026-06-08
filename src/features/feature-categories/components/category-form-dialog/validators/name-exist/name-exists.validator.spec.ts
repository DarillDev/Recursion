import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import type { Observable } from 'rxjs';
import type { ValidationErrors } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { of } from 'rxjs';
import { CategoriesApiService } from '@shared/api/categories';
import { nameExistsValidator } from './name-exists.validator';

describe('nameExistsValidator', () => {
  let service: CategoriesApiService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        { provide: CategoriesApiService, useValue: { checkNameExists: vi.fn() } },
      ],
    });
    service = TestBed.inject(CategoriesApiService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when name does not exist', async () => {
    (service.checkNameExists as ReturnType<typeof vi.fn>).mockReturnValue(of(false));
    const validator = nameExistsValidator(service, null);
    const control = new FormControl('New Name');
    const promise = firstValueFrom(validator(control) as Observable<ValidationErrors | null>);
    await vi.advanceTimersByTimeAsync(400);
    const result = await promise;
    expect(result).toBeNull();
  });

  it('returns nameExists error when name is taken', async () => {
    (service.checkNameExists as ReturnType<typeof vi.fn>).mockReturnValue(of(true));
    const validator = nameExistsValidator(service, null);
    const control = new FormControl('Existing');
    const promise = firstValueFrom(validator(control) as Observable<ValidationErrors | null>);
    await vi.advanceTimersByTimeAsync(400);
    const result = await promise;
    expect(result).toEqual({ nameExists: true });
  });

  it('returns null immediately for empty control value', async () => {
    const validator = nameExistsValidator(service, null);
    const control = new FormControl('');
    const result = await firstValueFrom(
      validator(control) as Observable<ValidationErrors | null>,
    );
    expect(result).toBeNull();
    expect(service.checkNameExists).not.toHaveBeenCalled();
  });
});
