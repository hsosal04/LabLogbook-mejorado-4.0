import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Activity } from '../../core/models/models';
import { ActivitiesService } from '../../core/services/activities.service';
import { AuthService } from '../../core/services/auth.service';
import { LabsService } from '../../core/services/labs.service';
import { PATTERNS, sanitizeValue } from '../../shared/form-validators';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page-header card page-header-accent activities-theme">
      <div>
        <span class="badge badge-primary">Actividades</span>
        <h1>{{ isProfessor() ? 'Solicitudes del profesor' : 'Registro de ingreso de alumnos' }}</h1>
        <p class="muted">El flujo permite registrar actividades académicas y mantener evidencia de uso de espacios de acuerdo con el rol asignado.</p>
      </div>
    </section>

    <section class="grid grid-2 page-section">
      <div class="card card-accent">
        <h2>{{ isProfessor() ? 'Nueva solicitud' : 'Nuevo ingreso' }}</h2>
        <form [formGroup]="form" (ngSubmit)="create()" class="grid grid-2">
          <div><label>Matrícula</label><input formControlName="student_code" (input)="sanitize('student_code','studentCode')" /></div>
          <div><label>Nombre</label><input formControlName="first_name" (input)="sanitize('first_name','name')" /></div>
          <div><label>Apellidos</label><input formControlName="last_name" (input)="sanitize('last_name','name')" /></div>
          <div><label>Laboratorio / salón</label><select formControlName="lab"><option value="">Seleccione un espacio</option>@for (lab of labs(); track lab.id) { <option [value]="lab.id">{{ lab.code }} · {{ lab.name }}</option> }</select></div>
          @if (isProfessor()) {
            <div><label>Materia</label><input formControlName="subject_name" (input)="sanitize('subject_name','text')" /></div>
            <div><label>NRC</label><input formControlName="nrc" maxlength="6" (input)="sanitize('nrc','nrc')" /></div>
            <div><label>Hora de la clase</label><input formControlName="class_time" /></div>
          } @else {
            <div style="grid-column:1/-1;"><label>Descripción</label><textarea formControlName="description" (input)="sanitize('description','textarea')"></textarea></div>
          }
          <button class="btn-primary" style="grid-column:1/-1;">{{ isProfessor() ? 'Enviar solicitud' : 'Registrar ingreso' }}</button>
        </form>
      </div>
      <div class="card table-wrap card-glow">
        <div class="section-title-row"><div><h2>Registros</h2><p class="muted">Se muestran los registros más recientes con acciones contextuales.</p></div><button class="btn-secondary" type="button" (click)="reload()">Actualizar</button></div>
        <table>
          <thead><tr><th>Tipo</th><th>Persona</th><th>Espacio</th><th>Detalle</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            @for (item of rows(); track item.id) {
              <tr>
                <td>{{ item.record_type }}</td>
                <td>{{ item.full_name }}<br><small>{{ item.student_code }}</small></td>
                <td>{{ item.lab_name }}</td>
                <td>{{ item.record_type === 'PROFESSOR_REQUEST' ? (item.subject_name + ' · NRC ' + item.nrc + ' · ' + item.class_time) : item.description }}</td>
                <td>{{ item.status }}</td>
                <td>
                  @if (!isProfessor() && item.record_type === 'STUDENT_ENTRY' && item.status === 'OPEN') { <button class="btn-secondary" type="button" (click)="close(item.id)">Registrar salida</button> }
                  @if (!isProfessor() && item.record_type === 'PROFESSOR_REQUEST' && item.status === 'PENDING') { <button class="btn-primary" type="button" (click)="attend(item.id)">Atender</button> }
                </td>
              </tr>
            } @empty { <tr><td colspan="6"><div class="empty-state">Aún no hay registros disponibles.</div></td></tr> }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class ActivitiesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private activitiesService = inject(ActivitiesService);
  private labsService = inject(LabsService);
  role = this.auth.currentUser()?.role || 'STUDENT';
  isProfessor = signal(this.role === 'PROFESSOR');
  rows = signal<Activity[]>([]);
  labs = signal<any[]>([]);

  form = this.fb.group({
    student_code: ['', [Validators.required, Validators.pattern(PATTERNS.studentCode)]],
    first_name: ['', [Validators.required, Validators.pattern(PATTERNS.name)]],
    last_name: ['', [Validators.required, Validators.pattern(PATTERNS.name)]],
    lab: ['', Validators.required],
    description: [''],
    subject_name: [''],
    nrc: [''],
    class_time: [''],
  });

  ngOnInit(): void {
    this.reload();
    this.labsService.listLabs(100).subscribe(res => this.labs.set(res.results));
    if (this.isProfessor()) {
      const user = this.auth.currentUser();
      this.form.patchValue({ student_code: user?.student_code || '', first_name: user?.first_name || '', last_name: user?.last_name || '' });
    }
  }

  reload(): void { this.activitiesService.list(100).subscribe(res => this.rows.set(res.results)); }
  create(): void {
    const payload: any = {
      ...this.form.getRawValue(),
      record_type: this.isProfessor() ? 'PROFESSOR_REQUEST' : 'STUDENT_ENTRY',
      activity_date: new Date().toISOString().slice(0, 10),
    };
    this.activitiesService.create(payload).subscribe({
      next: () => {
        this.reload();
        if (!this.isProfessor()) {
          this.form.patchValue({ student_code: '', first_name: '', last_name: '', lab: '', description: '' });
        } else {
          this.form.patchValue({ subject_name: '', nrc: '', class_time: '' });
        }
      },
      error: error => {
        const detail = error?.error && typeof error.error === 'object'
          ? Object.entries(error.error).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')
          : 'No se pudo guardar el registro.';
        alert(detail);
      }
    });
  }
  close(id: number): void { this.activitiesService.close(id).subscribe(() => this.reload()); }
  attend(id: number): void { this.activitiesService.attend(id).subscribe(() => this.reload()); }
  sanitize(controlName: string, kind: 'studentCode' | 'name' | 'text' | 'textarea' | 'nrc') { const control = this.form.get(controlName); if (control) control.setValue(sanitizeValue(kind as any, control.value || ''), { emitEvent: false }); }
}
