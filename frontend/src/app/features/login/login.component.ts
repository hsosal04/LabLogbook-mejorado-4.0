import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
  <div class="container" style="max-width: 520px; margin-top: 3rem;">
    <div class="card">
      <h2>Acceso a LabLogbook</h2>
      <form [formGroup]="form" (ngSubmit)="submit()" class="grid">
        <label>Correo o matrícula<input formControlName="identifier"></label>
        <label>Contraseña<input type="password" formControlName="password"></label>
        <button class="primary" type="submit">Entrar</button>
      </form>
      <p *ngIf="error" style="color:#b91c1c; margin-top: 1rem;">{{ error }}</p>
      <p style="margin-top:1rem;"><a routerLink="/">Volver al inicio</a></p>
    </div>
  </div>
  `
})
export class LoginComponent {
  error = '';
  form = this.fb.group({ identifier: ['', [Validators.required]], password: ['', Validators.required] });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    this.auth.login({ username: value.identifier || '', password: value.password || '' }).subscribe({
      next: () => this.router.navigate(['/app/dashboard']),
      error: () => { this.error = 'No fue posible iniciar sesión. Verifique sus credenciales.'; }
    });
  }
}
