export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'PROFESSOR' | 'STUDENT';

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  institutional_email?: string;
  alternate_email?: string;
  student_code?: string;
  role: UserRole;
  phone?: string;
}

export interface Laboratory {
  id: number;
  code: string;
  name: string;
  location: string;
  capacity: number;
  available_computers: number;
  is_active: boolean;
}

export interface Classroom {
  id: number;
  code: string;
  name: string;
  building: string;
  capacity: number;
  available_computers: number;
  is_active: boolean;
}

export interface Schedule {
  id: number;
  classroom: number;
  classroom_code?: string;
  academic_period: string;
  day_of_week: string;
  time_block: string;
  subject: string;
  professor_name?: string;
  group_name?: string;
  notes?: string;
}

export interface Attendance {
  id: number;
  user: number;
  user_email?: string;
  laboratory: number;
  laboratory_code?: string;
  check_in: string;
  check_out?: string | null;
  status: string;
  notes?: string;
}

export interface Activity {
  id: number;
  laboratory: number;
  laboratory_code?: string;
  attendance?: number | null;
  title: string;
  description: string;
  activity_date: string;
  duration_minutes: number;
  status: string;
}

export interface ClassroomUsage {
  id: number;
  classroom: number;
  classroom_code?: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: string;
}
