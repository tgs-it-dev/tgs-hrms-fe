import { useDocumentTitle } from '../hooks/useDocumentTitle';
import LeaveRequestPage from '../components/LeaveRequest/LeaveRequestPage';

export default function LeavePage() {
  useDocumentTitle('Leave Requests');
  return <LeaveRequestPage />;
}
