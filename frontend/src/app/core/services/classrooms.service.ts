import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { Classroom, ClassroomUsage } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ClassroomsService {
  constructor(private http: HttpClient, private api: ApiService) {}

  list() {
    return this.http.get<{ results: Classroom[] }>(`${this.api.baseUrl}/classrooms/`);
  }

  create(payload: Partial<Classroom>) {
    return this.http.post<Classroom>(`${this.api.baseUrl}/classrooms/`, payload);
  }

  listUsages() {
    return this.http.get<{ results: ClassroomUsage[] }>(`${this.api.baseUrl}/classroom-usages/`);
  }

  createUsage(payload: Partial<ClassroomUsage>) {
    return this.http.post<ClassroomUsage>(`${this.api.baseUrl}/classroom-usages/`, payload);
  }
}
