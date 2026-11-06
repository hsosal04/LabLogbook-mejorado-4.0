import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { LabsService } from '../../core/services/labs.service';
import { ClassroomUsage } from '../../core/models/models';

@Component({
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <section class="page-header card page-header-accent classrooms-theme">
      <div>
        <span class="badge badge-primary">Uso de salón</span>
        <h1>Solicitudes de salón</h1>
        <p class="muted">Revise las solicitudes de salón generadas por profesores, valide la disponibilidad del espacio y registre si se aprueban o rechazan.</p>
      </div>
    </section>

    <section class="card table-wrap card-glow page-section">
      <div class="section-title-row">
        <div>
          <h2>Solicitudes recibidas</h2>
          <p class="muted">Historial de solicitudes con profesor, espacio, materia, horario y estado de autorización.</p>
        </div>
        <button class="btn-secondary" type="button" (click)="reload()">Actualizar</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Profesor</th>
            <th>Espacio</th>
            <th>Materia</th>
            <th>Horario</th>
            <th>Observaciones</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (item of rows(); track item.id) {
            <tr>
              <td><strong>{{ item.professor_name }}</strong></td>
              <td>{{ item.lab_name }}</td>
              <td>{{ item.subject }}</td>
              <td>{{ item.start_time | date:'medium' }}<br><span class="muted">{{ item.end_time | date:'shortTime' }}</span></td>
              <td>
                <div>{{ item.notes || 'Sin observaciones' }}</div>
                @if (item.resolution_notes) {
                  <small class="muted">Resolución: {{ item.resolution_notes }}</small>
                }
              </td>
              <td>
                <span class="status-pill" [class.pending]="item.status==='PENDING'" [class.approved]="item.status==='APPROVED'" [class.rejected]="item.status==='REJECTED'">
                  {{ item.status_label || labelFor(item.status) }}
                </span>
              </td>
              <td>
                @if (item.status === 'PENDING' || item.status === 'APPROVED') {
                  <div class="action-stack">
                    <input class="inline-input" [value]="draft(item.id).resolution_notes" (input)="setDraft(item.id, $any($event.target).value)" placeholder="Observación" />
                    <button class="btn-primary small" type="button" (click)="approve(item)">Aprobar</button>
                    <button class="btn-danger small" type="button" (click)="reject(item)">Rechazar</button>
                  </div>
                } @else {
                  <span class="muted">Sin acciones</span>
                }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="7"><div class="empty-state">No hay solicitudes de salón registradas.</div></td></tr>
          }
        </tbody>
      </table>
    </section>
  `,
  styles: [`
    .inline-input { min-width: 150px; padding: .55rem .65rem; border-radius: .65rem; border: 1px solid rgba(15,23,42,.12); }
    .action-stack { display:grid; gap:.45rem; min-width:180px; }
    .small { padding:.45rem .65rem; font-size:.85rem; }
    .status-pill { display:inline-block; padding:.35rem .65rem; border-radius:999px; font-weight:700; background:#eef2ff; color:#3730a3; }
    .status-pill.pending { background:#fef3c7; color:#92400e; }
    .status-pill.approved { background:#dcfce7; color:#166534; }
    .status-pill.rejected { background:#fee2e2; color:#991b1b; }
  `]
})
export class ClassroomRequestsComponent implements OnInit {
  private labsService = inject(LabsService);

  rows = signal<ClassroomUsage[]>([]);
  drafts = signal<Record<number, { resolution_notes: string }>>({});

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.labsService.listClassroomUsage(100).subscribe({
      next: res => {
        this.rows.set(res.results);
        const draftMap: Record<number, { resolution_notes: string }> = {};
        for (const item of res.results) {
          draftMap[item.id] = { resolution_notes: item.resolution_notes || '' };
        }
        this.drafts.set(draftMap);
      },
      error: error => alert(JSON.stringify(error.error || 'No se pudieron cargar las solicitudes de salón.')),
    });
  }

  draft(id: number) {
    return this.drafts()[id] || { resolution_notes: '' };
  }

  setDraft(id: number, value: string): void {
    this.drafts.update(current => ({
      ...current,
      [id]: { resolution_notes: value },
    }));
  }

  approve(item: ClassroomUsage): void {
    this.labsService.approveClassroomUsage(item.id, this.draft(item.id)).subscribe({
      next: () => this.reload(),
      error: error => alert(JSON.stringify(error.error || 'No se pudo aprobar la solicitud de salón.')),
    });
  }

  reject(item: ClassroomUsage): void {
    this.labsService.rejectClassroomUsage(item.id, this.draft(item.id)).subscribe({
      next: () => this.reload(),
      error: error => alert(JSON.stringify(error.error || 'No se pudo rechazar la solicitud de salón.')),
    });
  }

  labelFor(status: ClassroomUsage['status']): string {
    const labels = { PENDING: 'Pendiente', APPROVED: 'Aprobada', REJECTED: 'Rechazada' } as const;
    return labels[status] || status;
  }
}
