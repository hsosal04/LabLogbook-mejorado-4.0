import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero hero-gradient">
      <div class="hero-card hero-shell">
        <div class="card hero-main-card">
          <span class="badge badge-primary">Prototipo funcional de tesis</span>
          <h1>LabLogbook</h1>
          <p class="muted hero-copy">
            Gestión digital de bitácoras, asistencias, actividades, percances, laboratorios, salones y solicitudes académicas con control por roles.
          </p>
          <div class="actions">
            <a routerLink="/login" class="btn-primary">Iniciar sesión</a>
            <a routerLink="/register" class="btn-secondary">Registrarse</a>
          </div>
          <div class="hero-stats">
            <div class="stat-pill"><span class="stat-label">Roles</span><strong>4</strong></div>
            <div class="stat-pill"><span class="stat-label">Módulos</span><strong>6+</strong></div>
            <div class="stat-pill"><span class="stat-label">Enfoque</span><strong>Control</strong></div>
          </div>
        </div>

        <div class="card hero-side-card">
          <h3>Fortalezas operativas</h3>
          <ul class="feature-list">
            <li>Control por roles: Administrador, Supervisor, Profesor y Alumno.</li>
            <li>Solicitudes de salón para profesores y solicitudes de equipo de cómputo para alumnos.</li>
            <li>Registro y seguimiento de actividades, asistencias y percances.</li>
            <li>Validación de horarios para reducir empalmes en laboratorios y salones.</li>
            <li>Reportes operativos para apoyar la supervisión institucional.</li>
          </ul>
        </div>
      </div>
    </section>
  `,
})
export class LandingComponent {}
