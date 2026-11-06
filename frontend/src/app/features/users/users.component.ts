import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../core/models/models';
import { UsersService } from '../../core/services/users.service';
import { PATTERNS, distinctEmailFieldsValidator, optionalEmailValidator, sanitizeValue } from '../../shared/form-validators';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page-header card page-header-accent">
      <div>
        <span class="badge badge-primary">Usuarios</span>
        <h1>Edición de usuarios</h1>
        <p class="muted">Módulo administrativo para editar cuentas existentes y mantener el control de roles del sistema.</p>
      </div>
    </section>

    <section class="grid grid-2 page-section">
      <div class="card card-accent">
        <h2>Editar usuario seleccionado</h2>
        @if (selectedUserId()) {
          <form [formGroup]="editForm" (ngSubmit)="saveSelected()" class="grid grid-2">
            <div><label>Nombre</label><input formControlName="first_name" (input)="sanitize('first_name','name')" /></div>
            <div><label>Apellidos</label><input formControlName="last_name" (input)="sanitize('last_name','name')" /></div>
            <div><label>Matrícula</label><input formControlName="student_code" (input)="sanitize('student_code','studentCode')" /></div>
            <div><label>Correo institucional</label><input formControlName="institutional_email" (input)="sanitize('institutional_email','email')" /></div>
            <div><label>Correo alterno</label><input formControlName="alternate_email" (input)="sanitize('alternate_email','email')" /></div>
            <div><label>Departamento</label><input formControlName="department" (input)="sanitize('department','department')" /></div>
            <div><label>Teléfono</label><input formControlName="phone" maxlength="10" (input)="sanitize('phone','phone')" /></div>
            <div>
              <label>Rol</label>
              @if (selectedUserRole() === 'STUDENT' || selectedUserRole() === 'SUPERVISOR') {
                <select formControlName="role">
                  <option value="STUDENT">Alumno</option>
                  <option value="SUPERVISOR">Supervisor</option>
                </select>
              } @else {
                <input [value]="roleLabel(editFormRole())" disabled />
              }
            </div>
            <div>
              <label>Estado</label>
              <select formControlName="status">
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
            </div>
            <button class="btn-primary" style="grid-column:1/-1;">Guardar cambios</button>
          </form>
        } @else {
          <div class="empty-state">Seleccione un usuario del directorio para editar su información.</div>
        }
      </div>

      <div class="card table-wrap page-section card-glow">
        <div class="section-title-row">
          <div>
            <h2>Directorio de usuarios</h2>
            <p class="muted">Puede filtrar por nombre, matrícula o correo institucional.</p>
          </div>
          <button class="btn-secondary" type="button" (click)="reload()">Actualizar</button>
        </div>

        <div class="grid grid-2" style="margin-bottom:1rem; align-items:end;">
          <div><label>Buscar</label><input [value]="searchTerm()" (input)="setSearch(($any($event.target).value || ''))" /></div>
          <div><label>Registros por página</label><select [value]="pageSize()" (change)="changePageSize(+$any($event.target).value)"><option [value]="10">10</option><option [value]="20">20</option></select></div>
        </div>

        <table>
          <thead><tr><th>Nombre</th><th>Matrícula</th><th>Rol</th><th>Estado</th><th>Correo institucional</th><th>Acciones</th></tr></thead>
          <tbody>
            @for (user of pagedRows(); track user.id) {
              <tr [class.table-row-selected]="selectedUserId() === user.id">
                <td><button class="link-button" type="button" (click)="selectUser(user)">{{ fullName(user) }}</button></td>
                <td>{{ user.student_code }}</td>
                <td>
                  @if (user.role === 'STUDENT' || user.role === 'SUPERVISOR') {
                    <select [value]="user.role" (change)="changeUserRole(user, $any($event.target).value)">
                      <option value="STUDENT">Alumno</option>
                      <option value="SUPERVISOR">Supervisor</option>
                    </select>
                  } @else {
                    {{ roleLabel(user.role) }}
                  }
                </td>
                <td>{{ user.status }}</td>
                <td>{{ user.institutional_email }}</td>
                <td><button class="btn-secondary" type="button" (click)="toggle(user.id)">Cambiar estado</button></td>
              </tr>
            } @empty {
              <tr><td colspan="6"><div class="empty-state">No se encontraron usuarios con los filtros actuales.</div></td></tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class UsersComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);
  rows = signal<User[]>([]);
  selectedUserId = signal<number | null>(null);
  selectedUserRole = signal<User['role'] | null>(null);
  searchTerm = signal('');
  page = signal(1);
  pageSize = signal(10);

  filteredRows = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.rows();
    return this.rows().filter(user => `${user.first_name} ${user.last_name} ${user.student_code} ${user.institutional_email}`.toLowerCase().includes(term));
  });
  pagedRows = computed(() => this.filteredRows().slice((this.page() - 1) * this.pageSize(), this.page() * this.pageSize()));

  editForm = this.fb.group({
    first_name: ['', [Validators.required, Validators.pattern(PATTERNS.name)]],
    last_name: ['', [Validators.required, Validators.pattern(PATTERNS.name)]],
    student_code: ['', [Validators.required, Validators.pattern(PATTERNS.studentCode)]],
    institutional_email: ['', [Validators.required, Validators.email]],
    alternate_email: ['', [optionalEmailValidator]],
    department: ['', [Validators.pattern(PATTERNS.department)]],
    phone: ['', [Validators.required, Validators.pattern(PATTERNS.phone)]],
    role: ['STUDENT', Validators.required],
    status: ['ACTIVE', Validators.required],
  }, { validators: [distinctEmailFieldsValidator(['institutional_email', 'alternate_email'])] });

  ngOnInit(): void { this.reload(); }

  reload() { this.usersService.list({ pageSize: 100 }).subscribe(res => { this.rows.set(res.results); this.page.set(1); }); }

  selectUser(user: User) {
    this.selectedUserId.set(user.id);
    this.selectedUserRole.set(user.role);
    this.editForm.patchValue(user);
  }

  saveSelected() {
    const id = this.selectedUserId();
    if (!id) return;
    this.usersService.update(id, this.editForm.getRawValue()).subscribe({
      next: () => this.reload(),
      error: error => alert(JSON.stringify(error.error || 'No se pudo actualizar el usuario.')),
    });
  }

  changeUserRole(user: User, value: string): void {
    const role = value === 'SUPERVISOR' ? 'SUPERVISOR' : 'STUDENT';
    this.usersService.update(user.id, { role }).subscribe(() => this.reload());
  }

  toggle(id: number) { this.usersService.toggleStatus(id).subscribe(() => this.reload()); }
  setSearch(value: string): void { this.searchTerm.set(value); this.page.set(1); }
  changePageSize(value: number): void { this.pageSize.set(value); this.page.set(1); }
  editFormRole(): User['role'] {
    const role = this.editForm.getRawValue().role;
    if (role === 'ADMIN' || role === 'SUPERVISOR' || role === 'PROFESSOR') return role;
    return 'STUDENT';
  }
  roleLabel(role: User['role']): string {
    return ({ ADMIN: 'Administrador', SUPERVISOR: 'Supervisor', STUDENT: 'Alumno', PROFESSOR: 'Profesor' } as const)[role];
  }
  sanitize(controlName: string, kind: 'name' | 'studentCode' | 'department' | 'email' | 'phone'): void {
    const control = this.editForm.get(controlName);
    if (!control) return;
    control.setValue(sanitizeValue(kind, control.value || ''), { emitEvent: false });
  }
  fullName(user: User): string { return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username; }
}
