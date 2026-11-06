import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from './api-base';
import { Attendance } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  constructor(private http: HttpClient) {}

  list(pageSize = 100) {
    const params = new HttpParams().set('page_size', String(pageSize));
    return this.http.get<{ count: number; results: Attendance[] }>(`${API_BASE_URL}/attendance/`, { params });
  }
  create(payload: Record<string, unknown>) { return this.http.post<Attendance>(`${API_BASE_URL}/attendance/`, payload); }
  close(id: number, exit_time: string) { return this.http.patch<Attendance>(`${API_BASE_URL}/attendance/${id}/close/`, { exit_time }); }
}
