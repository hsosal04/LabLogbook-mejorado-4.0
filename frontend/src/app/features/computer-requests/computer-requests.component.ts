import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { LabsService } from '../../core/services/labs.service';
import { ComputerUsageRequest, Lab } from '../../core/models/models';
import { PATTERNS, sanitizeValue } from '../../shared/form-validators';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
    <section class="page-header card page-header-accent computers-theme">
      <div>
        <span class="badge badge-primary">Uso de equipo de cómputo</span>
        <h1>{{ isStudent() ? 'Solicitar equipo de cómputo' : 'Solicitudes de equipo de cómputo' }}</h1>
        <p class="muted">
          @if (isStudent()) {
            El alumno puede solicitar el uso de un equipo de cómputo en un laboratorio o salón. La asignación queda pendiente hasta que el supervisor o administrador autorice el recurso.
          } @else {
            Revise las solicitudes generadas por alumnos, asigne un equipo disponible y registre la resolución correspondiente.
          }
        </p>
      </div>
    </section>

    @if (isStudent()) {
      <section class="grid grid-2 page-section">
        <div class="card card-accent request-card">
          <h2>Nueva solicitud</h2>
          <form [formGroup]="studentForm" (ngSubmit)="createRequest()" class="request-form">
            <div><label>Matrícula</label><input [value]="currentUser()?.student_code" disabled /></div>
            <div><label>Nombre completo</label><input [value]="fullName()" disabled /></div>
            <div>
              <label>Laboratorio o salón</label>
              <select formControlName="lab">
                <option value="">Seleccione un espacio</option>
                @for (lab of labs(); track lab.id) {
                  <option [value]="lab.id">{{ lab.code }} · {{ lab.name }} · {{ lab.available_computers ?? 0 }} computadoras</option>
                }
              </select>
              @if (selectedLabInfo()) {
                <p class="muted availability-note">Computadoras disponibles en este espacio: {{ selectedLabInfo()?.available_computers ?? 0 }}</p>
              }
            </div>
            <div><label>Fecha</label><input type="date" formControlName="requested_date" [min]="todayIso" /></div>
            <div>
              <label>Hora de inicio</label>
              <input type="time" formControlName="start_time" min="07:00" max="16:59" step="60" (change)="syncEndTime()" />
            </div>
            <div>
              <label>Hora de término</label>
              <input type="time" formControlName="end_time" min="07:01" max="17:00" step="60" />
            </div>
            <div style="grid-column:1/-1;"><label>Motivo de uso</label><input formControlName="purpose" (input)="sanitizeStudent('purpose','text')" placeholder="Ej. práctica, consulta académica, desarrollo de tarea" /></div>
            <div style="grid-column:1/-1;"><label>Observaciones</label><textarea formControlName="notes" (input)="sanitizeStudent('notes','textarea')"></textarea></div>
            <button class="btn-primary" type="submit" [disabled]="studentForm.invalid">Enviar solicitud</button>
          </form>
          <p class="muted helper-text">Las solicitudes se registran en estado pendiente. El alumno no asigna directamente el equipo de cómputo.</p>
        </div>

        <div class="card card-glow policy-card">
          <h2>Flujo de autorización</h2>
          <div class="flow-list">
            <div><strong>1. Alumno</strong><span>Registra la solicitud de uso de equipo de cómputo.</span></div>
            <div><strong>2. Supervisor o administrador</strong><span>Revisa disponibilidad y asigna equipo.</span></div>
            <div><strong>3. Sistema</strong><span>Conserva evidencia del uso solicitado, autorizado o rechazado.</span></div>
          </div>
        </div>
      </section>
    }

    <section class="card table-wrap card-glow page-section">
      <div class="section-title-row">
        <div>
          <h2>{{ isStudent() ? 'Mis solicitudes de equipo de cómputo' : 'Solicitudes recibidas' }}</h2>
          <p class="muted">Historial de solicitudes con estado, horario, espacio y resolución.</p>
        </div>
        <button class="btn-secondary" type="button" (click)="reload()">Actualizar</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Alumno</th><th>Espacio</th><th>Fecha</th><th>Horario</th><th>Motivo</th><th>Equipo</th><th>Estado</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (item of rows(); track item.id) {
            <tr>
              <td><strong>{{ item.student_name }}</strong><br><span class="muted">{{ item.student_code }}</span></td>
              <td>{{ item.lab_code }}<br><span class="muted">{{ item.lab_name }}</span></td>
              <td>{{ item.requested_date | date:'mediumDate' }}</td>
              <td>{{ item.start_time }} - {{ item.end_time }}</td>
              <td>{{ item.purpose }}</td>
              <td>
                @if (canReview() && (item.status === 'PENDING' || item.status === 'APPROVED')) {
                  <input class="inline-input" [value]="draft(item.id).assigned_computer" (input)="setDraft(item.id, 'assigned_computer', $any($event.target).value)" placeholder="Ej. PC-01" />
                } @else {
                  {{ item.assigned_computer || 'Sin asignar' }}
                }
              </td>
              <td><span class="status-pill" [class.pending]="item.status==='PENDING'" [class.approved]="item.status==='APPROVED'" [class.rejected]="item.status==='REJECTED'" [class.done]="item.status==='COMPLETED'">{{ item.status_label || item.status }}</span></td>
              <td>
                @if (canReview() && (item.status === 'PENDING' || item.status === 'APPROVED')) {
                  <div class="action-stack">
                    <input class="inline-input" [value]="draft(item.id).resolution_notes" (input)="setDraft(item.id, 'resolution_notes', $any($event.target).value)" placeholder="Observación" />
                    <button class="btn-primary small" type="button" (click)="approve(item)">Aprobar</button>
                    <button class="btn-danger small" type="button" (click)="reject(item)">Rechazar</button>
                    @if (item.status === 'APPROVED') { <button class="btn-secondary small" type="button" (click)="complete(item)">Finalizar</button> }
                  </div>
                } @else if (isStudent() && item.status === 'PENDING') {
                  <button class="btn-secondary small" type="button" (click)="cancel(item)">Cancelar</button>
                } @else {
                  <span class="muted">Sin acciones</span>
                }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="8"><div class="empty-state">No hay solicitudes registradas.</div></td></tr>
          }
        </tbody>
      </table>
    </section>
  `,
  styles: [`
    .grid-2 { display:grid; grid-template-columns: 1.1fr .9fr; gap:1rem; }
    .request-form { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:1rem; }
    .request-form textarea { min-height:96px; }
    .helper-text { margin-top:.75rem; }
    .availability-note { margin-top:.35rem; font-size:.9rem; }
    .flow-list { display:grid; gap:.85rem; margin-top:1rem; }
    .flow-list div { padding:1rem; border-radius:1rem; background:rgba(59,130,246,.08); border:1px solid rgba(59,130,246,.14); }
    .flow-list strong { display:block; margin-bottom:.25rem; color:#1e3a8a; }
    .flow-list span { color:var(--muted); }
    .inline-input { min-width:130px; padding:.55rem .65rem; border-radius:.65rem; border:1px solid rgba(15,23,42,.12); }
    .status-pill { display:inline-block; padding:.35rem .65rem; border-radius:999px; font-weight:700; background:#eef2ff; color:#3730a3; }
    .status-pill.pending { background:#fef3c7; color:#92400e; }
    .status-pill.approved { background:#dcfce7; color:#166534; }
    .status-pill.rejected { background:#fee2e2; color:#991b1b; }
    .status-pill.done { background:#e0f2fe; color:#075985; }
    .action-stack { display:grid; gap:.45rem; min-width:180px; }
    .small { padding:.45rem .65rem; font-size:.85rem; }

    :host {
      display: block;
      position: relative;
      min-height: calc(100vh - 2rem);
    }
    :host::before {
      content: '';
      position: fixed;
      inset: 0 0 0 290px;
      pointer-events: none;
      background:
        linear-gradient(135deg, rgba(238,244,255,.64), rgba(219,234,254,.54)),
        url('/assets/images/computer-bg.png') right bottom / min(58vw, 920px) auto no-repeat;
      opacity: .92;
      z-index: 0;
    }
    :host > * { position: relative; z-index: 1; }
    .computers-theme {
      position: relative;
      overflow: hidden;
      min-height: 168px;
      background:
        linear-gradient(90deg, rgba(255,255,255,.94) 0%, rgba(255,255,255,.80) 46%, rgba(255,255,255,.28) 100%),
        url('/assets/images/computer-bg.png') right center / min(42vw, 560px) auto no-repeat;
    }
    .computers-theme::after {
      content:'';
      position:absolute;
      inset:0;
      background: radial-gradient(circle at right center, rgba(14,165,233,.12), transparent 36%);
      pointer-events:none;
    }
    .computers-theme > * { position: relative; z-index: 1; }
    .request-card,
    .policy-card,
    .table-wrap {
      position: relative;
      overflow: hidden;
      background: rgba(255,255,255,.80);
    }
    .request-card::after,
    .policy-card::after,
    .table-wrap::after {
      content:'';
      position:absolute;
      inset:auto -1.5rem -1.5rem auto;
      width: 320px;
      height: 230px;
      background: url('/assets/images/computer-bg.png') center center / contain no-repeat;
      opacity: .14;
      pointer-events:none;
      z-index: 0;
    }
    .request-card > *,
    .policy-card > *,
    .table-wrap > * { position: relative; z-index: 1; }
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .table-wrap table { min-width: 960px; }
    @media (max-width: 980px) { :host::before { inset: 0; background-size: 82vw auto; opacity: .46; } }
    @media (max-width: 1100px) { .grid-2, .request-form { grid-template-columns:1fr; } }
  `]
})
export class ComputerRequestsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private labsService = inject(LabsService);

  currentUser = this.auth.currentUser;
  labs = signal<Lab[]>([]);
  rows = signal<ComputerUsageRequest[]>([]);
  drafts = signal<Record<number, { assigned_computer: string; resolution_notes: string }>>({});

  todayIso = new Date().toISOString().slice(0, 10);
  // En el rol alumno, la hora se captura con minutos mediante controles type="time".

  studentForm = this.fb.group({
    lab: ['', Validators.required],
    requested_date: [this.todayIso, Validators.required],
    start_time: ['07:00', Validators.required],
    end_time: ['08:00', Validators.required],
    purpose: ['', [Validators.required, Validators.pattern(PATTERNS.text)]],
    notes: [''],
  });

  isStudent = computed(() => this.currentUser()?.role === 'STUDENT');
  canReview = computed(() => ['ADMIN', 'SUPERVISOR'].includes(this.currentUser()?.role || ''));
  fullName = computed(() => `${this.currentUser()?.first_name || ''} ${this.currentUser()?.last_name || ''}`.trim());
  selectedLabInfo = computed(() => this.labs().find(lab => String(lab.id) === String(this.studentForm.controls.lab.value)));

  ngOnInit(): void {
    this.reload();
    this.labsService.listLabs(100).subscribe({
      next: res => {
        this.labs.set(res.results);
        if (res.results.length && !this.studentForm.controls.lab.value) {
          this.studentForm.controls.lab.setValue(String(res.results[0].id));
        }
      },
      error: error => alert(this.formatError(error, 'No se pudieron cargar los espacios.')),
    });
  }

  reload(): void {
    this.labsService.listComputerRequests(100).subscribe({
      next: res => {
        this.rows.set(res.results);
        const draftMap: Record<number, { assigned_computer: string; resolution_notes: string }> = {};
        for (const item of res.results) {
          draftMap[item.id] = {
            assigned_computer: item.assigned_computer || '',
            resolution_notes: item.resolution_notes || '',
          };
        }
        this.drafts.set(draftMap);
      },
      error: error => alert(this.formatError(error, 'No se pudieron cargar las solicitudes.')),
    });
  }

  createRequest(): void {
    if (this.studentForm.invalid) return;
    this.labsService.createComputerRequest(this.studentForm.getRawValue()).subscribe({
      next: () => {
        this.studentForm.patchValue({ purpose: '', notes: '' });
        this.reload();
      },
      error: error => alert(this.formatError(error, 'No se pudo enviar la solicitud.')),
    });
  }

  syncEndTime(): void {
    const start = this.studentForm.controls.start_time.value || '07:00';
    const [hour, minute] = start.split(':').map(Number);
    const startMinutes = hour * 60 + minute;
    const suggestedEnd = Math.min(startMinutes + 60, 17 * 60);
    const endHour = Math.floor(suggestedEnd / 60);
    const endMinute = suggestedEnd % 60;
    const next = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
    this.studentForm.controls.end_time.setValue(next);
  }

  draft(id: number) {
    return this.drafts()[id] || { assigned_computer: '', resolution_notes: '' };
  }

  setDraft(id: number, key: 'assigned_computer' | 'resolution_notes', value: string): void {
    this.drafts.update(current => ({
      ...current,
      [id]: { ...this.draft(id), [key]: value },
    }));
  }

  approve(item: ComputerUsageRequest): void {
    const payload = this.draft(item.id);
    this.labsService.approveComputerRequest(item.id, payload).subscribe({
      next: () => this.reload(),
      error: error => alert(this.formatError(error, 'No se pudo aprobar la solicitud.')),
    });
  }

  reject(item: ComputerUsageRequest): void {
    const payload = { resolution_notes: this.draft(item.id).resolution_notes };
    this.labsService.rejectComputerRequest(item.id, payload).subscribe({
      next: () => this.reload(),
      error: error => alert(this.formatError(error, 'No se pudo rechazar la solicitud.')),
    });
  }

  complete(item: ComputerUsageRequest): void {
    this.labsService.completeComputerRequest(item.id).subscribe({
      next: () => this.reload(),
      error: error => alert(this.formatError(error, 'No se pudo finalizar la solicitud.')),
    });
  }

  cancel(item: ComputerUsageRequest): void {
    this.labsService.cancelComputerRequest(item.id).subscribe({
      next: () => this.reload(),
      error: error => alert(this.formatError(error, 'No se pudo cancelar la solicitud.')),
    });
  }

  private formatError(error: any, fallback: string): string {
    const payload = error?.error;
    if (typeof payload === 'string') {
      if (payload.includes('<!DOCTYPE html>') || payload.includes('OperationalError')) {
        return `${fallback} Revise que las migraciones del backend estén aplicadas: python manage.py migrate`;
      }
      return payload;
    }
    if (payload?.detail) return payload.detail;
    if (payload && typeof payload === 'object') return JSON.stringify(payload);
    return fallback;
  }

  sanitizeStudent(controlName: 'purpose' | 'notes', kind: 'text' | 'textarea'): void {
    const control = this.studentForm.get(controlName);
    if (control) control.setValue(sanitizeValue(kind, control.value || ''), { emitEvent: false });
  }
}