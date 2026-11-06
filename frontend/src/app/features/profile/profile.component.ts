import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { API_BASE_URL } from '../../core/services/api-base';
import { PATTERNS, optionalEmailValidator, sanitizeValue } from '../../shared/form-validators';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page-header card page-header-accent profile-theme">
      <div>
        <span class="badge badge-primary">Perfil</span>
        <h1>Mi perfil</h1>
        <p class="muted">Puede modificar su información personal, matrícula, correo institucional y datos de contacto.</p>
      </div>
    </section>

    <section class="card card-accent page-section" style="max-width:900px;">
      <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="grid grid-2">
        <div><label>Nombre</label><input formControlName="first_name" (input)="sanitize(profileForm,'first_name','name')" /></div>
        <div><label>Apellidos</label><input formControlName="last_name" (input)="sanitize(profileForm,'last_name','name')" /></div>
        <div><label>Matrícula</label><input formControlName="student_code" maxlength="9" (input)="sanitize(profileForm,'student_code','studentCode')" /></div>
        <div><label>Correo institucional</label><input formControlName="institutional_email" (input)="sanitize(profileForm,'institutional_email','email')" /></div>
        <div><label>Correo alterno</label><input formControlName="alternate_email" (input)="sanitize(profileForm,'alternate_email','email')" /></div>
        <div><label>Departamento</label><input formControlName="department" (input)="sanitize(profileForm,'department','department')" /></div>
        <div><label>Teléfono</label><input formControlName="phone" maxlength="10" (input)="sanitize(profileForm,'phone','phone')" /></div>
        <div style="grid-column:1/-1;"><label>URL de foto</label><input formControlName="photo_url" /></div>
        <button class="btn-primary" style="grid-column:1/-1;">Guardar perfil</button>
      </form>
    </section>

    <section class="card page-section" style="max-width:900px;">
      <span class="badge badge-primary">Cambio de contraseña</span>
      <div class="grid grid-2" style="margin-top:1rem;">
        <div><label>Nivel actual de nueva contraseña</label><input [value]="passwordStrength()" disabled /></div>
      </div>
      <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="grid grid-2" style="margin-top:1rem;">
        <div><label>Contraseña anterior</label><input type="password" formControlName="current_password" /></div>
        <div><label>Nueva contraseña</label><input type="password" formControlName="new_password" (input)="evaluatePassword()" /></div>
        <div><label>Verificar nueva contraseña</label><input type="password" formControlName="confirm_password" /></div>
        <button class="btn-primary" style="grid-column:1/-1;">Actualizar contraseña</button>
      </form>
    </section>
  `,
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private http = inject(HttpClient);

  passwordStrength = signal<'DEBIL' | 'MEDIA' | 'ALTA'>('DEBIL');

  profileForm = this.fb.group({
    first_name: ['', [Validators.required, Validators.pattern(PATTERNS.name)]],
    last_name: ['', [Validators.required, Validators.pattern(PATTERNS.name)]],
    student_code: ['', [Validators.required, Validators.pattern(PATTERNS.studentCode)]],
    institutional_email: ['', [Validators.required, Validators.email]],
    alternate_email: ['', [optionalEmailValidator]],
    department: ['', [Validators.pattern(PATTERNS.department)]],
    phone: ['', [Validators.required, Validators.pattern(PATTERNS.phone)]],
    photo_url: [''],
  });

  passwordForm = this.fb.group({
    current_password: ['', Validators.required],
    new_password: ['', [Validators.required, Validators.minLength(8)]],
    confirm_password: ['', Validators.required],
  });

  ngOnInit(): void {
    this.auth.fetchMe().subscribe(user => this.profileForm.patchValue(user));
  }

  sanitize(form: any, controlName: string, kind: 'name' | 'department' | 'email' | 'phone' | 'studentCode') {
    const control = form.get(controlName);
    if (!control) return;
    control.setValue(sanitizeValue(kind, control.value || ''), { emitEvent: false });
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const payload = this.profileForm.getRawValue();
    this.http.patch(`${API_BASE_URL}/auth/me/`, payload).subscribe({
      next: () => {
        alert('Perfil actualizado correctamente.');
        this.auth.fetchMe().subscribe();
      },
      error: (error) => alert(JSON.stringify(error.error || 'No se pudo actualizar el perfil.')),
    });
  }

  evaluatePassword(): void {
    const password = this.passwordForm.controls.new_password.value || '';
    this.auth.checkPasswordStrength(password).subscribe({
      next: ({ strength }) => this.passwordStrength.set(strength),
      error: () => this.passwordStrength.set('DEBIL'),
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.auth.changePassword(this.passwordForm.getRawValue() as any).subscribe({
      next: () => {
        alert('La contraseña se actualizó correctamente.');
        this.passwordForm.reset();
        this.passwordStrength.set('DEBIL');
      },
      error: (error) => alert(JSON.stringify(error?.error || 'No se pudo actualizar la contraseña.')),
    });
  }
}
