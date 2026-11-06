import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { LabsService } from '../../core/services/labs.service';
import { AvailabilityCell, AvailabilityDay } from '../../core/models/models';
import { PATTERNS, sanitizeValue } from '../../shared/form-validators';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
    <section class="page-header card page-header-accent classrooms-theme">
      <div>
        <span class="badge badge-primary">Reservar salón</span>
        <h1>Solicitud de cambio o uso de salón</h1>
        <p class="muted">El profesor puede generar solicitudes de salón de lunes a viernes, dentro de la semana actual, seleccionando hora de inicio y hora de término entre 07:00 y 19:00. La solicitud queda pendiente hasta que el administrador o supervisor la autorice.</p>
      </div>
    </section>

    <section class="grid grid-2 page-section">
      <div class="card card-accent reservation-card">
        <h2>Nueva solicitud</h2>
        <form [formGroup]="form" (ngSubmit)="create()" class="reservation-form">
          <div><label>Matrícula</label><input [value]="currentUser()?.student_code" disabled /></div>
          <div><label>Nombre completo</label><input [value]="fullName()" disabled /></div>
          <div>
            <label>Laboratorio o salón</label>
            <select formControlName="lab" (change)="onLabChange()">
              <option value="">Seleccione un espacio</option>
              @for (lab of labs(); track lab.id) {
                <option [value]="lab.id">{{ lab.code }} · {{ lab.name }} · {{ lab.available_computers ?? 0 }} computadoras</option>
              }
            </select>
          </div>
          <div><label>Materia</label><input formControlName="subject" (input)="sanitize('subject','text')" /></div>
          <div>
            <label>Fecha seleccionada</label>
            <select formControlName="request_date" (change)="onReservationDateChange()">
              <option value="">Seleccione fecha</option>
              @for (day of availabilityDays(); track day.date) {
                <option [value]="day.date">{{ formatDayOption(day.date) }}</option>
              }
            </select>
          </div>
          <div>
            <label>Hora de inicio</label>
            <select formControlName="selected_slot" (change)="onReservationTimeChange()">
              <option value="">Seleccione hora de inicio</option>
              @for (time of startTimeOptions(); track time) {
                <option [value]="time">{{ time }}</option>
              }
            </select>
          </div>
          <div>
            <label>Hora de término</label>
            <select formControlName="end_slot" (change)="onReservationEndTimeChange()">
              <option value="">Seleccione hora de término</option>
              @for (end of endTimeOptions(); track end) {
                <option [value]="end">{{ end }}</option>
              }
            </select>
          </div>
          <div style="grid-column:1/-1;"><label>Observaciones</label><textarea formControlName="notes" (input)="sanitize('notes','textarea')"></textarea></div>
          <button class="btn-primary" type="submit" [disabled]="form.invalid || !selectedCell()">Enviar solicitud</button>
        </form>
        <p class="muted helper-text">Seleccione fecha, hora de inicio y hora de término disponibles de lunes a viernes.</p>
      </div>

      <div class="card card-glow calendar-card">
        <div class="section-title-row compact">
          <div>
            <h2>Semana laboral habilitada</h2>
            <p class="muted">Solo se habilitan días hábiles de la semana actual para generar la solicitud.</p>
          </div>
        </div>

        <div class="mini-calendar">
          <div class="mini-calendar__header">{{ currentMonthLabel() }}</div>
          <div class="mini-calendar__weekdays">
            @for (label of weekdayShortLabels; track label) {
              <span>{{ label }}</span>
            }
          </div>
          <div class="mini-calendar__grid">
            @for (item of calendarDays(); track item.date) {
              <button
                type="button"
                class="mini-calendar__day"
                [class.muted]="!item.inCurrentMonth"
                [class.current-week]="item.inCurrentWeek"
                [class.today]="item.isToday"
                [disabled]="!item.inCurrentWeek"
                (click)="selectDate(item.date)"
              >
                {{ item.dayNumber }}
              </button>
            }
          </div>
        </div>
      </div>
    </section>

    <section class="card page-section card-glow schedule-card">
      <div class="section-title-row reservation-header">
        <div>
          <h2>Disponibilidad semanal del salón</h2>
          <p class="muted">La agenda muestra únicamente días hábiles, de lunes a viernes, con disponibilidad de 07:00 a 19:00.</p>
        </div>
        <div class="legend">
          <span><i class="dot available"></i> Disponible</span>
          <span><i class="dot busy"></i> Ocupado</span>
        </div>
      </div>

      @if (!form.controls.lab.value) {
        <div class="empty-state">Seleccione primero un laboratorio o salón para consultar la disponibilidad.</div>
      } @else if (!availabilityDays().length) {
        <div class="empty-state">No fue posible cargar la semana actual del espacio seleccionado.</div>
      } @else {
        <div class="week-nav">
          <button type="button" class="btn-secondary" disabled>← Anterior</button>
          <div class="week-title">{{ currentMonthLabel() }}</div>
          <button type="button" class="btn-secondary" disabled>Siguiente →</button>
        </div>

        <div class="schedule-grid-wrap">
          <table class="availability-table">
            <thead>
              <tr>
                <th>Hora</th>
                @for (day of availabilityDays(); track day.date) {
                  <th>
                    <div class="day-head__weekday">{{ weekdayLabel(day.weekday) }}</div>
                    <div class="day-head__day">{{ day.date | date:'d' }}</div>
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (time of timeSlots(); track time; let rowIndex = $index) {
                <tr>
                  <th>{{ time }}</th>
                  @for (day of availabilityDays(); track day.date) {
                    <td>
                      <button
                        type="button"
                        class="slot-btn"
                        [class.available]="!cellAt(day, rowIndex).occupied && !isClosingSlot(cellAt(day, rowIndex))"
                        [class.busy]="cellAt(day, rowIndex).occupied"
                        [class.closing]="isClosingSlot(cellAt(day, rowIndex))"
                        [class.selected]="isSelected(day.date, cellAt(day, rowIndex).time)"
                        [disabled]="!cellAt(day, rowIndex).selectable || isClosingSlot(cellAt(day, rowIndex))"
                        (click)="selectCell(day, cellAt(day, rowIndex))"
                        [title]="cellTooltip(cellAt(day, rowIndex))"
                      >
                        {{ isClosingSlot(cellAt(day, rowIndex)) ? 'Cierre de jornada' : cellAt(day, rowIndex).status_label }}
                      </button>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>

    <section class="card table-wrap card-glow page-section">
      <div class="section-title-row"><div><h2>Mis solicitudes</h2><p class="muted">Las solicitudes quedan registradas en el historial del profesor y se muestran con su estado de autorización.</p></div><button class="btn-secondary" type="button" (click)="reload()">Actualizar</button></div>
      <table>
        <thead><tr><th>Espacio</th><th>Materia</th><th>Horario</th><th>Estado</th></tr></thead>
        <tbody>
          @for (item of rows(); track item.id) { <tr><td>{{ item.lab_name }}</td><td>{{ item.subject }}</td><td>{{ item.start_time | date:'medium' }} → {{ item.end_time | date:'medium' }}</td><td>{{ item.status_label || item.status }}</td></tr> } @empty { <tr><td colspan="4"><div class="empty-state">No hay solicitudes registradas.</div></td></tr> }
        </tbody>
      </table>
    </section>
  `,
  styles: [`
    .grid-2 { display:grid; grid-template-columns: 1.1fr 0.9fr; gap: 1rem; }
    .reservation-form { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    .reservation-form textarea { min-height: 96px; }
    .helper-text { margin-top: 0.75rem; }
    .calendar-card { align-self:start; }
    .mini-calendar { border: 1px solid rgba(15, 23, 42, 0.08); border-radius: 1rem; padding: 1rem; background: rgba(255,255,255,0.65); }
    .mini-calendar__header { text-align:center; font-weight:700; font-size:1.1rem; margin-bottom: 1rem; }
    .mini-calendar__weekdays, .mini-calendar__grid { display:grid; grid-template-columns: repeat(7, 1fr); gap: 0.45rem; }
    .mini-calendar__weekdays span { text-align:center; font-size:0.88rem; color: var(--muted); }
    .mini-calendar__day { border:none; background:#fff; border-radius:999px; width: 2.5rem; height: 2.5rem; margin:0 auto; cursor:pointer; font-weight:600; }
    .mini-calendar__day.muted { opacity:0.35; }
    .mini-calendar__day.current-week { background: rgba(59, 130, 246, 0.14); color:#0f172a; }
    .mini-calendar__day.today { outline: 2px solid rgba(37, 99, 235, 0.75); }
    .mini-calendar__day:disabled { cursor:not-allowed; }
    .schedule-card { overflow:hidden; }
    .reservation-header { align-items:center; }
    .legend { display:flex; gap:1.25rem; flex-wrap:wrap; font-weight:600; }
    .dot { display:inline-block; width:0.9rem; height:0.9rem; border-radius:999px; margin-right:0.5rem; vertical-align:middle; }
    .dot.available { background:#d9f7e3; border:1px solid #8dd7a4; }
    .dot.busy { background:#fde2e2; border:1px solid #f3a8a8; }
    .week-nav { display:flex; align-items:center; justify-content:space-between; margin-bottom: 1rem; }
    .week-title { font-size:1.35rem; font-weight:800; }
    .schedule-grid-wrap { overflow-x:auto; }
    .availability-table { width:100%; border-collapse:separate; border-spacing:0 0.6rem; min-width:980px; }
    .availability-table thead th { text-align:center; color: var(--muted); font-size:0.9rem; }
    .availability-table tbody th { text-align:left; color: var(--muted); padding-right:0.75rem; }
    .day-head__weekday { text-transform:lowercase; font-size:0.85rem; }
    .day-head__day { font-size:1.6rem; font-weight:800; color: var(--text); }
    .slot-btn { width:100%; padding:0.85rem 0.75rem; border-radius:0.85rem; border:1px solid transparent; font-weight:700; cursor:pointer; transition:transform .18s ease, box-shadow .18s ease; }
    .slot-btn.available { background:#e4f6ea; border-color:#9fd8b2; color:#15803d; }
    .slot-btn.busy { background:#fdeaea; border-color:#efb0b0; color:#b91c1c; }
    .slot-btn.closing { background:#f1f5f9; border-color:#cbd5e1; color:#64748b; }
    .slot-btn.selected { box-shadow:0 0 0 2px rgba(37,99,235,.25); transform: translateY(-1px); }
    .slot-btn:disabled { cursor:not-allowed; opacity:0.92; }
    .compact { margin-bottom: 0.75rem; }
    @media (max-width: 1100px) {
      .grid-2, .reservation-form { grid-template-columns: 1fr; }
      .availability-table { min-width:860px; }
    }
  `]
})
export class ClassroomsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private labsService = inject(LabsService);

  currentUser = this.auth.currentUser;
  rows = signal<any[]>([]);
  labs = signal<any[]>([]);
  availabilityDays = signal<AvailabilityDay[]>([]);
  timeSlots = signal<string[]>([]);
  selectedDate = signal<string | null>(null);
  selectedTime = signal<string | null>(null);
  weekStart = signal<string>(this.getCurrentWeekStart());

  weekdayShortLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  private readonly businessWeekdays = new Set<AvailabilityDay['weekday']>(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);

  form = this.fb.group({
    lab: ['', Validators.required],
    subject: ['', [Validators.required, Validators.pattern(PATTERNS.text)]],
    notes: [''],
    request_date: ['', Validators.required],
    selected_slot: ['', Validators.required],
    end_slot: ['', Validators.required],
    start_time: ['', Validators.required],
    end_time: ['', Validators.required],
  });

  fullName = computed(() => `${this.currentUser()?.first_name || ''} ${this.currentUser()?.last_name || ''}`.trim());
  selectedCell = computed(() => this.selectedDate() && this.selectedTime() ? { date: this.selectedDate()!, time: this.selectedTime()! } : null);
  selectedDateLabel = computed(() => this.selectedDate() ? new Date(`${this.selectedDate()}T00:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Seleccione fecha');
  selectedTimeLabel = computed(() => this.selectedTime() ? `${this.selectedTime()} - ${this.addOneHour(this.selectedTime() || '07:00')}` : 'Seleccione hora');
  selectedEndTimeLabel = computed(() => this.selectedTime() ? this.addOneHour(this.selectedTime() || '07:00') : 'Seleccione hora de inicio');
  startTimeOptions = computed(() => this.buildHourOptions(7, 18));
  endTimeOptions = computed(() => {
    const start = this.selectedTime() || '';
    if (!start) return this.buildHourOptions(8, 19);
    const [hour] = start.split(':').map(Number);
    return this.buildHourOptions(hour + 1, 19);
  });
  availableCellsForSelectedDate = computed(() => {
    const day = this.availabilityDays().find(item => item.date === this.selectedDate());
    return day ? day.cells.filter(cell => cell.selectable && !cell.occupied) : [];
  });
  availableEndTimesForSelectedStart = computed(() => {
    const day = this.availabilityDays().find(item => item.date === this.selectedDate());
    const start = this.selectedTime();
    if (!day || !start) return this.endTimeOptions();
    const startIndex = day.cells.findIndex(cell => cell.time === start);
    if (startIndex < 0) return this.endTimeOptions();
    const endTimes: string[] = [];
    for (let index = startIndex; index < day.cells.length; index++) {
      const cell = day.cells[index];
      if (!cell.selectable || cell.occupied) break;
      endTimes.push(this.addOneHour(cell.time));
    }
    return endTimes.length ? endTimes.filter(time => this.compareTimes(time, start) > 0 && this.compareTimes(time, '19:00') <= 0) : this.endTimeOptions();
  });
  currentMonthLabel = computed(() => {
    const base = new Date(`${this.weekStart()}T00:00:00`);
    return base.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).replace(/\b\w/g, letter => letter.toUpperCase());
  });
  calendarDays = computed(() => this.buildCalendarDays());

  ngOnInit(): void {
    this.reload();
    this.labsService.listLabs(100).subscribe({
      next: res => {
        this.labs.set(res.results);
        if (!this.form.controls.lab.value && res.results.length) {
          this.form.controls.lab.setValue(String(res.results[0].id));
          this.onLabChange();
        }
      },
      error: error => alert(JSON.stringify(error.error || 'No se pudieron cargar los espacios.')),
    });
  }

  reload(): void {
    this.labsService.listClassroomUsage(100).subscribe({ next: res => this.rows.set(res.results) });
  }

  onLabChange(): void {
    const labId = this.form.controls.lab.value;
    this.selectedDate.set(null);
    this.selectedTime.set(null);
    this.form.patchValue({ request_date: '', selected_slot: '', end_slot: '', start_time: '', end_time: '' }, { emitEvent: false });
    if (!labId) {
      this.availabilityDays.set([]);
      this.timeSlots.set([]);
      return;
    }
    this.labsService.getWeeklyAvailability(labId, this.weekStart()).subscribe({
      next: res => {
        const businessDays = res.days.filter(day => this.businessWeekdays.has(day.weekday));
        const businessSlots = this.buildHourOptions(7, 19);
        this.availabilityDays.set(businessDays.map(day => ({
          ...day,
          cells: day.cells.filter(cell => businessSlots.includes(cell.time)),
        })));
        this.timeSlots.set(businessSlots);
      },
      error: error => alert(JSON.stringify(error.error || 'No se pudo cargar la disponibilidad semanal.')),
    });
  }

  selectDate(date: string): void {
    const day = this.availabilityDays().find(item => item.date === date);
    if (!day) return;
    const firstOpen = day.cells.find(cell => cell.selectable && !cell.occupied);
    this.selectedDate.set(day.date);
    this.selectedTime.set(null);
    this.form.patchValue({ request_date: day.date, selected_slot: '', end_slot: '', start_time: '', end_time: '' }, { emitEvent: false });
    if (firstOpen) {
      this.selectCell(day, firstOpen);
    }
  }

  onReservationDateChange(): void {
    const date = this.form.controls.request_date.value || '';
    this.selectedDate.set(date || null);
    this.selectedTime.set(null);
    this.form.patchValue({ selected_slot: '', end_slot: '', start_time: '', end_time: '' }, { emitEvent: false });
  }

  onReservationTimeChange(): void {
    const date = this.form.controls.request_date.value || '';
    const time = this.form.controls.selected_slot.value || '';
    if (!date || !time) {
      this.selectedTime.set(null);
      this.form.patchValue({ end_slot: '', start_time: '', end_time: '' }, { emitEvent: false });
      return;
    }
    this.selectedDate.set(date);
    this.selectedTime.set(time);
    const firstEnd = this.endTimeOptions()[0] || this.addOneHour(time);
    this.form.patchValue({
      end_slot: firstEnd,
      start_time: `${date}T${time}:00`,
      end_time: `${date}T${firstEnd}:00`,
    }, { emitEvent: false });
  }

  onReservationEndTimeChange(): void {
    const date = this.form.controls.request_date.value || '';
    const time = this.form.controls.selected_slot.value || '';
    const end = this.form.controls.end_slot.value || '';
    if (!date || !time || !end) {
      this.form.patchValue({ start_time: '', end_time: '' }, { emitEvent: false });
      return;
    }
    this.selectedDate.set(date);
    this.selectedTime.set(time);
    this.form.patchValue({
      start_time: `${date}T${time}:00`,
      end_time: `${date}T${end}:00`,
    }, { emitEvent: false });
  }

  selectCell(day: AvailabilityDay, cell: AvailabilityCell): void {
    if (this.isClosingSlot(cell) || !cell.selectable || cell.occupied) return;
    this.selectedDate.set(day.date);
    this.selectedTime.set(cell.time);
    const end = this.addOneHour(cell.time);
    this.form.patchValue({
      request_date: day.date,
      selected_slot: cell.time,
      end_slot: end,
      start_time: `${day.date}T${cell.time}:00`,
      end_time: `${day.date}T${end}:00`,
    }, { emitEvent: false });
  }

  isSelected(date: string, time: string): boolean {
    return this.selectedDate() === date && this.selectedTime() === time;
  }

  isClosingSlot(cell: AvailabilityCell): boolean {
    return cell.time === '19:00';
  }

  cellAt(day: AvailabilityDay, index: number): AvailabilityCell {
    const time = this.timeSlots()[index];
    const found = day.cells.find(cell => cell.time === time);

    if (time === '19:00') {
      return {
        ...(found || {}),
        time,
        occupied: false,
        selectable: false,
        status_label: 'Cierre de jornada',
        reason: 'Límite de horario institucional',
        detail: 'El último bloque reservable termina a las 19:00.',
      } as AvailabilityCell;
    }

    if (found) return found;

    return {
      time,
      occupied: false,
      selectable: true,
      status_label: 'Disponible',
      reason: '',
      detail: '',
    } as AvailabilityCell;
  }

  cellTooltip(cell: AvailabilityCell): string {
    if (this.isClosingSlot(cell)) return 'Límite de horario institucional';
    if (!cell.occupied) return 'Disponible para reservar';
    return [cell.status_label, cell.reason, cell.detail].filter(Boolean).join(' · ');
  }

  weekdayLabel(code: AvailabilityDay['weekday']): string {
    const labels: Record<AvailabilityDay['weekday'], string> = {
      MONDAY: 'lun', TUESDAY: 'mar', WEDNESDAY: 'mié', THURSDAY: 'jue', FRIDAY: 'vie', SATURDAY: 'sáb', SUNDAY: 'dom'
    };
    return labels[code];
  }

  create(): void {
    if (this.form.invalid || !this.selectedCell()) return;
    const { lab, subject, notes, start_time, end_time } = this.form.getRawValue();
    this.labsService.createClassroomUsage({ lab, subject, notes, start_time, end_time }).subscribe({
      next: () => {
        this.form.patchValue({ subject: '', notes: '', request_date: '', selected_slot: '', end_slot: '', start_time: '', end_time: '' });
        this.selectedDate.set(null);
        this.selectedTime.set(null);
        this.reload();
        this.onLabChange();
      },
      error: error => alert(JSON.stringify(error.error || 'No se pudo guardar la solicitud.')),
    });
  }

  sanitize(controlName: 'subject' | 'notes', kind: 'text' | 'textarea'): void {
    const control = this.form.get(controlName);
    if (control) control.setValue(sanitizeValue(kind, control.value || ''), { emitEvent: false });
  }

  private getCurrentWeekStart(): string {
    const now = new Date();
    const currentDay = now.getDay() || 7;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - currentDay + 1);
    return monday.toISOString().slice(0, 10);
  }

  formatDayOption(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  addOneHour(time: string): string {
    const [hour] = time.split(':').map(Number);
    const nextHour = (hour + 1).toString().padStart(2, '0');
    return `${nextHour}:00`;
  }

  private buildHourOptions(startHour: number, endHour: number): string[] {
    const options: string[] = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      options.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return options;
  }

  private compareTimes(left: string, right: string): number {
    const [lh, lm] = left.split(':').map(Number);
    const [rh, rm] = right.split(':').map(Number);
    return (lh * 60 + (lm || 0)) - (rh * 60 + (rm || 0));
  }

  private buildCalendarDays() {
    const weekStartDate = new Date(`${this.weekStart()}T00:00:00`);
    const firstOfMonth = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), 1);
    const startOffset = (firstOfMonth.getDay() || 7) - 1;
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - startOffset);

    const weekDates = new Set(this.availabilityDays().map(day => day.date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 35 }).map((_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const iso = date.toISOString().slice(0, 10);
      return {
        date: iso,
        dayNumber: date.getDate(),
        inCurrentMonth: date.getMonth() === weekStartDate.getMonth(),
        inCurrentWeek: weekDates.has(iso),
        isToday: date.getTime() === today.getTime(),
      };
    });
  }
}
