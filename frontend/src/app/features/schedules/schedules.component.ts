import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LabsService } from '../../core/services/labs.service';
import { UsersService } from '../../core/services/users.service';
import { sanitizeValue } from '../../shared/form-validators';

interface ScheduleCellForm {
  weekday: string;
  time_slot: string;
  nrc: string;
  course_code: string;
  subject_name: string;
  section: string;
  professor_name: string;
  notes: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page-header card page-header-accent labs-theme">
      <div>
        <span class="badge badge-primary">Horarios de clase</span>
        <h1>Horario semanal de clases</h1>
        <p class="muted">Los administradores y supervisores pueden mantener el horario de clases por salón, periodo académico y bloque horario.</p>
      </div>
    </section>

    <section class="card page-section card-accent">
      <form [formGroup]="filters" class="grid grid-3" (ngSubmit)="loadSchedule()">
        <div>
          <label>Periodo</label>
          <input formControlName="period" placeholder="PRIMAVERA 2026" />
        </div>
        <div>
          <label>Salón</label>
          <select formControlName="lab">
            <option value="">Seleccione un salón</option>
            @for (lab of labs(); track lab.id) {
              <option [value]="lab.id">{{ lab.code }} · {{ lab.name }}</option>
            }
          </select>
        </div>
        <div class="actions" style="align-self:end; display:flex; gap:0.75rem;">
          <button class="btn-primary" type="submit" [disabled]="filters.invalid">Cargar horario</button>
          <button class="btn-secondary" type="button" (click)="clearGrid()">Limpiar cuadrícula</button>
          <button class="btn-secondary" type="button" (click)="saveAll()" [disabled]="filters.invalid">Guardar horario</button>
        </div>
      </form>
      <p class="muted" style="margin-top:0.75rem;">
        El lunes se captura en bloques de una hora. De martes a viernes se mantienen bloques de dos horas dentro de la misma plantilla semanal.
      </p>
      <datalist id="professor-list">
        @for (name of professorNames(); track name) {
          <option [value]="name"></option>
        }
      </datalist>
    </section>

    <section class="card table-wrap page-section card-glow">
      <div class="section-title-row">
        <div>
          <h2>Plantilla semanal</h2>
          <p class="muted">El lunes utiliza celdas de una hora. De martes a viernes se usan celdas de dos horas, siguiendo el formato solicitado por la facultad.</p>
        </div>
      </div>

