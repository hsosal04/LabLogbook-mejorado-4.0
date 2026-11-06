import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { Laboratory } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class LaboratoriesService {
  constructor(private http: HttpClient, private api: ApiService) {}

  list() {
    return this.http.get<{ results: Laboratory[] }>(`${this.api.baseUrl}/laboratories/`);
  }

  create(payload: Partial<Laboratory>) {
    return this.http.post<Laboratory>(`${this.api.baseUrl}/laboratories/`, payload);
  }
}
