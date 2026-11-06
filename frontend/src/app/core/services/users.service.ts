import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from './api-base';
import { User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private http: HttpClient) {}

  list(options?: { pageSize?: number; search?: string; role?: string; status?: string }) {
    let params = new HttpParams().set('page_size', String(options?.pageSize ?? 100));
    if (options?.search) params = params.set('search', options.search);
    if (options?.role) params = params.set('role', options.role);
    if (options?.status) params = params.set('status', options.status);
    return this.http.get<{ count: number; results: User[] }>(`${API_BASE_URL}/users/`, { params });
  }

  listProfessors() { return this.http.get<User[]>(`${API_BASE_URL}/users/professors/`); }
  create(payload: Record<string, unknown>) { return this.http.post<User>(`${API_BASE_URL}/users/`, payload); }
  update(id: number, payload: Record<string, unknown>) { return this.http.patch<User>(`${API_BASE_URL}/users/${id}/`, payload); }
  toggleStatus(id: number) { return this.http.patch<User>(`${API_BASE_URL}/users/${id}/toggle_status/`, {}); }
}
