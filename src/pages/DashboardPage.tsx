import { useEffect } from 'react';
import Dashboard from '../components/DashboardContent/Dashboard';

export default function DashboardPage() {
  useEffect(() => {
    document.title = 'Dashboard — TGS HRMS';
  }, []);

  return <Dashboard />;
}
