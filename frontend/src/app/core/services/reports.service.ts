import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from './api-base';
import { IncidentReport } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  constructor(private http: HttpClient) {}

  attendanceByLab(filters: Record<string, string>) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params = params.set(key, value); });
    return this.http.get<{ count: number; total_minutes: number; results: unknown[] }>(`${API_BASE_URL}/reports/attendance-by-lab/`, { params });
  }

  utilization() {
    return this.http.get<{ results: unknown[] }>(`${API_BASE_URL}/reports/utilization/`);
  }

  listIncidents(pageSize = 100) {
    const params = new HttpParams().set('page_size', String(pageSize));
    return this.http.get<{ count: number; results: IncidentReport[] }>(`${API_BASE_URL}/reports/incidents/`, { params });
  }

  createIncident(payload: Record<string, unknown>) {
    return this.http.post<IncidentReport>(`${API_BASE_URL}/reports/incidents/`, payload);
  }

  updateIncidentStatus(id: number, status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED') {
    return this.http.post<IncidentReport>(`${API_BASE_URL}/reports/incidents/${id}/status/`, { status });
  }
}
