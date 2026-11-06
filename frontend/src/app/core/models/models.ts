export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  institutional_email: string;
  alternate_email?: string;
  student_code: string;
  department?: string;
  phone?: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'STUDENT' | 'PROFESSOR';
  status: 'ACTIVE' | 'INACTIVE';
  photo_url?: string;
  password_strength?: 'DEBIL' | 'MEDIA' | 'ALTA' | null;
}

export interface Lab {
  id: number;
  name: string;
  code: string;
  location: string;
  capacity: number;
  available_computers: number;
  status: string;
  supervisors: number[];
  supervisor_names: string[];
}

export interface Activity {
  id: number;
  record_type: 'STUDENT_ENTRY' | 'PROFESSOR_REQUEST';
  status: 'OPEN' | 'CLOSED' | 'PENDING' | 'ATTENDED';
  student_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  description?: string;
  subject_name?: string;
  nrc?: string;
  class_time?: string;
  lab: number;
  lab_name: string;
  activity_date: string;
  entry_time?: string | null;
  exit_time?: string | null;
  resolved_at?: string | null;
  created_by: number;
  created_by_name: string;
  resolved_by?: number | null;
  resolved_by_name?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ClassroomUsage {
  id: number;
  lab: number;
  lab_name: string;
  professor: number;
  professor_name: string;
  subject: string;
  start_time: string;
  end_time: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  status_label?: string;
  notes?: string;
  approved_by?: number | null;
  approved_by_name?: string | null;
  resolution_notes?: string;
}

export interface ClassSchedule {
  id: number;
  lab: number;
  lab_name: string;
  period: string;
  weekday: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';
  time_slot: string;
  nrc?: string;
  course_code?: string;
  subject_name?: string;
  section?: string;
  professor_name?: string;
  notes?: string;
  updated_by?: number | null;
  updated_by_name?: string | null;
  updated_at?: string;
}

export interface ClassScheduleEntry extends ClassSchedule {}

export interface IncidentReport {
  id: number;
  lab: number;
  lab_name: string;
  lab_code: string;
  reported_by_name: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  severity_label: string;
  description: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
  status_label: string;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at?: string;
}


export interface AvailabilityCell {
  time: string;
  occupied: boolean;
  status_label: string;
  reason?: string | null;
  detail?: string | null;
  selectable: boolean;
}

export interface AvailabilityDay {
  date: string;
  weekday: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  cells: AvailabilityCell[];
}

export interface WeeklyAvailability {
  lab: { id: number; name: string; code: string };
  week_start: string;
  week_end: string;
  today: string;
  time_slots: string[];
  days: AvailabilityDay[];
}


export interface ComputerUsageRequest {
  id: number;
  lab: number;
  lab_name: string;
  lab_code: string;
  student: number;
  student_name: string;
  student_code: string;
  requested_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  notes?: string;
  assigned_computer?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  status_label: string;
  reviewed_by?: number | null;
  reviewed_by_name?: string | null;
  resolution_notes?: string;
  created_at: string;
  updated_at?: string;
}
