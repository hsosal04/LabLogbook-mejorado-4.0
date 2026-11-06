import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from './api-base';
import { ClassSchedule, ClassroomUsage, ComputerUsageRequest, Lab, WeeklyAvailability } from '../models/models';

@Injectable({ providedIn: 'root' })
export class LabsService {
  constructor(private http: HttpClient) {}

  listLabs(pageSize = 100) {
    const params = new HttpParams().set('page_size', String(pageSize));
    return this.http.get<{ count: number; results: Lab[] }>(`${API_BASE_URL}/labs/`, { params });
  }
  createLab(payload: Record<string, unknown>) { return this.http.post<Lab>(`${API_BASE_URL}/labs/`, payload); }
  updateLab(id: number, payload: Record<string, unknown>) { return this.http.patch<Lab>(`${API_BASE_URL}/labs/${id}/`, payload); }

  listClassroomUsage(pageSize = 100) {
    const params = new HttpParams().set('page_size', String(pageSize));
    return this.http.get<{ count: number; results: ClassroomUsage[] }>(`${API_BASE_URL}/labs/classroom-usage/`, { params });
  }
  createClassroomUsage(payload: Record<string, unknown>) { return this.http.post<ClassroomUsage>(`${API_BASE_URL}/labs/classroom-usage/`, payload); }
  getWeeklyAvailability(labId: number | string, weekStart: string) {
    const params = new HttpParams().set('lab', String(labId)).set('week_start', weekStart);
    return this.http.get<WeeklyAvailability>(`${API_BASE_URL}/labs/classroom-usage/availability/`, { params });
  }
  approveClassroomUsage(id: number, payload: Record<string, unknown> = {}) { return this.http.post<ClassroomUsage>(`${API_BASE_URL}/labs/classroom-usage/${id}/approve/`, payload); }
  rejectClassroomUsage(id: number, payload: Record<string, unknown> = {}) { return this.http.post<ClassroomUsage>(`${API_BASE_URL}/labs/classroom-usage/${id}/reject/`, payload); }


  listComputerRequests(pageSize = 100) {
    const params = new HttpParams().set('page_size', String(pageSize));
    return this.http.get<{ count: number; results: ComputerUsageRequest[] }>(`${API_BASE_URL}/labs/computer-requests/`, { params });
  }
  createComputerRequest(payload: Record<string, unknown>) {
    return this.http.post<ComputerUsageRequest>(`${API_BASE_URL}/labs/computer-requests/`, payload);
  }
  approveComputerRequest(id: number, payload: Record<string, unknown>) {
    return this.http.post<ComputerUsageRequest>(`${API_BASE_URL}/labs/computer-requests/${id}/approve/`, payload);
  }
  rejectComputerRequest(id: number, payload: Record<string, unknown>) {
    return this.http.post<ComputerUsageRequest>(`${API_BASE_URL}/labs/computer-requests/${id}/reject/`, payload);
  }
  completeComputerRequest(id: number) {
    return this.http.post<ComputerUsageRequest>(`${API_BASE_URL}/labs/computer-requests/${id}/complete/`, {});
  }
  cancelComputerRequest(id: number) {
    return this.http.post<ComputerUsageRequest>(`${API_BASE_URL}/labs/computer-requests/${id}/cancel/`, {});
  }

  listClassSchedules(labId: number | string, period: string, pageSize = 100) {
    const params = new HttpParams()
      .set('lab', String(labId))
      .set('period', period)
      .set('page_size', String(pageSize));
    return this.http.get<{ count: number; results: ClassSchedule[] }>(`${API_BASE_URL}/labs/class-schedules/`, { params });
  }
  bulkUpsertSchedules(payload: Record<string, unknown>) {
    return this.http.post<ClassSchedule[]>(`${API_BASE_URL}/labs/class-schedules/bulk_upsert/`, payload);
  }
}
