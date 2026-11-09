import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { getErrorMessages } from '../../core/utils/api-error';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'om-login',
  imports: [ReactiveFormsModule, Icon],
  templateUrl: './login.html',
})
export class Login {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** ?returnUrl= set by the auth guard. */
  readonly returnUrl = input<string>('/dashboard');

  protected readonly loading = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        const target = this.returnUrl()?.startsWith('/') ? this.returnUrl() : '/dashboard';
        this.router.navigateByUrl(target);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(getErrorMessages(err)[0]);
      },
    });
  }
}
