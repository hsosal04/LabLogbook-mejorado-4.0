import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PATTERNS, distinctEmailFieldsValidator, optionalEmailValidator, sanitizeValue } from '../../shared/form-validators';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="hero hero-gradient auth-page">
      <div class="auth-shell card glass-card" style="max-width:860px; width:100%;">
        <div class="auth-brand-visual"><img src="/assets/images/buap-logo.png" alt="BUAP" /><span>Benemérita Universidad Autónoma de Puebla</span></div>
        <span class="badge badge-primary">Registro de usuario institucional</span>
        <h2>Crear cuenta</h2>
        <p class="muted">La matrícula será el nombre de usuario. El rol define las funciones disponibles dentro de LabLogbook.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="grid grid-2">
          <div><label>Nombre</label><input formControlName="first_name" maxlength="120" (input)="sanitize('first_name','name')" /></div>
          <div><label>Apellidos</label><input formControlName="last_name" maxlength="120" (input)="sanitize('last_name','name')" /></div>
          <div><label>Matrícula</label><input formControlName="student_code" maxlength="9" inputmode="numeric" (input)="sanitize('student_code','studentCode')" /></div>
          <div><label>Departamento</label><input formControlName="department" maxlength="120" (input)="sanitize('department','department')" /></div>
          <div><label>Correo institucional</label><input type="email" formControlName="institutional_email" (input)="sanitize('institutional_email','email')" /></div>
          <div><label>Correo alterno</label><input type="email" formControlName="alternate_email" (input)="sanitize('alternate_email','email')" /></div>
          <div>
            <label>Contraseña</label>
            <input type="password" formControlName="password" (input)="evaluatePassword()" />
            <small class="muted">Debe incluir al menos 8 caracteres, mayúscula, minúscula, número y símbolo.</small>
          </div>
          <div>
            <label>Nivel de seguridad</label>
            <input [value]="passwordStrength()" disabled />
          </div>
          <div><label>Teléfono</label><input formControlName="phone" maxlength="10" inputmode="numeric" (input)="sanitize('phone','phone')" /></div>
          <div>
            <label>Rol</label>
            <select formControlName="role">
              <option value="STUDENT">Alumno</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="PROFESSOR">Profesor</option>
            </select>
          </div>
          <button class="btn-primary" style="grid-column:1/-1;" [disabled]="form.invalid">Crear cuenta</button>
        </form>

        @if (form.errors?.['duplicateEmails']) {
          <p class="muted" style="color:#d14343; margin-top:0.75rem;">Los correos capturados no deben repetirse entre sí.</p>
        }
        <p class="muted" style="margin-top:1rem;"><a routerLink="/login" class="inline-link">Volver a iniciar sesión</a></p>
      </div>
    </section>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  passwordStrength = signal<'DEBIL' | 'MEDIA' | 'ALTA'>('DEBIL');

  form = this.fb.group({
    first_name: ['', [Validators.required, Validators.pattern(PATTERNS.name)]],
    last_name: ['', [Validators.required, Validators.pattern(PATTERNS.name)]],
    student_code: ['', [Validators.required, Validators.pattern(PATTERNS.studentCode)]],
    department: ['', [Validators.pattern(PATTERNS.department)]],
    institutional_email: ['', [Validators.required, Validators.email]],
    alternate_email: ['', [optionalEmailValidator]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: ['', [Validators.required, Validators.pattern(PATTERNS.phone)]],
    role: ['STUDENT', Validators.required],
  }, { validators: [distinctEmailFieldsValidator(['institutional_email', 'alternate_email'])] });

  sanitize(controlName: string, kind: 'name' | 'studentCode' | 'department' | 'email' | 'phone'): void {
    const control = this.form.get(controlName);
    if (!control) return;
    control.setValue(sanitizeValue(kind, control.value || ''), { emitEvent: false });
  }

  evaluatePassword(): void {
    const password = this.form.controls.password.value || '';
    this.auth.checkPasswordStrength(password).subscribe({
      next: ({ strength }) => this.passwordStrength.set(strength),
      error: () => this.passwordStrength.set('DEBIL'),
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = { ...this.form.getRawValue(), status: 'ACTIVE' };
    this.auth.register(payload).subscribe({
      next: () => {
        alert('Usuario creado correctamente.');
        this.router.navigate(['/login']);
      },
      error: (error) => alert(JSON.stringify(error?.error || 'No se pudo completar el registro.')),
    });
  }
}
