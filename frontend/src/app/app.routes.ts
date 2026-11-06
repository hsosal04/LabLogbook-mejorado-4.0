import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/app-shell.component').then(m => m.AppShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'activities', canActivate: [roleGuard], data: { roles: ['ADMIN', 'SUPERVISOR'] }, loadComponent: () => import('./features/activities/activities.component').then(m => m.ActivitiesComponent) },
      { path: 'reports', canActivate: [roleGuard], data: { roles: ['ADMIN', 'SUPERVISOR'] }, loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent) },
      { path: 'classrooms', canActivate: [roleGuard], data: { roles: ['PROFESSOR'] }, loadComponent: () => import('./features/classrooms/classrooms.component').then(m => m.ClassroomsComponent) },
      { path: 'classroom-requests', canActivate: [roleGuard], data: { roles: ['ADMIN', 'SUPERVISOR'] }, loadComponent: () => import('./features/classroom-requests/classroom-requests.component').then(m => m.ClassroomRequestsComponent) },
      { path: 'computers', canActivate: [roleGuard], data: { roles: ['ADMIN', 'SUPERVISOR', 'STUDENT'] }, loadComponent: () => import('./features/computer-requests/computer-requests.component').then(m => m.ComputerRequestsComponent) },
      { path: 'labs', canActivate: [roleGuard], data: { roles: ['ADMIN', 'SUPERVISOR'] }, loadComponent: () => import('./features/labs/labs.component').then(m => m.LabsComponent) },
      { path: 'schedules', canActivate: [roleGuard], data: { roles: ['ADMIN', 'SUPERVISOR'] }, loadComponent: () => import('./features/schedules/schedules.component').then(m => m.SchedulesComponent) },
      { path: 'users', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent) },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./shared/not-found.component').then(m => m.NotFoundComponent),
  },
];
