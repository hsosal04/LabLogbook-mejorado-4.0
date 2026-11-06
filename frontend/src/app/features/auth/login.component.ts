import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { sanitizeValue } from '../../shared/form-validators';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="hero hero-gradient auth-page">
      <div class="auth-shell card glass-card" style="max-width:560px; width:100%;">
        <div class="auth-brand-visual"><img src="/assets/images/buap-logo.png" alt="BUAP" /><span>Benemérita Universidad Autónoma de Puebla</span></div>
        <span class="badge badge-primary">Acceso</span>
        <h2>Iniciar sesión</h2>
        <p class="muted">Ingrese con correo institucional, correo alterno o matrícula para acceder a los módulos autorizados.</p>

        <form [formGroup]="loginForm" (ngSubmit)="submit()">
          <div><label>Correo o matrícula</label><input formControlName="identifier" (input)="sanitizeIdentifier()" /></div>
          <div><label>Contraseña</label><input type="password" formControlName="password" /></div>
          <button class="btn-primary" [disabled]="loginForm.invalid">Iniciar sesión</button>
        </form>

        <button class="btn-secondary" style="margin-top:1rem; width:100%;" type="button" (click)="showForgot.set(!showForgot())">Olvidé mi contraseña</button>

        @if (showForgot()) {
          <div class="card" style="margin-top:1rem; padding:1rem;">
            <h3>Recuperar contraseña</h3>
            <form [formGroup]="forgotForm" (ngSubmit)="sendRecovery()">
              <div><label>Correo o matrícula</label><input formControlName="identifier" /></div>
              <button class="btn-primary" [disabled]="forgotForm.invalid">Enviar recuperación</button>
            </form>
            @if (resetPreview()) {
              <p class="muted" style="margin-top:0.75rem;">Vista previa de recuperación: uid={{ resetPreview()?.uid }} token={{ resetPreview()?.token }}</p>
            }
          </div>
        }

        @if (showReset()) {
          <div class="card" style="margin-top:1rem; padding:1rem;">
            <h3>Restablecer contraseña</h3>
            <form [formGroup]="resetForm" (ngSubmit)="resetPassword()">
              <div><label>Nueva contraseña</label><input type="password" formControlName="new_password" /></div>
              <div><label>Confirmar nueva contraseña</label><input type="password" formControlName="confirm_password" /></div>
              <button class="btn-primary" [disabled]="resetForm.invalid">Restablecer contraseña</button>
            </form>
          </div>
        }

        <p class="muted" style="margin-top:1rem;">¿Aún no tiene cuenta? <a routerLink="/register" class="inline-link">Crear una</a></p>
      </div>
    </section>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  showForgot = signal(false);
  resetPreview = signal<{ uid: string; token: string } | null>(null);
  showReset = signal(false);

  loginForm = this.fb.group({ identifier: ['', Validators.required], password: ['', Validators.required] });
  forgotForm = this.fb.group({ identifier: ['', Validators.required] });
  resetForm = this.fb.group({ new_password: ['', [Validators.required, Validators.minLength(8)]], confirm_password: ['', Validators.required] });

  constructor() {
    this.route.queryParamMap.subscribe(params => {
      const uid = params.get('uid');
      const token = params.get('token');
      this.showReset.set(!!uid && !!token);
    });
  }

  sanitizeIdentifier(): void {
    const value = (this.loginForm.controls.identifier.value || '').trim();
    const cleaned = value.includes('@') ? sanitizeValue('email', value) : value.replace(/\s+/g, '');
    this.loginForm.controls.identifier.setValue(cleaned, { emitEvent: false });
  }

  submit() {
    if (this.loginForm.invalid) return;
    const raw = this.loginForm.getRawValue();
    this.auth.login({ username: raw.identifier || '', password: raw.password || '' }).subscribe({
      next: () => this.router.navigate(['/app/dashboard']),
      error: (error) => alert(error?.error?.detail || 'La autenticación falló.'),
    });
  }

  sendRecovery(): void {
    if (this.forgotForm.invalid) return;
    const identifier = this.forgotForm.controls.identifier.value || '';
    this.auth.forgotPassword(identifier).subscribe({
      next: (response) => {
        this.resetPreview.set(response.debug_reset || null);
        alert(response.detail);
      },
      error: (error) => alert(JSON.stringify(error?.error || 'No se pudo iniciar la recuperación.')),
    });
  }

  resetPassword(): void {
    if (this.resetForm.invalid) return;
    const uid = this.route.snapshot.queryParamMap.get('uid') || '';
    const token = this.route.snapshot.queryParamMap.get('token') || '';
    const raw = this.resetForm.getRawValue();
    this.auth.resetPassword({ uid, token, new_password: raw.new_password || '', confirm_password: raw.confirm_password || '' }).subscribe({
      next: () => {
        alert('La contraseña fue restablecida correctamente.');
        this.router.navigate(['/login']);
      },
      error: (error) => alert(JSON.stringify(error?.error || 'No se pudo restablecer la contraseña.')),
    });
  }
}
