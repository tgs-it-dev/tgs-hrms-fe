import { useEffect } from 'react';
import AttendanceCheck from '../components/Attendance/AttendanceCheck';

export default function AttendancePage() {
  useEffect(() => {
    document.title = 'Attendance — TGS HRMS';
  }, []);

  return <AttendanceCheck />;
}
