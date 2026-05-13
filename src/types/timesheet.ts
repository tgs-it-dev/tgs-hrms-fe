export interface TimesheetEntry {
  id: string;
  user_id: string;
  employee_full_name: string;
  created_at: string;
  start_time: string | null;
  end_time: string | null;
  duration_hours: number | null;
  durationHours?: number | null;
}
