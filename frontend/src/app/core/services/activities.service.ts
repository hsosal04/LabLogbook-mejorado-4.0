import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from './api-base';
import { Activity } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ActivitiesService {
  constructor(private http: HttpClient) {}

  list(pageSize = 100) {
    const params = new HttpParams().set('page_size', String(pageSize));
    return this.http.get<{ count: number; results: Activity[] }>(`${API_BASE_URL}/activities/`, { params });
  }

  create(payload: Record<string, unknown>) { return this.http.post<Activity>(`${API_BASE_URL}/activities/`, payload); }
  close(id: number) { return this.http.patch<Activity>(`${API_BASE_URL}/activities/${id}/close/`, {}); }
  attend(id: number) { return this.http.patch<Activity>(`${API_BASE_URL}/activities/${id}/attend/`, {}); }
}
