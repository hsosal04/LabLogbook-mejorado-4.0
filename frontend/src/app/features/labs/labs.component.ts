import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { LabsService } from '../../core/services/labs.service';
import { UsersService } from '../../core/services/users.service';
import { PATTERNS, sanitizeValue } from '../../shared/form-validators';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page-header card page-header-accent labs-theme">
      <div>
        <span class="badge badge-primary">Laboratorios</span>
        <h1>Catálogo de laboratorios</h1>
        <p class="muted">Permite crear, editar, eliminar y reasignar supervisores según sea necesario.</p>
      </div>
    </section>

    <section class="grid grid-2 page-section">
      <div class="card card-accent">
        <h2>{{ selectedLabId() ? 'Editar laboratorio' : 'Crear laboratorio' }}</h2>
        <form [formGroup]="form" (ngSubmit)="save()">
          <div><label>Nombre</label><input formControlName="name" (input)="sanitize('name','text')" /></div>
          <div><label>Código</label><input formControlName="code" (input)="sanitize('code','labCode')" /></div>
          <div><label>Ubicación</label><input formControlName="location" (input)="sanitize('location','text')" /></div>
          <div><label>Capacidad</label><input type="number" min="1" formControlName="capacity" /></div>
          <div><label>Computadoras disponibles</label><input type="number" min="0" formControlName="available_computers" /></div>
          <div><label>Estado</label><select formControlName="status"><option value="AVAILABLE">Disponible</option><option value="MAINTENANCE">Mantenimiento</option><option value="INACTIVE">Inactivo</option></select></div>
          <div>
            <label>Supervisores asignados</label>
            <div class="supervisors-editor">
              @for (supervisorId of selectedSupervisors(); track $index; let index = $index) {
                <div class="supervisor-row">
                  <select [value]="supervisorId" (change)="updateSupervisor(index, $any($event.target).value)" class="multi-select">
                    <option value="">Selecciona un supervisor</option>
                    @for (supervisor of supervisors(); track supervisor.id) {
                      <option [value]="supervisor.id">{{ displaySupervisorName(supervisor) }}</option>
                    }
                  </select>
                  <button type="button" class="btn-secondary" (click)="removeSupervisor(index)">Quitar</button>
                </div>
              }
              @if (!selectedSupervisors().length) {
                <div class="muted">No hay supervisores asignados. Agrega uno por nombre.</div>
              }
              <button type="button" class="btn-secondary" (click)="addSupervisor()">Agregar supervisor</button>
            </div>
          </div>
          <div class="actions"><button class="btn-primary" [disabled]="form.invalid">{{ selectedLabId() ? 'Guardar cambios' : 'Crear laboratorio' }}</button><button class="btn-secondary" type="button" (click)="resetForm()">Limpiar</button></div>
        </form>
      </div>

      <div class="card table-wrap card-glow">
        <div class="section-title-row"><div><h2>Catálogo</h2><p class="muted">El apartado de laboratorios asignados para supervisores fue retirado.</p></div><button class="btn-secondary" type="button" (click)="reload()">Actualizar</button></div>
        <table>
          <thead><tr><th>Código</th><th>Nombre</th><th>Ubicación</th><th>Computadoras disponibles</th><th>Supervisores</th><th>Acciones</th></tr></thead>
          <tbody>
            @for (lab of rows(); track lab.id) {
              <tr>
                <td>{{ lab.code }}</td><td>{{ lab.name }}</td><td>{{ lab.location }}</td><td>{{ lab.available_computers ?? 0 }}</td><td>{{ lab.supervisor_names?.join(', ') || 'Sin asignar' }}</td>
                <td><button class="btn-secondary" type="button" (click)="selectLab(lab)">Editar</button></td>
              </tr>
            } @empty { <tr><td colspan="6"><div class="empty-state">No se han registrado laboratorios.</div></td></tr> }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class LabsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private labsService = inject(LabsService);
  private usersService = inject(UsersService);

  rows = signal<any[]>([]);
  supervisors = signal<any[]>([]);
  selectedLabId = signal<number | null>(null);
  canManageLabs = signal(this.auth.currentUser()?.role === 'ADMIN' || this.auth.currentUser()?.role === 'SUPERVISOR');

  selectedSupervisors = computed(() => this.form.controls.supervisors.value ?? []);


  form = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(PATTERNS.text)]],
    code: ['', [Validators.required, Validators.pattern(PATTERNS.labCode)]],
    location: ['', [Validators.required, Validators.pattern(PATTERNS.text)]],
    capacity: [20, [Validators.required, Validators.min(1)]],
    available_computers: [0, [Validators.required, Validators.min(0)]],
    status: ['AVAILABLE', Validators.required],
    supervisors: [[] as string[]],
  });

  ngOnInit(): void {
    this.reload();
    this.usersService.list({ pageSize: 100 }).subscribe(res => this.supervisors.set(res.results.filter(user => user.role === 'SUPERVISOR' && user.status === 'ACTIVE')));
  }


  displaySupervisorName(supervisor: any): string {
    const fullName = `${supervisor.first_name ?? ''} ${supervisor.last_name ?? ''}`.trim();
    return fullName || supervisor.institutional_email || supervisor.email || `Supervisor #${supervisor.id}`;
  }

  addSupervisor(): void {
    const current = [...(this.form.controls.supervisors.value ?? [])];
    current.push('');
    this.form.controls.supervisors.setValue(current);
  }

  updateSupervisor(index: number, supervisorId: string): void {
    const current = [...(this.form.controls.supervisors.value ?? [])];
    current[index] = supervisorId;
    this.form.controls.supervisors.setValue(current);
  }

  removeSupervisor(index: number): void {
    const current = [...(this.form.controls.supervisors.value ?? [])];
    current.splice(index, 1);
    this.form.controls.supervisors.setValue(current);
  }

  reload() { this.labsService.listLabs(100).subscribe(res => this.rows.set(res.results)); }

  selectLab(lab: any): void {
    this.selectedLabId.set(lab.id);
    this.form.patchValue({ ...lab, supervisors: (lab.supervisors || []).map((value: number) => String(value)) });
  }

  save(): void {
    const payload = { ...this.form.getRawValue(), supervisors: (this.form.getRawValue().supervisors || []).filter(value => value !== '').map(value => Number(value)) };
    const request = this.selectedLabId() ? this.labsService.updateLab(this.selectedLabId()!, payload) : this.labsService.createLab(payload);
    request.subscribe({ next: () => { this.resetForm(); this.reload(); }, error: error => alert(JSON.stringify(error.error || 'No se pudo guardar el laboratorio.')) });
  }

  resetForm(): void { this.selectedLabId.set(null); this.form.reset({ capacity: 20, available_computers: 0, status: 'AVAILABLE', supervisors: [] }); }
  sanitize(controlName: 'name' | 'code' | 'location', kind: 'text' | 'labCode'): void { const control = this.form.get(controlName); if (control) control.setValue(sanitizeValue(kind, control.value || ''), { emitEvent: false }); }
}
