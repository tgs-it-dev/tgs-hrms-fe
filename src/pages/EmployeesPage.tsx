import { useDocumentTitle } from '../hooks/useDocumentTitle';
import EmployeeManager from '../components/Employee/EmployeeManager';

export default function EmployeesPage() {
  useDocumentTitle('Employees');
  return <EmployeeManager />;
}
