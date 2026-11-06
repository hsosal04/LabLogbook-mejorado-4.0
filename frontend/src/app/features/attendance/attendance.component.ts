import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { LabsService } from '../../core/services/labs.service';
import { UsersService } from '../../core/services/users.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page-header card page-header-accent">
      <div>
        <span class="badge badge-primary">Asistencias</span>
        <h1>Control de asistencias</h1>
        <p class="muted">
          Registre entradas y salidas con validación mejorada y captura basada en roles.
        </p>
      </div>
      <div class="hero-stats compact-stats">
        <div class="stat-pill">
          <span class="stat-label">Registros</span>
          <strong>{{ records().length }}</strong>
        </div>
        <div class="stat-pill">
          <span class="stat-label">Abiertas</span>
          <strong>{{ openCount() }}</strong>
        </div>
      </div>
    </section>

    <section class="grid grid-2 page-section">
      <div class="card card-accent">
        <h2>Registrar entrada de asistencia</h2>
        <p class="muted">Para alumnos y profesores, el usuario actual se selecciona automáticamente.</p>

        <form [formGroup]="form" (ngSubmit)="createEntry()">
          @if (canCaptureForOthers()) {
            <div>
              <label>Usuario</label>
              <select formControlName="user">
                <option value="">Seleccione un usuario</option>
                @for (user of users(); track user.id) {
                  <option [value]="user.id">
                    {{ user.first_name }} {{ user.last_name }} · {{ user.role }}
                  </option>
                }
              </select>
            </div>
          }

          <div>
            <label>Laboratorio</label>
            <select formControlName="lab">
              <option value="">Seleccione un laboratorio</option>
              @for (lab of labs(); track lab.id) {
                <option [value]="lab.id">{{ lab.code }} · {{ lab.name }}</option>
              }
            </select>
          </div>

          <div>
            <label>Hora de entrada</label>
            <input type="datetime-local" formControlName="entry_time" />
          </div>

          <div>
            <label>Resumen de actividad</label>
            <textarea formControlName="activity_summary" placeholder="Notas opcionales para esta sesión"></textarea>
          </div>

          <button class="btn-primary" type="submit" [disabled]="form.invalid">
            Registrar entrada
          </button>
        </form>
      </div>

      <div class="card table-wrap card-glow">
        <div class="section-title-row">
          <div>
            <h2>Línea de tiempo de asistencias</h2>
            <p class="muted">Los registros cerrados conservan la hora exacta de salida.</p>
          </div>
          <button class="btn-secondary" type="button" (click)="reload()">Actualizar</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Laboratorio</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>

          <tbody>
            @for (item of records(); track item.id) {
              <tr>
                <td>
                  <strong>{{ item.user_name }}</strong>
                </td>
                <td>{{ item.lab_name }}</td>
                <td>{{ item.entry_time ? (item.entry_time | date:'medium') : '-' }}</td>
                <td>{{ item.exit_time ? (item.exit_time | date:'medium') : 'Abierta' }}</td>
                <td>
                  <span class="status-chip" [class.status-open]="!item.exit_time" [class.status-closed]="!!item.exit_time">
                    {{ item.exit_time ? 'Cerrada' : 'Abierta' }}
                  </span>
                </td>
                <td>
                  @if (!item.exit_time) {
                    <button class="btn-secondary" type="button" (click)="closeAttendance(item.id)">
                      Registrar salida ahora
                    </button>
                  } @else {
                    <span class="muted">Completado</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6">
                  <div class="empty-state">Aún no hay registros de asistencia disponibles.</div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class AttendanceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private attendanceService = inject(AttendanceService);
  private labsService = inject(LabsService);
  private usersService = inject(UsersService);

  private role = this.auth.currentUser()?.role || 'STUDENT';

  records = signal<any[]>([]);
  labs = signal<any[]>([]);
  users = signal<any[]>([]);
  canCaptureForOthers = signal(this.role === 'ADMIN' || this.role === 'SUPERVISOR');
  openCount = computed(() => this.records().filter(item => !item.exit_time).length);

  form = this.fb.group({
    user: [''],
    lab: ['', Validators.required],
    entry_time: [this.currentLocalDateTime(), Validators.required],
    activity_summary: [''],
  });

  ngOnInit(): void {
    this.reload();
    this.loadLabs();
    if (this.canCaptureForOthers()) {
      this.loadUsers();
      this.form.controls.user.addValidators(Validators.required);
      this.form.controls.user.updateValueAndValidity();
    }
  }

  loadLabs(): void {
    this.labsService.listLabs().subscribe({
      next: (res) => this.labs.set(res.results),
      error: (error) => alert(JSON.stringify(error.error || 'No se pudieron cargar los laboratorios.')),
    });
  }

  loadUsers(): void {
    this.usersService.list().subscribe({
      next: (res) => {
        const allowedRoles = ['STUDENT', 'PROFESSOR'];
        this.users.set(res.results.filter(user => allowedRoles.includes(user.role) && user.status === 'ACTIVE'));
      },
      error: (error) => alert(JSON.stringify(error.error || 'No se pudieron cargar los usuarios.')),
    });
  }

  reload(): void {
    this.attendanceService.list().subscribe({
      next: (res) => this.records.set(res.results),
      error: (error) => alert(JSON.stringify(error.error || 'No se pudieron cargar los registros de asistencia.')),
    });
  }

  createEntry(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: Record<string, unknown> = {
      lab: raw.lab,
      entry_time: raw.entry_time,
      activity_summary: raw.activity_summary || '',
    };

    if (this.canCaptureForOthers()) {
      payload['user'] = raw.user;
    }

    this.attendanceService.create(payload).subscribe({
      next: () => {
        this.form.reset({
          user: '',
          lab: '',
          entry_time: this.currentLocalDateTime(),
          activity_summary: '',
        });
        this.reload();
      },
      error: (error) => alert(JSON.stringify(error.error || 'No se pudo registrar la entrada.')),
    });
  }

  closeAttendance(id: number): void {
    this.attendanceService.close(id, this.currentLocalDateTime()).subscribe({
      next: () => this.reload(),
      error: (error) => alert(JSON.stringify(error.error || 'No se pudo registrar la salida.')),
    });
  }

  private currentLocalDateTime(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }
}
