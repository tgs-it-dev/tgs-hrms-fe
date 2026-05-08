import { useEffect } from 'react';
import LeaveRequestPage from '../components/LeaveRequest/LeaveRequestPage';

export default function LeavePage() {
  useEffect(() => {
    document.title = 'Leave Requests — TGS HRMS';
  }, []);

  return <LeaveRequestPage />;
}
