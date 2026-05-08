import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Dashboard from '../components/DashboardContent/Dashboard';

export default function DashboardPage() {
  useDocumentTitle('Dashboard');
  return <Dashboard />;
}
