import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from 'src/shared/auth';
import { InputFieldComponent } from '@shared/ui-kit/input/components/input-field';
import { ButtonComponent } from '@shared/ui-kit/button';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, InputFieldComponent, ButtonComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

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
        error: () => {
          this.loginError.set('Invalid credentials. Please try again.');
        },
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
