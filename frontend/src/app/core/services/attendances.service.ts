import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { Attendance } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class AttendancesService {
  constructor(private http: HttpClient, private api: ApiService) {}

  list() {
    return this.http.get<{ results: Attendance[] }>(`${this.api.baseUrl}/attendances/`);
  }

  create(payload: Partial<Attendance>) {
    return this.http.post<Attendance>(`${this.api.baseUrl}/attendances/`, payload);
  }

  close(id: number, check_out: string) {
    return this.http.patch<Attendance>(`${this.api.baseUrl}/attendances/${id}/close/`, { check_out });
  }
}
