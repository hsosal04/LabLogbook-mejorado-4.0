import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AttendancesService } from '../../core/services/attendances.service';
import { UsersService } from '../../core/services/users.service';
import { LaboratoriesService } from '../../core/services/laboratories.service';
import { Attendance, Laboratory, User } from '../../shared/models';

@Component({
  selector: 'app-attendances',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="page-title"><h2>Asistencias</h2></div>
  <div class="grid grid-2">
    <div class="card">
      <h3>Registro de entrada</h3>
      <form [formGroup]="form" (ngSubmit)="create()" class="grid">
        <label>Usuario
          <select formControlName="user">
            <option *ngFor="let item of users()" [value]="item.id">{{ item.email }}</option>
          </select>
        </label>
        <label>Laboratorio
          <select formControlName="laboratory">
            <option *ngFor="let item of laboratories()" [value]="item.id">{{ item.code }} - {{ item.name }}</option>
          </select>
        </label>
        <label>Entrada<input type="datetime-local" formControlName="check_in"></label>
        <label>Notas<textarea formControlName="notes"></textarea></label>
        <button class="primary">Abrir asistencia</button>
      </form>
    </div>
    <div class="card">
      <h3>Historial</h3>
      <table class="table">
        <thead><tr><th>Usuario</th><th>Lab</th><th>Entrada</th><th>Estatus</th></tr></thead>
        <tbody>
          <tr *ngFor="let item of attendances()">
            <td>{{ item.user_email }}</td>
            <td>{{ item.laboratory_code }}</td>
            <td>{{ item.check_in | date:'short' }}</td>
            <td>{{ item.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  `
})
export class AttendancesComponent implements OnInit {
  users = signal<User[]>([]);
  laboratories = signal<Laboratory[]>([]);
  attendances = signal<Attendance[]>([]);
  form = this.fb.group({ user: [''], laboratory: [''], check_in: [''], notes: [''] });

  constructor(
    private fb: FormBuilder,
    private attendancesService: AttendancesService,
    private usersService: UsersService,
    private laboratoriesService: LaboratoriesService,
  ) {}

  ngOnInit(): void { this.reload(); }

  reload(): void {
    this.usersService.list().subscribe((r) => this.users.set(r.results));
    this.laboratoriesService.list().subscribe((r) => this.laboratories.set(r.results));
    this.attendancesService.list().subscribe((r) => this.attendances.set(r.results));
  }

  create(): void {
    this.attendancesService.create({ ...this.form.getRawValue(), status: 'OPEN' } as any).subscribe(() => {
      this.reload();
    });
  }
}
