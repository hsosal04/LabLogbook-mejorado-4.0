import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">

      <!-- Menú lateral -->
      <aside
        class="sidebar"
        [class.mobile-open]="mobileMenuOpen()"
      >

        <div class="brand-block">
          <div class="brand-mark brand-mark-image">
            <img
              src="/assets/images/fcc-logo.png"
              alt="FCC BUAP"
            />
          </div>

          <div>
            <h2>LabLogbook</h2>
            <p class="muted-light">
              Bitácoras, salones y recursos académicos.
            </p>
          </div>
        </div>

        <nav>

          <a
            routerLink="/app/dashboard"
            routerLinkActive="active"
            (click)="closeMobileMenu()"
          >
            Panel principal
          </a>

          <a
            routerLink="/app/profile"
            routerLinkActive="active"
            (click)="closeMobileMenu()"
          >
            Perfil
          </a>

          @if (
            currentUser()?.role === 'ADMIN' ||
            currentUser()?.role === 'SUPERVISOR'
          ) {
            <a
              routerLink="/app/activities"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
            >
              Actividades
            </a>
          }

          @if (currentUser()?.role === 'PROFESSOR') {
            <a
              routerLink="/app/classrooms"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
            >
              Reservar salón
            </a>
          }

          @if (currentUser()?.role === 'STUDENT') {
            <a
              routerLink="/app/computers"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
            >
              Solicitar equipo de cómputo
            </a>
          }

          @if (
            currentUser()?.role === 'ADMIN' ||
            currentUser()?.role === 'SUPERVISOR'
          ) {
            <a
              routerLink="/app/computers"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
            >
              Solicitudes de equipo de cómputo
            </a>
          }

          @if (
            currentUser()?.role === 'ADMIN' ||
            currentUser()?.role === 'SUPERVISOR'
          ) {
            <a
              routerLink="/app/classroom-requests"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
            >
              Solicitudes de salón
            </a>
          }

          @if (
            currentUser()?.role === 'ADMIN' ||
            currentUser()?.role === 'SUPERVISOR'
          ) {

            <a
              routerLink="/app/reports"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
            >
              Reportes
            </a>

            <a
              routerLink="/app/labs"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
            >
              Laboratorios
            </a>

            <a
              routerLink="/app/schedules"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
            >
              Horarios de clase
            </a>

          }

          @if (currentUser()?.role === 'ADMIN') {
            <a
              routerLink="/app/users"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
            >
              Usuarios
            </a>
          }

        </nav>

        <div class="sidebar-footer card-dark">

          <div class="sidebar-footer-label">
            Sesión actual
          </div>

          <strong>
            {{ currentUser()?.first_name || currentUser()?.username }}
          </strong>

          <div class="muted-light">
            {{ currentUser()?.role }}
          </div>

        </div>

      </aside>

      <!-- Fondo que aparece detrás del menú en móvil -->
      @if (mobileMenuOpen()) {
        <div
          class="mobile-menu-backdrop"
          (click)="closeMobileMenu()"
        ></div>
      }

      <!-- Contenido principal -->
      <main class="content">

        <div class="topbar glass-card">

          <!-- Botón móvil -->
          <button
            type="button"
            class="mobile-menu-toggle"
            aria-label="Abrir menú"
            aria-controls="main-navigation"
            [attr.aria-expanded]="mobileMenuOpen()"
            (click)="toggleMobileMenu()"
          >
            <span class="menu-icon">
              ☰
            </span>
          </button>

          <div class="topbar-user">

            <div class="eyebrow">
              Gestión digital
            </div>

            <strong>
              {{ currentUser()?.first_name || currentUser()?.username }}
            </strong>

          </div>

          <button
            class="btn-secondary logout-button"
            type="button"
            (click)="logout()"
          >
            Cerrar sesión
          </button>

        </div>

        <router-outlet />

      </main>

    </div>
  `,
})
export class AppShellComponent {

  private auth = inject(AuthService);

  currentUser = this.auth.currentUser;

  mobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(open => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.closeMobileMenu();
    this.auth.logout();
  }
}