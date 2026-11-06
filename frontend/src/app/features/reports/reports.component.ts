import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IncidentReport, User } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { LabsService } from '../../core/services/labs.service';
import { ReportsService } from '../../core/services/reports.service';
import { PATTERNS, sanitizeValue } from '../../shared/form-validators';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page-header card page-header-accent reports-theme">
      <div>
        <span class="badge badge-primary">Reportes</span>
        <h1>Reportes operativos</h1>
        <p class="muted">Consulte asistencias, utilización y percances con validación de fechas y paginación.</p>
      </div>
    </section>

    <section class="card page-section card-accent">
      <form [formGroup]="filters" class="grid grid-4" (ngSubmit)="loadAttendanceReport()">
        <div>
          <label>Laboratorio</label>
          <select formControlName="lab_id">
            <option value="">Todos</option>
            @for (lab of labs(); track lab.id) {
              <option [value]="lab.id">{{ lab.code }} · {{ lab.name }}</option>
            }
          </select>
        </div>
        <div>
          <label>Usuario</label>
          <input formControlName="user_id" inputmode="numeric" placeholder="ID opcional" (input)="sanitizeFilterUserId()" />
        </div>
        <div>
          <label>Fecha inicial</label>
          <input type="datetime-local" formControlName="start" />
        </div>
        <div>
          <label>Fecha final</label>
          <input type="datetime-local" formControlName="end" />
        </div>
        <div class="actions" style="grid-column:1/-1; gap:0.75rem;">
          <button class="btn-primary" type="submit">Generar reporte de asistencias</button>
          <button class="btn-secondary" type="button" (click)="resetFilters()">Limpiar filtros</button>
        </div>
      </form>
      <p class="muted" style="margin-top:0.75rem;">Minutos acumulados: <strong>{{ totalMinutes() }}</strong></p>
    </section>

    <section class="grid grid-2 page-section">
      <div class="card table-wrap card-glow">
        <div class="section-title-row">
          <div>
            <h2>Reporte de asistencias</h2>
            <p class="muted">Resultados paginados en bloques de 10 o 20 registros.</p>
          </div>
        </div>

        <div class="actions" style="justify-content:space-between; margin-bottom:1rem; align-items:end;">
          <div>
            <label>Registros por página</label>
            <select [value]="attendancePageSize()" (change)="changeAttendancePageSize(+$any($event.target).value)">
              <option [value]="10">10</option>
              <option [value]="20">20</option>
            </select>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Laboratorio</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Minutos</th>
            </tr>
          </thead>
          <tbody>
            @for (item of pagedAttendanceRows(); track item.id) {
              <tr>
                <td>{{ item.user }}</td>
                <td>{{ item.lab }}</td>
                <td>{{ item.entry_time ? (item.entry_time | date:'medium') : '-' }}</td>
                <td>{{ item.exit_time ? (item.exit_time | date:'medium') : 'Abierta' }}</td>
                <td>{{ item.duration_minutes ?? '—' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="5"><div class="empty-state">No hay datos de asistencia para los filtros seleccionados.</div></td></tr>
            }
          </tbody>
        </table>

        <div class="actions" style="justify-content:space-between; margin-top:1rem; align-items:center;">
          <div class="muted">Página {{ attendancePage() }} de {{ attendanceTotalPages() }}</div>
          <div style="display:flex; gap:0.75rem;">
            <button class="btn-secondary" type="button" (click)="previousAttendancePage()" [disabled]="attendancePage() <= 1">Anterior</button>
            <button class="btn-secondary" type="button" (click)="nextAttendancePage()" [disabled]="attendancePage() >= attendanceTotalPages()">Siguiente</button>
          </div>
        </div>
      </div>

      <div class="card table-wrap card-glow">
        <div class="section-title-row">
          <div>
            <h2>Reporte de utilización</h2>
            <p class="muted">Minutos ocupados resumidos a partir de registros de asistencia cerrados.</p>
          </div>
          <button class="btn-secondary" type="button" (click)="loadUtilization()">Generar reporte de utilización</button>
        </div>

        <div class="actions" style="justify-content:space-between; margin-bottom:1rem; align-items:end;">
          <div>
            <label>Registros por página</label>
            <select [value]="utilizationPageSize()" (change)="changeUtilizationPageSize(+$any($event.target).value)">
              <option [value]="10">10</option>
              <option [value]="20">20</option>
            </select>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Laboratorio</th>
              <th>Sesiones</th>
              <th>Minutos totales</th>
            </tr>
          </thead>
          <tbody>
            @for (item of pagedUtilizationRows(); track item.lab_id) {
              <tr>
                <td>{{ item.lab_name }}</td>
                <td>{{ item.sessions }}</td>
                <td>{{ item.total_minutes }}</td>
              </tr>
            } @empty {
              <tr><td colspan="3"><div class="empty-state">No hay información de utilización disponible.</div></td></tr>
            }
          </tbody>
        </table>

        <div class="actions" style="justify-content:space-between; margin-top:1rem; align-items:center;">
          <div class="muted">Página {{ utilizationPage() }} de {{ utilizationTotalPages() }}</div>
          <div style="display:flex; gap:0.75rem;">
            <button class="btn-secondary" type="button" (click)="previousUtilizationPage()" [disabled]="utilizationPage() <= 1">Anterior</button>
            <button class="btn-secondary" type="button" (click)="nextUtilizationPage()" [disabled]="utilizationPage() >= utilizationTotalPages()">Siguiente</button>
          </div>
        </div>
      </div>
    </section>

    <section class="grid grid-2 page-section incidents-grid">
      <div class="card card-accent card-glow">
        <h2>Reporte de percance</h2>
        <p class="muted">Registre fallas, anomalías o necesidades de mantenimiento relacionadas con salones, laboratorios o equipos de cómputo.</p>

        <form [formGroup]="incidentForm" (ngSubmit)="createIncident()" class="grid">
          <div>
            <label>Recurso afectado</label>
            <select formControlName="lab">
              <option [ngValue]="null">Seleccione un recurso</option>
              @for (lab of labs(); track lab.id) {
                <option [ngValue]="lab.id">{{ lab.name }} · {{ lab.code }}</option>
              }
            </select>
          </div>

          <div class="grid grid-2 compact-grid">
            <div>
              <label>Reportado por</label>
              <input formControlName="reported_by_name" placeholder="Nombre del responsable" maxlength="160" (input)="sanitizeIncidentField('reported_by_name', 'professorName')" />
            </div>
            <div>
              <label>Severidad</label>
              <select formControlName="severity">
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
              </select>
            </div>
          </div>

          <div>
            <label>Descripción</label>
            <textarea formControlName="description" placeholder="Describa con claridad el percance detectado" (input)="sanitizeIncidentField('description', 'textarea')"></textarea>
          </div>

          <button class="btn-primary" type="submit">Registrar percance</button>
        </form>
      </div>

      <div class="card card-glow incidents-panel">
        <div class="section-title-row">
          <div>
            <h2>Seguimiento de percances</h2>
            <p class="muted">Consulte el estado actual de los percances registrados.</p>
          </div>
          <button class="btn-secondary" type="button" (click)="loadIncidents()">Actualizar</button>
        </div>

        <div class="incidents-list">
          @for (incident of incidents(); track incident.id) {
            <article class="incident-item">
              <div class="incident-top-row">
                <div>
                  <h3>{{ incident.lab_name }}</h3>
                  <div class="muted incident-code">{{ incident.lab_code }}</div>
                </div>
                <div class="incident-badges">
                  <span class="status-chip" [class]="severityClass(incident.severity)">{{ incident.severity_label }}</span>
                  <span class="status-chip" [class]="incidentStatusClass(incident.status)">{{ incident.status_label }}</span>
                </div>
              </div>

              <p class="incident-description">{{ incident.description }}</p>
              <div class="muted incident-meta">{{ incident.reported_by_name }} · {{ incident.created_at | date:'medium' }}</div>

              <div class="actions incident-actions">
                <button class="btn-secondary" type="button" (click)="updateIncidentStatus(incident, 'IN_REVIEW')">En revisión</button>
                <button class="btn-primary" type="button" (click)="updateIncidentStatus(incident, 'RESOLVED')">Marcar resuelta</button>
                <button class="btn-secondary" type="button" (click)="updateIncidentStatus(incident, 'OPEN')">Reabrir</button>
              </div>
            </article>
          } @empty {
            <div class="empty-state">No hay percances registrados para los recursos disponibles.</div>
          }
        </div>
      </div>
    </section>
  `,
})
export class ReportsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private reportsService = inject(ReportsService);
  private labsService = inject(LabsService);
  private auth = inject(AuthService);

  labs = signal<any[]>([]);
  attendanceRows = signal<any[]>([]);
  totalMinutes = signal(0);
  utilizationRows = signal<any[]>([]);
  incidents = signal<IncidentReport[]>([]);
  currentUser = this.auth.currentUser;

  attendancePage = signal(1);
  attendancePageSize = signal(10);
  attendanceTotalPages = computed(() => Math.max(1, Math.ceil(this.attendanceRows().length / this.attendancePageSize())));
  pagedAttendanceRows = computed(() => {
    const start = (this.attendancePage() - 1) * this.attendancePageSize();
    return this.attendanceRows().slice(start, start + this.attendancePageSize());
  });

  utilizationPage = signal(1);
  utilizationPageSize = signal(10);
  utilizationTotalPages = computed(() => Math.max(1, Math.ceil(this.utilizationRows().length / this.utilizationPageSize())));
  pagedUtilizationRows = computed(() => {
    const start = (this.utilizationPage() - 1) * this.utilizationPageSize();
    return this.utilizationRows().slice(start, start + this.utilizationPageSize());
  });

  filters = this.fb.group({
    lab_id: [''],
    user_id: [''],
    start: [''],
    end: [''],
  });

  incidentForm = this.fb.group({
    lab: [null as number | null, Validators.required],
    reported_by_name: ['', [Validators.required, Validators.pattern(PATTERNS.professorName)]],
    severity: ['MEDIUM', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
  });

  ngOnInit(): void {
    this.labsService.listLabs(100).subscribe({
      next: res => this.labs.set(res.results),
      error: error => alert(JSON.stringify(error.error || 'No se pudieron cargar los laboratorios.')),
    });

    const user = this.currentUser();
    if (user) {
      this.incidentForm.patchValue({ reported_by_name: this.userDisplayName(user) });
    }

    this.loadAttendanceReport();
    this.loadUtilization();
    this.loadIncidents();
  }

  loadAttendanceReport(): void {
    const validationError = this.validateDateRange();
    if (validationError) {
      alert(validationError);
      return;
    }

    const raw = this.filters.getRawValue();

    this.reportsService.attendanceByLab(raw as Record<string, string>).subscribe({
      next: res => {
        this.attendanceRows.set(res.results);
        this.totalMinutes.set(res.total_minutes ?? 0);
        this.attendancePage.set(1);
      },
      error: error => {
        alert(JSON.stringify(error.error || 'No se pudo generar el reporte de asistencias.'));
      },
    });
  }

  loadUtilization(): void {
    this.reportsService.utilization().subscribe({
      next: res => {
        this.utilizationRows.set(res.results);
        this.utilizationPage.set(1);
      },
      error: error => {
        alert(JSON.stringify(error.error || 'No se pudo generar el reporte de utilización.'));
      },
    });
  }

  loadIncidents(): void {
    this.reportsService.listIncidents(100).subscribe({
      next: res => this.incidents.set(res.results),
      error: error => alert(JSON.stringify(error.error || 'No se pudieron cargar los percances.')),
    });
  }

  createIncident(): void {
    if (this.incidentForm.invalid) {
      this.incidentForm.markAllAsTouched();
      return;
    }

    const raw = this.incidentForm.getRawValue();
    const payload = {
      lab: Number(raw.lab),
      reported_by_name: raw.reported_by_name || '',
      severity: raw.severity || 'MEDIUM',
      description: raw.description || '',
    };

    this.reportsService.createIncident(payload).subscribe({
      next: () => {
        const user = this.currentUser();
        this.incidentForm.reset({
          lab: null,
          reported_by_name: user ? this.userDisplayName(user) : '',
          severity: 'MEDIUM',
          description: '',
        });
        this.loadIncidents();
      },
      error: error => alert(JSON.stringify(error.error || 'No se pudo registrar el percance.')),
    });
  }

  updateIncidentStatus(incident: IncidentReport, status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED'): void {
    this.reportsService.updateIncidentStatus(incident.id, status).subscribe({
      next: updated => {
        this.incidents.update(rows => rows.map(item => item.id === incident.id ? updated : item));
      },
      error: error => alert(JSON.stringify(error.error || 'No se pudo actualizar el estado del percance.')),
    });
  }

  sanitizeFilterUserId(): void {
    this.filters.controls.user_id.setValue((this.filters.controls.user_id.value || '').replace(/\D/g, ''), { emitEvent: false });
  }

  sanitizeIncidentField(controlName: 'reported_by_name' | 'description', kind: 'professorName' | 'textarea'): void {
    const control = this.incidentForm.get(controlName);
    if (!control) return;
    control.setValue(sanitizeValue(kind, control.value || ''), { emitEvent: false });
  }

  resetFilters(): void {
    this.filters.reset({ lab_id: '', user_id: '', start: '', end: '' });
    this.loadAttendanceReport();
  }

  changeAttendancePageSize(value: number): void {
    this.attendancePageSize.set(value);
    this.attendancePage.set(1);
  }

  previousAttendancePage(): void {
    this.attendancePage.update(value => Math.max(1, value - 1));
  }

  nextAttendancePage(): void {
    this.attendancePage.update(value => Math.min(this.attendanceTotalPages(), value + 1));
  }

  changeUtilizationPageSize(value: number): void {
    this.utilizationPageSize.set(value);
    this.utilizationPage.set(1);
  }

  previousUtilizationPage(): void {
    this.utilizationPage.update(value => Math.max(1, value - 1));
  }

  nextUtilizationPage(): void {
    this.utilizationPage.update(value => Math.min(this.utilizationTotalPages(), value + 1));
  }

  severityClass(severity: IncidentReport['severity']): string {
    return severity === 'HIGH' ? 'status-danger' : severity === 'LOW' ? 'status-success' : 'status-warning';
  }

  incidentStatusClass(status: IncidentReport['status']): string {
    if (status === 'RESOLVED') return 'status-closed';
    if (status === 'IN_REVIEW') return 'status-review';
    return 'status-open';
  }

  private validateDateRange(): string | null {
    const { start, end } = this.filters.getRawValue();
    const now = new Date();
    const startDate = start ? new Date(start) : null;
    const endDate = end ? new Date(end) : null;

    if (startDate && Number.isNaN(startDate.getTime())) return 'La fecha inicial no es válida.';
    if (endDate && Number.isNaN(endDate.getTime())) return 'La fecha final no es válida.';
    if (startDate && startDate > now) return 'La fecha inicial no puede ubicarse en el futuro.';
    if (endDate && endDate > now) return 'La fecha final no puede ubicarse en el futuro.';
    if (startDate && endDate && endDate < startDate) return 'La fecha final debe ser posterior o igual a la fecha inicial.';
    return null;
  }

  private userDisplayName(user: User): string {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || user.username;
  }
}
