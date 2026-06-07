import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from 'src/shared/auth';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
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

  public onSubmit(): void {
    if (this.form.valid) {
      const { email, password } = this.form.getRawValue();

      this.authService.login(email, password).subscribe({
        next: () => {
          // Handle successful login, e.g., navigate to the dashboard
        },
        error: (err) => {
          // Handle login error, e.g., show an error message
          console.error('Login failed:', err);
        },
      });
    } else {
      // Mark all controls as touched to trigger validation messages
      this.form.markAllAsTouched();
    }
  }
}
