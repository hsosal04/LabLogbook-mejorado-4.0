import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api-base';
import { ClassSchedule } from '../models/models';

@Injectable({ providedIn: 'root' })
export class SchedulesService {
  constructor(private http: HttpClient) {}

  list(labId?: number | string, period?: string) {
    const params = new URLSearchParams();
    if (labId) params.set('lab', String(labId));
    if (period) params.set('period', period);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return this.http.get<{ results: ClassSchedule[] }>(`${API_BASE_URL}/labs/class-schedules/${suffix}`);
  }

  bulkUpsert(payload: Record<string, unknown>) {
    return this.http.post<ClassSchedule[]>(`${API_BASE_URL}/labs/class-schedules/bulk_upsert/`, payload);
  }
}
