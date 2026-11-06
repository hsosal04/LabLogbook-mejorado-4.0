import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ActivitiesService } from '../../core/services/activities.service';
import { LabsService } from '../../core/services/labs.service';
import { ReportsService } from '../../core/services/reports.service';

@Component({
  standalone: true,
  template: `
    <section class="dashboard-hero card page-header-accent">
      <div>
        <span class="badge badge-primary">Panel principal</span>
        <h1>Bienvenido, {{ user()?.first_name || user()?.username }}</h1>
        <p class="muted">Panel de consulta para la gestión de laboratorios, salones, actividades, percances y solicitudes académicas.</p>
      </div>
    </section>

    <section class="dashboard-grid page-section">
      <div class="metric-card activities-gradient"><div class="metric-label">Actividades</div><div class="metric-value">{{ activityCount() }}</div></div>
      <div class="metric-card labs-gradient"><div class="metric-label">Laboratorios</div><div class="metric-value">{{ labCount() }}</div></div>
      <div class="metric-card reports-gradient"><div class="metric-label">Solicitudes</div><div class="metric-value">{{ requestCount() }}</div></div>
      @if (showFourthCard()) { <div class="metric-card attendance-gradient"><div class="metric-label">Percances</div><div class="metric-value">{{ incidentCount() }}</div></div> }
    </section>
  `,
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private activitiesService = inject(ActivitiesService);
  private labsService = inject(LabsService);
  private reportsService = inject(ReportsService);
  user = this.auth.currentUser;
  activityCount = signal(0);
  labCount = signal(0);
  requestCount = signal(0);
  incidentCount = signal(0);
  showFourthCard = signal(['ADMIN', 'SUPERVISOR'].includes(this.user()?.role || ''));

  ngOnInit(): void {
    this.activitiesService.list(100).subscribe(res => this.activityCount.set(res.count ?? res.results.length));
    this.labsService.listLabs(100).subscribe(res => this.labCount.set(res.count ?? res.results.length));
    this.labsService.listClassroomUsage(100).subscribe({ next: res => this.requestCount.set(res.count ?? res.results.length), error: () => this.requestCount.set(0) });
    if (this.showFourthCard()) this.reportsService.listIncidents(100).subscribe({ next: res => this.incidentCount.set(res.count ?? res.results.length), error: () => this.incidentCount.set(0) });
  }
}
