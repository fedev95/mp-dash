import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/services/auth.service';
import { DEMO_MODE } from '../../../core/utils/demo';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
  ],
  templateUrl: './register.html',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly demoMode = DEMO_MODE;
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      await this.auth.register(email, password);
      await this.router.navigate(['/']);
    } catch (err) {
      this.errorMessage.set(this.toMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  async registerWithGoogle() {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      await this.auth.loginWithGoogle();
      await this.router.navigate(['/']);
    } catch (err) {
      this.errorMessage.set(this.toMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  private toMessage(err: unknown): string {
    const code = (err as { code?: string })?.code;
    return code ? `Error de autenticación (${code})` : 'Ocurrió un error inesperado.';
  }
}
