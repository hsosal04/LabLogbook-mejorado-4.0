import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { API_BASE_URL } from './api-base';
import { User } from '../models/models';

interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSignal = signal<User | null>(this.readStoredUser());
  currentUser = computed(() => this.currentUserSignal());
  isAuthenticated = computed(() => !!localStorage.getItem('access_token'));

  constructor(private http: HttpClient, private router: Router) {}

  login(payload: { username: string; password: string }) {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login/`, payload).pipe(
      tap((response) => {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSignal.set(response.user);
      })
    );
  }

  register(payload: Record<string, unknown>) {
    return this.http.post(`${API_BASE_URL}/auth/register/`, payload);
  }

  fetchMe() {
    return this.http.get<User>(`${API_BASE_URL}/auth/me/`).pipe(
      tap(user => {
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSignal.set(user);
      })
    );
  }

  changePassword(payload: { current_password: string; new_password: string; confirm_password: string }) {
    return this.http.post(`${API_BASE_URL}/auth/change-password/`, payload);
  }

  checkPasswordStrength(password: string) {
    return this.http.post<{ strength: 'DEBIL' | 'MEDIA' | 'ALTA' }>(`${API_BASE_URL}/auth/password-strength/`, { password });
  }

  forgotPassword(identifier: string) {
    return this.http.post<{ detail: string; debug_reset?: { uid: string; token: string } }>(`${API_BASE_URL}/auth/forgot-password/`, { identifier });
  }

  resetPassword(payload: { uid: string; token: string; new_password: string; confirm_password: string }) {
    return this.http.post(`${API_BASE_URL}/auth/reset-password/`, payload);
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) as User : null;
  }
}
