import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { LaboratoriesService } from '../../core/services/laboratories.service';
import { Laboratory } from '../../shared/models';

@Component({
  selector: 'app-laboratories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="page-title"><h2>Laboratorios</h2></div>
  <div class="grid grid-2">
    <div class="card">
      <h3>Registrar laboratorio</h3>
      <form [formGroup]="form" (ngSubmit)="create()" class="grid">
        <label>Código<input formControlName="code"></label>
        <label>Nombre<input formControlName="name"></label>
        <label>Ubicación<input formControlName="location"></label>
        <label>Capacidad<input type="number" formControlName="capacity"></label>
        <button class="primary">Guardar</button>
      </form>
    </div>
    <div class="card">
      <h3>Catálogo</h3>
      <table class="table">
        <thead><tr><th>Código</th><th>Nombre</th><th>Ubicación</th></tr></thead>
        <tbody>
          <tr *ngFor="let item of laboratories()">
            <td>{{ item.code }}</td>
            <td>{{ item.name }}</td>
            <td>{{ item.location }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  `
})
export class LaboratoriesComponent implements OnInit {
  laboratories = signal<Laboratory[]>([]);
  form = this.fb.group({ code: [''], name: [''], location: [''], capacity: [0] });

  constructor(private fb: FormBuilder, private service: LaboratoriesService) {}

  ngOnInit(): void { this.reload(); }

  reload(): void { this.service.list().subscribe((r) => this.laboratories.set(r.results)); }

  create(): void {
    this.service.create(this.form.getRawValue() as any).subscribe(() => {
      this.form.reset({ code: '', name: '', location: '', capacity: 0 });
      this.reload();
    });
  }
}