      <div class="schedule-table-wrap">
        <table class="schedule-table">
          <thead>
            <tr>
              <th class="slot-col">Hora</th>
              @for (day of weekdays; track day.value) {
                <th>{{ day.label }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (hour of hourlySlots; track hour; let rowIndex = $index) {
              <tr>
                <th class="slot-col">{{ hour }}</th>

                <td>
                  <div class="schedule-cell monday-cell">
                    <input [value]="cellValue('MONDAY', hour, 'nrc')" (input)="updateCell('MONDAY', hour, 'nrc', $any($event.target).value)" placeholder="NRC" />
                    <input [value]="cellValue('MONDAY', hour, 'course_code')" (input)="updateCell('MONDAY', hour, 'course_code', $any($event.target).value)" placeholder="Clave de materia" />
                    <input [value]="cellValue('MONDAY', hour, 'subject_name')" (input)="updateCell('MONDAY', hour, 'subject_name', $any($event.target).value)" placeholder="Materia" />
                    <input [value]="cellValue('MONDAY', hour, 'section')" (input)="updateCell('MONDAY', hour, 'section', $any($event.target).value)" placeholder="Sección" />
                    <input [value]="cellValue('MONDAY', hour, 'professor_name')" (input)="updateCell('MONDAY', hour, 'professor_name', $any($event.target).value)" placeholder="Profesor" list="professor-list" />
                    <textarea [value]="cellValue('MONDAY', hour, 'notes')" (input)="updateCell('MONDAY', hour, 'notes', $any($event.target).value)" placeholder="Notas"></textarea>
                  </div>
                </td>

                @for (day of twoHourWeekdays; track day.value) {
                  @if (isTwoHourStart(rowIndex)) {
                    <td [attr.rowspan]="2">
                      <div class="schedule-cell two-hour-cell">
                        <input [value]="cellValue(day.value, slotForTwoHourRow(rowIndex), 'nrc')" (input)="updateCell(day.value, slotForTwoHourRow(rowIndex), 'nrc', $any($event.target).value)" placeholder="NRC" />
                        <input [value]="cellValue(day.value, slotForTwoHourRow(rowIndex), 'course_code')" (input)="updateCell(day.value, slotForTwoHourRow(rowIndex), 'course_code', $any($event.target).value)" placeholder="Clave de materia" />
                        <input [value]="cellValue(day.value, slotForTwoHourRow(rowIndex), 'subject_name')" (input)="updateCell(day.value, slotForTwoHourRow(rowIndex), 'subject_name', $any($event.target).value)" placeholder="Materia" />
                        <input [value]="cellValue(day.value, slotForTwoHourRow(rowIndex), 'section')" (input)="updateCell(day.value, slotForTwoHourRow(rowIndex), 'section', $any($event.target).value)" placeholder="Sección" />
                        <input [value]="cellValue(day.value, slotForTwoHourRow(rowIndex), 'professor_name')" (input)="updateCell(day.value, slotForTwoHourRow(rowIndex), 'professor_name', $any($event.target).value)" placeholder="Profesor" list="professor-list" />
                        <textarea [value]="cellValue(day.value, slotForTwoHourRow(rowIndex), 'notes')" (input)="updateCell(day.value, slotForTwoHourRow(rowIndex), 'notes', $any($event.target).value)" placeholder="Notas"></textarea>
                      </div>
                    </td>
                  }
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    .grid-3 { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
    .schedule-table-wrap { overflow-x: auto; }
    .schedule-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 1280px; }
    .schedule-table th, .schedule-table td { border: 1px solid rgba(55, 72, 108, 0.12); vertical-align: top; }
    .schedule-table thead th { background: rgba(122, 110, 240, 0.10); padding: 0.85rem; font-weight: 700; }
    .slot-col { width: 120px; min-width: 120px; text-align: center; }
    .schedule-table tbody th { background: rgba(15, 32, 69, 0.04); padding: 0.75rem; }
    .schedule-cell { display: grid; gap: 0.35rem; padding: 0.45rem; box-sizing: border-box; }
    .monday-cell { min-height: 150px; }
    .two-hour-cell { min-height: 300px; }
    .schedule-cell input, .schedule-cell textarea { width: 100%; box-sizing: border-box; font-size: 0.82rem; }
    .schedule-cell textarea { min-height: 52px; resize: vertical; }
    @media (max-width: 1100px) { .grid-3 { grid-template-columns: 1fr; } }
  `]
})
export class SchedulesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private labsService = inject(LabsService);
  private usersService = inject(UsersService);

  labs = signal<any[]>([]);
  rows = signal<ScheduleCellForm[]>([]);
  professorNames = signal<string[]>([]);

  readonly weekdays = [
    { value: 'MONDAY', label: 'Lunes' },
    { value: 'TUESDAY', label: 'Martes' },
    { value: 'WEDNESDAY', label: 'Miércoles' },
    { value: 'THURSDAY', label: 'Jueves' },
    { value: 'FRIDAY', label: 'Viernes' },
  ];

  readonly twoHourWeekdays = this.weekdays.filter(day => day.value !== 'MONDAY');

  readonly hourlySlots = [
    '07:00-07:59',
    '08:00-08:59',
    '09:00-09:59',
    '10:00-10:59',
    '11:00-11:59',
    '12:00-12:59',
    '13:00-13:59',
    '14:00-14:59',
    '15:00-15:59',
    '16:00-16:59',
    '17:00-17:59',
    '18:00-18:59',
    '19:00-19:59',
    '20:00-20:59',
  ];

  readonly mondaySlots = [...this.hourlySlots];

  readonly twoHourSlots = [
    '07:00-08:59',
    '09:00-10:59',
    '11:00-12:59',
    '13:00-14:59',
    '15:00-16:59',
    '17:00-18:59',
    '19:00-20:59',
  ];

  filters = this.fb.group({
    period: ['PRIMAVERA 2026', Validators.required],
    lab: ['', Validators.required],
  });

  ngOnInit(): void {
    this.seedBlankGrid();
    this.usersService.listProfessors().subscribe({
      next: (res) => {
        const names = res
          .map(user => `${user.first_name || ''} ${user.last_name || ''}`.trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        this.professorNames.set(names);
      },
      error: () => this.professorNames.set([]),
    });
    this.labsService.listLabs().subscribe({
      next: (res) => {
        this.labs.set(res.results);
        if (!this.filters.controls.lab.value && res.results.length) {
          this.filters.controls.lab.setValue(String(res.results[0].id));
          this.loadSchedule();
        }
      },
      error: (error) => alert(JSON.stringify(error.error || 'No se pudieron cargar los salones.')),
    });
  }

  private seedBlankGrid(): void {
    const cells: ScheduleCellForm[] = [];

    for (const slot of this.mondaySlots) {
      cells.push({
        weekday: 'MONDAY',
        time_slot: slot,
        nrc: '',
        course_code: '',
        subject_name: '',
        section: '',
        professor_name: '',
        notes: '',
      });
    }

    for (const slot of this.twoHourSlots) {
      for (const day of this.twoHourWeekdays) {
        cells.push({
          weekday: day.value,
          time_slot: slot,
          nrc: '',
          course_code: '',
          subject_name: '',
          section: '',
          professor_name: '',
          notes: '',
        });
      }
    }

    this.rows.set(cells);
  }

  loadSchedule(): void {
    if (this.filters.invalid) return;
    this.seedBlankGrid();
    const { lab, period } = this.filters.getRawValue();
    this.labsService.listClassSchedules(lab || '', period || '').subscribe({
      next: (res) => {
        const mapped = [...this.rows()];
        for (const item of res.results) {
          const idx = mapped.findIndex(cell => cell.weekday === item.weekday && cell.time_slot === item.time_slot);
          if (idx >= 0) {
            mapped[idx] = {
              weekday: item.weekday,
              time_slot: item.time_slot,
              nrc: item.nrc || '',
              course_code: item.course_code || '',
              subject_name: item.subject_name || '',
              section: item.section || '',
              professor_name: item.professor_name || '',
              notes: item.notes || '',
            };
          }
        }
        this.rows.set(mapped);
      },
      error: (error) => alert(JSON.stringify(error.error || 'No se pudo cargar el horario.')),
    });
  }

  clearGrid(): void {
    this.seedBlankGrid();
  }

  isTwoHourStart(rowIndex: number): boolean {
    return rowIndex % 2 === 0;
  }

  slotForTwoHourRow(rowIndex: number): string {
    return this.twoHourSlots[Math.floor(rowIndex / 2)] || this.twoHourSlots[0];
  }

  cellValue(weekday: string, timeSlot: string, field: keyof ScheduleCellForm): string {
    return this.rows().find(cell => cell.weekday === weekday && cell.time_slot === timeSlot)?.[field] || '';
  }

  updateCell(weekday: string, timeSlot: string, field: keyof ScheduleCellForm, value: string): void {
    const normalized = this.normalizeScheduleValue(field, value);
    const next = this.rows().map(cell => {
      if (cell.weekday === weekday && cell.time_slot === timeSlot) {
        return { ...cell, [field]: normalized };
      }
      return cell;
    });
    this.rows.set(next);
  }


  private normalizeScheduleValue(field: keyof ScheduleCellForm, value: string): string {
    switch (field) {
      case 'nrc':
        return sanitizeValue('nrc', value);
      case 'course_code':
        return sanitizeValue('courseCode', value);
      case 'section':
        return sanitizeValue('section', value);
      case 'professor_name':
        return sanitizeValue('professorName', value);
      case 'subject_name':
        return sanitizeValue('text', value).slice(0, 160);
      case 'notes':
        return sanitizeValue('textarea', value);
      default:
        return value;
    }
  }

  saveAll(): void {
    if (this.filters.invalid) return;
    const { lab, period } = this.filters.getRawValue();
    this.labsService.bulkUpsertSchedules({
      lab: Number(lab),
      period,
      items: this.rows(),
    }).subscribe({
      next: () => {
        alert('El horario se guardó correctamente.');
        this.loadSchedule();
      },
      error: (error) => alert(JSON.stringify(error.error || 'No se pudo guardar el horario.')),
    });
  }
}
