import { useEffect } from 'react';
import EmployeeManager from '../components/Employee/EmployeeManager';

export default function EmployeesPage() {
  useEffect(() => {
    document.title = 'Employees — TGS HRMS';
  }, []);

  return <EmployeeManager />;
}
