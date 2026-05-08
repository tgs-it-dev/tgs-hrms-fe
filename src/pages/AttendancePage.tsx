import { useDocumentTitle } from '../hooks/useDocumentTitle';
import AttendanceCheck from '../components/Attendance/AttendanceCheck';

export default function AttendancePage() {
  useDocumentTitle('Attendance');
  return <AttendanceCheck />;
}
