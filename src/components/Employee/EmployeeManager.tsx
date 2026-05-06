import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
  IconButton,
  Stack,
  useMediaQuery,
  Pagination,
  Typography,
  Paper,
  DialogActions,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import WarningIcon from '@mui/icons-material/Warning';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useLocation, useNavigate } from 'react-router-dom';
import AddEmployeeForm from './AddEmployeeForm';
import EmployeeList from './EmployeeList';
import EmployeeViewModal from './EmployeeViewModal';
import employeeApi from '../../api/employeeApi';
import type { BackendEmployee, EmployeeDto } from '../../types/employee';
import {
  departmentApiService,
  type BackendDepartment,
} from '../../api/departmentApi';
import {
  designationApiService,
  type BackendDesignation,
} from '../../api/designationApi';
import { extractErrorMessage } from '../../utils/errorHandler';
import { exportCSV } from '../../api/exportApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppButton from '../common/AppButton';
import AppDropdown from '../common/AppDropdown';
import AppFormModal from '../common/AppFormModal';
import AppPageTitle from '../common/AppPageTitle';
import { PAGINATION } from '../../constants/appConstants';
interface Employee {
  id: string;
  user_id?: string; // User ID for fetching profile pictures
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  departmentId: string;
  designationId: string;
  role_name?: string;
  status?: string;
  cnic_number?: string;
  profile_picture?: string;
  cnic_picture?: string;
  cnic_back_picture?: string;
  department: {
    id: string;
    name: string;
    description: string;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  designation: {
    id: string;
    title: string;
    tenantId: string;
    departmentId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

import { useUser } from '../../hooks/useUser';
import { isManager } from '../../utils/roleUtils';
import teamApiService from '../../api/teamApi';
import type { TeamMember } from '../../types/team';

// ... existing imports

const EmployeeManager: React.FC = () => {
  const theme = useTheme();
  const direction = theme.direction;
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery('(min-width:601px) and (max-width:786px)');
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser(); // Get user context
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<null | Employee>(null);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]); // Store all employees
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();

  // If Stripe redirects back to this page with a session_id, forward to the unified
  // confirmation screen (which will finalize the employee after payment).
  useEffect(() => {
    try {
      const sp = new URLSearchParams(location.search);
      const sessionId = sp.get('session_id');
      if (!sessionId) return;

      const pending = sessionStorage.getItem('pendingEmployeePayment');
      if (!pending) return;

      navigate(
        `/signup/confirm-payment?session_id=${encodeURIComponent(sessionId)}`,
        {
          replace: true,
        }
      );
    } catch {
      // ignore
    }
  }, [location.search, navigate]);

  // Pagination state - now for client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationLimit, setPaginationLimit] = useState<number>(
    PAGINATION.DEFAULT_PAGE_SIZE
  ); // Backend limit

  // Calculate pagination from all employees using backend limit
  const totalItems = allEmployees.length;
  const itemsPerPage = paginationLimit || PAGINATION.DEFAULT_PAGE_SIZE; // Use backend limit

  // Calculate total pages - only count pages that have actual data
  // For example: 50 records / 25 limit = 2 pages (not 3)
  // Ensure we only show pages with actual data - no empty pages
  let totalPages = 1;
  if (totalItems > 0 && itemsPerPage > 0) {
    totalPages = Math.ceil(totalItems / itemsPerPage);
    // Ensure totalPages is at least 1
    totalPages = Math.max(1, totalPages);
  }

  // Get paginated employees for current page
  const employees = useMemo(() => {
    // Ensure current page doesn't exceed total pages
    const validPage = Math.min(
      currentPage,
      Math.max(1, Math.ceil(allEmployees.length / itemsPerPage))
    );
    if (validPage !== currentPage && allEmployees.length > 0) {
      // Reset to valid page if current page is invalid
      setCurrentPage(validPage);
      return [];
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allEmployees.slice(startIndex, endIndex);
  }, [allEmployees, currentPage, itemsPerPage]);

  const [departmentFilter, setDepartmentFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [departments, setDepartments] = useState<Record<string, string>>({});
  const [designations, setDesignations] = useState<Record<string, string>>({});
  const [departmentList, setDepartmentList] = useState<BackendDepartment[]>([]);
  const [designationList, setDesignationList] = useState<BackendDesignation[]>(
    []
  );
  // const [loadingFilters, setLoadingFilters] = useState(false);

  // Delete confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string>('');

  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Track initial mount to prevent duplicate API calls
  const isInitialMount = useRef(true);
  const isLoadingRef = useRef(false);

  // Match Designation page dropdown background (AppDropdown default)
  const bgColor = theme.palette.background.paper;
  const textColor = theme.palette.text.secondary;
  const borderColor = theme.palette.divider;
  const controlBg = theme.palette.background.paper;

  const designationsForSelectedDepartment = useMemo(() => {
    if (!departmentFilter || departmentFilter === 'all') return [];
    return designationList.filter(des => des.departmentId === departmentFilter);
  }, [departmentFilter, designationList]);

  const loadDepartmentsAndDesignations = useCallback(async () => {
    try {
      // setLoadingFilters(true);
      // Load all departments
      const deptData = await departmentApiService.getAllDepartments();
      const deptMap: Record<string, string> = {};
      deptData.forEach(dept => {
        deptMap[dept.id] = dept.name;
      });
      setDepartments(deptMap);
      setDepartmentList(deptData);

      // Load all designations
      const desigData = await designationApiService.getAllDesignations();
      const desigMap: Record<string, string> = {};
      desigData.forEach(desig => {
        desigMap[desig.id] = desig.title;
      });
      setDesignations(desigMap);
      setDesignationList(desigData);
    } catch {
      // Handle error silently
    } finally {
      // setLoadingFilters(false);
    }
  }, []);

  // Helper function to convert BackendEmployee to Employee
  const convertToEmployee = (emp: BackendEmployee): Employee => ({
    id: emp.id,
    user_id: emp.user_id,
    name: emp.name,
    firstName: emp.firstName,
    lastName: emp.lastName,
    email: emp.email,
    phone: emp.phone,
    departmentId: emp.departmentId,
    designationId: emp.designationId,
    role_name: emp.role_name,
    status: emp.status,
    cnic_number: emp.cnic_number,
    profile_picture: emp.profile_picture,
    cnic_picture: emp.cnic_picture,
    cnic_back_picture: emp.cnic_back_picture,
    department: emp.department || {
      id: '',
      name: '',
      description: '',
      tenantId: '',
      createdAt: '',
      updatedAt: '',
    },
    designation: emp.designation || {
      id: '',
      title: '',
      tenantId: '',
      departmentId: '',
      createdAt: '',
      updatedAt: '',
    },
    tenantId: emp.tenantId,
    createdAt: emp.createdAt,
    updatedAt: emp.updatedAt,
  });

  const convertTeamMemberToEmployee = (member: TeamMember): Employee => ({
    id: member.id,
    user_id: member.user.id,
    name: `${member.user.first_name || ''} ${member.user.last_name || ''}`.trim(),
    firstName: member.user.first_name,
    lastName: member.user.last_name,
    email: member.user.email,
    phone: '', // Not available in TeamMember
    departmentId:
      member.department?.id || member.designation.department?.id || '',
    designationId: member.designation.id,
    role_name: 'Employee', // Default
    status: 'Active', // Default or fetch if available
    profile_picture: member.user.profile_pic || undefined,
    department: member.department
      ? {
          id: member.department.id,
          name: member.department.name,
          description: '',
          tenantId: '',
          createdAt: '',
          updatedAt: '',
        }
      : member.designation.department
        ? {
            id: member.designation.department.id,
            name: member.designation.department.name,
            description: '',
            tenantId: '',
            createdAt: '',
            updatedAt: '',
          }
        : null,
    designation: {
      id: member.designation.id,
      title: member.designation.title,
      tenantId: '', // Not available
      departmentId:
        member.department?.id || member.designation.department?.id || '',
      createdAt: '',
      updatedAt: '',
    },
    tenantId: '', // Not available
    createdAt: member.created_at || new Date().toISOString(),
    updatedAt: member.updated_at || new Date().toISOString(),
  });

  // Fetch all employees from all pages
  const loadEmployees = useCallback(async () => {
    // Prevent duplicate calls
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);

      // Check current user role
      // Note: user object might trigger re-renders, but ref/checking inside callback is safer
      const currentUserRole =
        user?.role || (user as { role_name?: string })?.role_name;

      if (isManager(currentUserRole)) {
        // Fetch manager's team members
        const allMembers: TeamMember[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const res = await teamApiService.getMyTeamMembers(page);
          if (res.items && res.items.length > 0) {
            allMembers.push(...res.items);
            if (page >= res.totalPages) hasMore = false;
            else page++;
          } else {
            hasMore = false;
          }
        }

        const mappedEmployees = allMembers.map(convertTeamMemberToEmployee);
        setAllEmployees(mappedEmployees);
        setPaginationLimit(
          mappedEmployees.length > 0 ? mappedEmployees.length : 25
        );
        setCurrentPage(1);
      } else {
        // Admin/HR Admin logic - fetch full list
        const filters = {
          departmentId: departmentFilter || undefined,
          designationId: designationFilter || undefined,
        };

        // Fetch all pages sequentially
        const allEmployeesData: Employee[] = [];
        let page = 1;
        let hasMorePages = true;
        let backendLimit = 25; // Default limit

        while (hasMorePages) {
          const response = await employeeApi.getAllEmployees(filters, page);

          // Extract limit from first page response
          if (page === 1 && response.limit) {
            backendLimit = response.limit;
            setPaginationLimit(backendLimit);
          }

          // Convert and add employees
          const convertedEmployees: Employee[] =
            response.items.map(convertToEmployee);
          allEmployeesData.push(...convertedEmployees);

          // Check if there are more pages
          if (response.totalPages) {
            // Use backend pagination info
            hasMorePages = page < response.totalPages;
            page++;
          } else {
            // Estimate: if we got less than backend limit, it's the last page
            hasMorePages = convertedEmployees.length >= backendLimit;
            page++;
          }
        }

        setAllEmployees(allEmployeesData);
        // Reset to page 1 when data is loaded
        setCurrentPage(1);
      }
    } catch (error: unknown) {
      const errorResult = extractErrorMessage(error);
      showError(errorResult.message);
      setAllEmployees([]);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [departmentFilter, designationFilter, showError, user]);

  // Mark initial mount as complete after first render
  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  // Load employees on component mount
  useEffect(() => {
    loadDepartmentsAndDesignations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load employees when filters change (fetches all records)
  useEffect(() => {
    // Skip on initial mount to prevent duplicate API call
    if (isInitialMount.current) {
      return;
    }
    setCurrentPage(1); // Reset to page 1 when filters change
    loadEmployees();
  }, [departmentFilter, designationFilter, loadEmployees]);

  // Load employees on initial mount
  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Handle page change (client-side pagination, no API call needed)
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddEmployee = async (
    employeeData: Partial<EmployeeDto> & {
      departmentId?: string;
      designationId?: string;
      role?: string;
      role_name?: string;
      role_id?: string;
      team_id?: string;
    }
  ) => {
    try {
      setSubmitting(true);

      // Ensure required fields are present
      if (
        !employeeData.first_name ||
        !employeeData.last_name ||
        !employeeData.email ||
        !employeeData.designationId
      ) {
        throw new Error('Required fields are missing');
      }

      // Remove role_id before submitting
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { role_id, ...employeePayload } = employeeData;
      const newEmployee = await employeeApi.createEmployee(
        employeePayload as EmployeeDto
      );

      // Fetch the complete employee data to get proper department and designation info
      const completeEmployee = await employeeApi.getEmployeeById(
        newEmployee.id
      );

      // Convert BackendEmployee to Employee using the complete data
      const convertedEmployee: Employee = {
        id: completeEmployee.id,
        user_id: completeEmployee.user_id,
        name: completeEmployee.name,
        firstName: completeEmployee.firstName,
        lastName: completeEmployee.lastName,
        email: completeEmployee.email,
        phone: completeEmployee.phone,
        departmentId: completeEmployee.departmentId,
        designationId: completeEmployee.designationId,
        role_name: completeEmployee.role_name,
        status: completeEmployee.status,
        cnic_number: completeEmployee.cnic_number,
        profile_picture: completeEmployee.profile_picture,
        cnic_picture: completeEmployee.cnic_picture,
        cnic_back_picture: completeEmployee.cnic_back_picture,
        department: completeEmployee.department
          ? {
              id: completeEmployee.department.id,
              name: completeEmployee.department.name,
              description: completeEmployee.department.description,
              tenantId: completeEmployee.department.tenantId,
              createdAt: completeEmployee.department.createdAt,
              updatedAt: completeEmployee.department.updatedAt,
            }
          : {
              id: completeEmployee.departmentId,
              name:
                departments[completeEmployee.departmentId] ||
                'Unknown Department',
              description: '',
              tenantId: completeEmployee.tenantId,
              createdAt: completeEmployee.createdAt,
              updatedAt: completeEmployee.updatedAt,
            },
        designation: completeEmployee.designation || {
          id: completeEmployee.designationId,
          title:
            designations[completeEmployee.designationId] ||
            'Unknown Designation',
          tenantId: completeEmployee.tenantId,
          departmentId: completeEmployee.departmentId,
          createdAt: completeEmployee.createdAt,
          updatedAt: completeEmployee.updatedAt,
        },
        tenantId: completeEmployee.tenantId,
        createdAt: completeEmployee.createdAt,
        updatedAt: completeEmployee.updatedAt,
      };

      // Add to the beginning of the list (most recent first)
      setAllEmployees(prev => [convertedEmployee, ...prev]);

      // Reload department and designation mappings
      await loadDepartmentsAndDesignations();

      showSuccess(
        'Employee added successfully! A password reset link has been sent to their email.'
      );
      setOpen(false);

      return { success: true };
    } catch (err: unknown) {
      // Handle payment-required flow (backend returns checkoutUrl + checkoutSessionId)
      const paymentCandidate = err as {
        response?: {
          data?: Record<string, unknown>;
          status?: number;
        };
      };

      const data = paymentCandidate?.response?.data ?? null;
      const requiresPayment =
        Boolean(
          data &&
          (data.requiresPayment === true || data.requires_payment === true)
        ) || false;
      const checkoutUrl =
        typeof (data as Record<string, unknown> | null)?.checkoutUrl ===
        'string'
          ? ((data as Record<string, unknown>).checkoutUrl as string)
          : typeof (data as Record<string, unknown> | null)?.checkout_url ===
              'string'
            ? ((data as Record<string, unknown>).checkout_url as string)
            : null;
      const checkoutSessionId =
        typeof (data as Record<string, unknown> | null)?.checkoutSessionId ===
        'string'
          ? ((data as Record<string, unknown>).checkoutSessionId as string)
          : typeof (data as Record<string, unknown> | null)
                ?.checkout_session_id === 'string'
            ? ((data as Record<string, unknown>).checkout_session_id as string)
            : typeof (data as Record<string, unknown> | null)?.session_id ===
                'string'
              ? ((data as Record<string, unknown>).session_id as string)
              : null;

      if (requiresPayment && checkoutUrl && checkoutSessionId) {
        try {
          sessionStorage.setItem(
            'pendingEmployeePayment',
            JSON.stringify({
              checkoutSessionId,
              returnTo: `${location.pathname}${location.search}`,
              createdAt: new Date().toISOString(),
            })
          );
        } catch {
          // ignore storage errors
        }

        showSuccess('Redirecting to secure payment...');
        window.location.href = checkoutUrl;
        return { success: false };
      }

      // Handle backend validation errors
      const errorResponse = err as {
        response?: {
          data?: { message?: string; errors?: Record<string, string[]> };
        };
      };

      if (errorResponse?.response?.data) {
        const responseData = errorResponse.response.data;
        const fieldErrors: Record<string, string> = {};

        // Handle validation errors array format (common in NestJS)
        if (responseData.errors && typeof responseData.errors === 'object') {
          Object.entries(responseData.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              fieldErrors[field] = messages[0]; // Take first error message
            }
          });
        }

        // Handle single message format — show API message as-is, only decide which field
        if (responseData.message) {
          const msg = responseData.message;
          const lower = msg.toLowerCase();
          if (lower.includes('cnic')) fieldErrors.cnicNumber = msg;
          else if (lower.includes('phone')) fieldErrors.phone = msg;
          else if (lower.includes('email') || lower.includes('user'))
            fieldErrors.email = msg;
          else if (lower.includes('first')) fieldErrors.first_name = msg;
          else if (lower.includes('last')) fieldErrors.last_name = msg;
          else if (lower.includes('designation'))
            fieldErrors.designationId = msg;
          else if (lower.includes('password')) fieldErrors.password = msg;
          else fieldErrors.general = msg;
        }

        if (Object.keys(fieldErrors).length > 0) {
          return { success: false, errors: fieldErrors };
        }
      }

      // Generic error
      const errorResult = extractErrorMessage(err);

      // Check if this is a global tenant/department/designation error
      const isGlobalError =
        errorResult.message.toLowerCase().includes('global') ||
        errorResult.message
          .toLowerCase()
          .includes('does not belong to your organization') ||
        errorResult.message.toLowerCase().includes('invalid designation id');

      if (isGlobalError) {
        // For global errors, only show snackbar, don't set form error
        showError(errorResult.message);
        return { success: false }; // Return empty errors to avoid form display
      } else {
        // For other errors, show both snackbar and form error
        showError(errorResult.message);
        return { success: false, errors: { general: errorResult.message } };
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditOpen = useCallback((emp: Employee) => {
    setEditing(emp);
    setOpen(true);
  }, []);

  const handleUpdateEmployee = async (
    updates: Partial<EmployeeDto> & {
      designationId?: string;
      password?: string;
      role?: string;
      role_name?: string;
      team_id?: string;
      cnicNumber?: string;
      profilePicture?: File | null;
      cnicFrontPicture?: File | null;
      cnicBackPicture?: File | null;
    }
  ) => {
    if (!editing)
      return { success: false, errors: { general: 'No employee selected' } };

    try {
      setSubmitting(true);

      const nextDesignationId =
        updates.designationId && updates.designationId !== ''
          ? updates.designationId
          : editing.designationId;

      // Handle role update - check both role and role_name from form
      const nextRoleName =
        updates.role_name && updates.role_name.trim() !== ''
          ? updates.role_name.trim()
          : updates.role && updates.role.trim() !== ''
            ? updates.role.trim()
            : editing.role_name;

      const updatedEmployee = await employeeApi.updateEmployee(editing.id, {
        first_name: updates.first_name,
        last_name: updates.last_name,
        email: updates.email,
        phone: updates.phone,
        password: updates.password,
        designationId: nextDesignationId,
        role_name: nextRoleName,
        cnicNumber: updates.cnicNumber,
        profilePicture: updates.profilePicture,
        cnicFrontPicture: updates.cnicFrontPicture,
        cnicBackPicture: updates.cnicBackPicture,
      });

      // Update the employee in the list without reloading
      const designationName =
        designations[nextDesignationId] ||
        designations[editing.designationId] ||
        'Unknown Designation';

      // Get the department ID for the new designation from the designation list
      const newDesignation = designationList.find(
        desig => desig.id === nextDesignationId
      );
      const newDepartmentId =
        newDesignation?.departmentId ||
        updatedEmployee.departmentId ||
        editing.departmentId;
      const departmentName =
        departments[newDepartmentId] || 'Unknown Department';

      setAllEmployees(prev =>
        prev.map(emp =>
          emp.id === editing.id
            ? {
                ...emp,
                user_id: updatedEmployee.user_id || emp.user_id,
                name: updatedEmployee.name,
                firstName: updatedEmployee.firstName,
                lastName: updatedEmployee.lastName,
                email: updatedEmployee.email,
                phone: updatedEmployee.phone,
                departmentId: newDepartmentId,
                designationId: nextDesignationId,
                role_name:
                  updatedEmployee.role_name || nextRoleName || emp.role_name,
                status: updatedEmployee.status || emp.status,
                cnic_number: updatedEmployee.cnic_number || emp.cnic_number,
                profile_picture:
                  updatedEmployee.profile_picture || emp.profile_picture,
                cnic_picture: updatedEmployee.cnic_picture || emp.cnic_picture,
                cnic_back_picture:
                  updatedEmployee.cnic_back_picture || emp.cnic_back_picture,
                department: emp.department
                  ? {
                      ...emp.department,
                      id: newDepartmentId,
                      name: departmentName,
                    }
                  : {
                      id: newDepartmentId,
                      name: departmentName,
                      description: '',
                      tenantId: emp.tenantId,
                      createdAt: emp.createdAt,
                      updatedAt: emp.updatedAt,
                    },
                designation: emp.designation
                  ? {
                      ...emp.designation,
                      id: nextDesignationId,
                      title: designationName,
                      departmentId: newDepartmentId,
                    }
                  : {
                      id: nextDesignationId,
                      title: designationName,
                      tenantId: emp.tenantId,
                      departmentId: newDepartmentId,
                      createdAt: emp.createdAt,
                      updatedAt: emp.updatedAt,
                    },
                updatedAt: updatedEmployee.updatedAt,
              }
            : emp
        )
      );

      showSuccess('Employee updated successfully!');
      setOpen(false);
      setEditing(null);
      return { success: true };
    } catch (err: unknown) {
      const errorResult = extractErrorMessage(err);
      showError(errorResult.message);
      return { success: false, errors: { general: errorResult.message } };
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDocument = async (
    type: 'profile' | 'cnicFront' | 'cnicBack',
    url: string
  ) => {
    if (!editing) return;

    // 🚫 Restrict deletion of required documents in edit mode
    if (type === 'cnicFront' || type === 'cnicBack') {
      showError('CNIC documents are required and cannot be deleted.');
      return;
    }

    try {
      await employeeApi.deleteDocument(editing.id, url);

      // Update local state
      const updatedEditing = { ...editing };
      if (type === 'profile') updatedEditing.profile_picture = undefined;
      else if (type === 'cnicFront') updatedEditing.cnic_picture = undefined;
      else if (type === 'cnicBack')
        updatedEditing.cnic_back_picture = undefined;

      setEditing(updatedEditing);
      setAllEmployees(prev =>
        prev.map(emp => (emp.id === editing.id ? updatedEditing : emp))
      );

      showSuccess('Document deleted successfully!');
    } catch (err: unknown) {
      const errorResult = extractErrorMessage(err);
      showError(`Failed to delete document: ${errorResult.message}`);
      throw err; // Re-throw to inform the form component
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      await employeeApi.deleteEmployee(id);
      setAllEmployees(prev => prev.filter(emp => emp.id !== id));
      showSuccess('Employee deleted successfully!');
    } catch (error: unknown) {
      const errorResult = extractErrorMessage(error);
      showError(errorResult.message);
    }
  };

  // New: open confirmation before delete (accepts Employee or id)
  const requestDeleteEmployee = useCallback((toDelete: Employee | string) => {
    const id = typeof toDelete === 'string' ? toDelete : toDelete.id;
    const name = typeof toDelete === 'string' ? '' : toDelete.name;
    setPendingDeleteId(id);
    setPendingDeleteName(name || '');
    setConfirmOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    await handleDeleteEmployee(pendingDeleteId);
    setConfirmOpen(false);
    setPendingDeleteId(null);
    setPendingDeleteName('');
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setPendingDeleteId(null);
    setPendingDeleteName('');
  };

  const handleClearFilters = () => {
    setDepartmentFilter('');
    setDesignationFilter('');
  };

  const handleResendInvite = useCallback(
    async (employee: Employee) => {
      try {
        // Immediately update the status to "Invite Sent" in the local state
        setAllEmployees(prev =>
          prev.map(emp =>
            emp.id === employee.id ? { ...emp, status: 'Invite Sent' } : emp
          )
        );

        await employeeApi.resendInvite(employee.id);
        showSuccess(`Invite resent successfully to ${employee.name}!`);
      } catch (error: unknown) {
        // If API call fails, revert the status back to "Invite Expired"
        setAllEmployees(prev =>
          prev.map(emp =>
            emp.id === employee.id ? { ...emp, status: 'Invite Expired' } : emp
          )
        );

        const errorResult = extractErrorMessage(error);
        showError(errorResult.message);
      }
    },
    [showSuccess, showError]
  );

  const handleViewEmployee = useCallback((employee: Employee) => {
    setViewingEmployee(employee);
    setViewModalOpen(true);
  }, []);

  // Handle viewing employee from navigation state (e.g., from search)
  useEffect(() => {
    const state = location.state as {
      employeeId?: string;
      viewEmployee?: boolean;
    } | null;
    if (state?.employeeId && state?.viewEmployee) {
      // First try to find in already loaded employees
      if (allEmployees.length > 0) {
        const employee = allEmployees.find(emp => emp.id === state.employeeId);
        if (employee) {
          setViewingEmployee(employee);
          setViewModalOpen(true);
          // Clear the state to prevent re-opening on re-render
          navigate(location.pathname, { replace: true, state: {} });
          return;
        }
      }

      // Employee not found in list or list not loaded yet, fetch it directly
      const fetchAndViewEmployee = async () => {
        try {
          const employeeData = await employeeApi.getEmployeeById(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- employeeId is checked truthy in the parent condition
            state.employeeId!
          );
          const employeeToView: Employee = {
            id: employeeData.id,
            user_id: employeeData.user_id,
            name: employeeData.name,
            firstName: employeeData.firstName,
            lastName: employeeData.lastName,
            email: employeeData.email,
            phone: employeeData.phone,
            departmentId: employeeData.departmentId,
            designationId: employeeData.designationId,
            role_name: employeeData.role_name,
            status: employeeData.status,
            cnic_number: employeeData.cnic_number,
            profile_picture: employeeData.profile_picture,
            cnic_picture: employeeData.cnic_picture,
            cnic_back_picture: employeeData.cnic_back_picture,
            department: employeeData.department,
            designation: employeeData.designation,
            tenantId: employeeData.tenantId,
            createdAt: employeeData.createdAt,
            updatedAt: employeeData.updatedAt,
          };
          setViewingEmployee(employeeToView);
          setViewModalOpen(true);
          // Clear the state to prevent re-opening on re-render
          navigate(location.pathname, { replace: true, state: {} });
        } catch (error) {
          const errorResult = extractErrorMessage(error);
          showError(errorResult.message);
          // Clear the state even on error
          navigate(location.pathname, { replace: true, state: {} });
        }
      };
      fetchAndViewEmployee();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, allEmployees, navigate]);

  // Server-driven filtering; render employees as-is

  const getLabel = (en: string, ar: string) => (direction === 'rtl' ? ar : en);

  // Delete modal texts
  const deleteTitle = getLabel('Confirm Delete', 'تأكيد الحذف');
  const deleteMessage = pendingDeleteName
    ? getLabel(
        `Are you sure you want to delete employee "${pendingDeleteName}"? This action cannot be undone.`,
        `هل أنت متأكد أنك تريد حذف الموظف "${pendingDeleteName}"؟ لا يمكن التراجع عن هذا الإجراء.`
      )
    : getLabel(
        'Are you sure you want to delete this employee? This action cannot be undone.',
        'هل أنت متأكد أنك تريد حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء.'
      );

  const token = localStorage.getItem('token');
  const filters: Record<string, string> = {};
  if (departmentFilter && departmentFilter !== 'all')
    filters.department_id = departmentFilter;
  if (designationFilter && designationFilter !== 'all')
    filters.designation_id = designationFilter;

  // Build absolute media URL from backend path
  const API_BASE_URL = env.apiBaseUrl;
  const toAbsoluteUrl = (path?: string | null) => {
    if (!path) return '';
    const trimmed = path.trim();
    const isAbsolute = /^https?:\/\//i.test(trimmed);
    const base = API_BASE_URL.replace(/\/$/, '');
    const url = isAbsolute
      ? trimmed
      : `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
    return `${url}?t=${Date.now()}`;
  };

  return (
    <Box>
      <AppPageTitle>Employee List</AppPageTitle>
      {/* Add Employee Button */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='flex-start'
        flexWrap='wrap'
        flexDirection={isMobile ? 'column' : 'row'}
        gap={2}
        mb={2}
        sx={isTablet ? { overflowX: 'hidden' } : undefined}
      >
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={isTablet ? 1 : 2}
          sx={{
            flex: 1,
            width: isMobile ? '100%' : 'auto',
          }}
        >
          {/* Department Filter */}
          <AppDropdown
            label={getLabel('Department', 'القسم')}
            showLabel={false}
            placeholder={getLabel('All Departments', 'كل الأقسام')}
            inputBackgroundColor={controlBg}
            value={departmentFilter === '' ? 'all' : departmentFilter}
            onChange={e => {
              setDepartmentFilter(String(e.target.value));
              setDesignationFilter(''); // Reset designation on department change
            }}
            options={[
              {
                value: 'all',
                label: getLabel('All Departments', 'كل الأقسام'),
              },
              ...departmentList.map(dept => ({
                value: dept.id,
                label: dept.name,
              })),
            ]}
            containerSx={{
              width: isMobile ? '100%' : isTablet ? '22%' : 190,
              my: 0.5,
              flex: isMobile ? '0 0 100%' : isTablet ? '0 0 22%' : undefined,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                direction: direction === 'rtl' ? 'rtl' : 'ltr',
              },
              '& .MuiSelect-select, & .MuiInputBase-input': {
                fontSize: 'var(--body-font-size)',
                lineHeight: 'var(--body-line-height)',
                letterSpacing: 'var(--body-letter-spacing)',
                fontWeight: 400,
              },
            }}
          />

          {/* Designation Filter - options based on selected department */}
          <AppDropdown
            label={getLabel('Designation', 'المسمى الوظيفي')}
            showLabel={false}
            placeholder={
              departmentFilter && departmentFilter !== 'all'
                ? getLabel('All Designations', 'كل المسميات')
                : getLabel('Select department first', 'اختر القسم أولاً')
            }
            inputBackgroundColor={controlBg}
            value={designationFilter === '' ? 'all' : designationFilter}
            onChange={e => setDesignationFilter(String(e.target.value))}
            options={[
              {
                value: 'all',
                label: getLabel('All Designations', 'كل المسميات'),
              },
              ...designationsForSelectedDepartment.map(des => ({
                value: des.id,
                label: des.title,
              })),
            ]}
            disabled={!departmentFilter || departmentFilter === 'all'}
            containerSx={{
              width: isMobile ? '100%' : isTablet ? '22%' : 190,
              my: 0.5,
              flex: isMobile ? '0 0 100%' : isTablet ? '0 0 22%' : undefined,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                direction: direction === 'rtl' ? 'rtl' : 'ltr',
              },
              '& .MuiSelect-select, & .MuiInputBase-input': {
                fontSize: 'var(--body-font-size)',
                lineHeight: 'var(--body-line-height)',
                letterSpacing: 'var(--body-letter-spacing)',
                fontWeight: 400,
              },
            }}
          />

          <AppButton
            variant='outlined'
            variantType='secondary'
            onClick={handleClearFilters}
            sx={{
              fontSize: 'var(--body-font-size)',
              lineHeight: 'var(--body-line-height)',
              letterSpacing: 'var(--body-letter-spacing)',
              fontWeight: 400,
              width: isMobile ? '100%' : isTablet ? '26%' : 'auto',
              minWidth: isTablet ? 130 : undefined,
              height: isTablet ? '47px' : undefined,
              alignSelf: isMobile ? 'stretch' : 'flex-end',

              // ✅ text & border color
              color: 'var(--primary-dark-color)',
              borderColor: 'var(--primary-dark-color)',

              '&:hover': {
                borderColor: 'var(--primary-dark-color)',
                backgroundColor: 'transparent',
              },
            }}
          >
            {getLabel('Clear Filters', 'مسح الفلاتر')}
          </AppButton>

          {/* Add Employee Button */}
          <AppButton
            variant='contained'
            variantType='primary'
            startIcon={<AddIcon />}
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            sx={{
              fontSize: 'var(--body-font-size)',
              lineHeight: 'var(--body-line-height)',
              letterSpacing: 'var(--body-letter-spacing)',
              boxShadow: 'none',
              minWidth: { xs: 'auto', sm: 200 },
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.75, sm: 1 },
              '& .MuiButton-startIcon': {
                marginRight: { xs: 0.5, sm: 1 },
                '& > *:nth-of-type(1)': {
                  fontSize: { xs: '1.125rem', sm: '1.25rem' },
                },
              },
            }}
          >
            <Box
              component='span'
              sx={{ display: { xs: 'none', sm: 'inline' } }}
            >
              {getLabel('Add Employee', 'إضافة موظف')}
            </Box>
            <Box
              component='span'
              sx={{ display: { xs: 'inline', sm: 'none' } }}
            >
              {getLabel('Add', 'إضافة')}
            </Box>
          </AppButton>
        </Stack>
        <Box display='flex' justifyContent='flex-end'>
          <Tooltip title='Export Employees CSV'>
            <IconButton
              color='primary'
              onClick={() =>
                exportCSV(
                  '/employees/export',
                  'employees.csv',
                  token || '',
                  filters
                )
              }
              sx={{
                backgroundColor: 'primary.main',
                borderRadius: '6px',
                padding: '6px',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Employee List */}
      <Paper
        elevation={3}
        sx={{ boxShadow: 'none', backgroundColor: 'transparent' }}
      >
        <EmployeeList
          employees={employees}
          onDelete={requestDeleteEmployee}
          onEdit={handleEditOpen}
          onResendInvite={handleResendInvite}
          onView={handleViewEmployee}
          loading={loading}
          departments={departments}
          designations={designations}
        />
      </Paper>

      {/* Pagination */}
      {(() => {
        // Get current page record count
        const currentPageRowsCount = employees.length;

        // Pagination buttons logic:
        // - On first page: Only show if current page has full limit (to indicate more pages exist)
        // - On other pages (including last page): Always show if there are multiple pages
        // But don't show if current page has no records (invalid page)
        const shouldShowPagination =
          totalPages > 1 &&
          currentPageRowsCount > 0 && // Don't show if current page has no records
          (currentPage === 1
            ? currentPageRowsCount === itemsPerPage // First page: only show if full limit
            : true); // Other pages: always show if totalPages > 1 and has records

        // Ensure we only show pages that have actual data
        // For example: 50 records with limit 25 = exactly 2 pages (not 3)
        // Recalculate to ensure accuracy - no empty pages
        const exactTotalPages =
          totalItems > 0 && itemsPerPage > 0
            ? Math.ceil(totalItems / itemsPerPage)
            : 1;

        // Use the exact calculated pages (no rounding errors)
        const finalTotalPages = exactTotalPages;

        return shouldShowPagination && finalTotalPages > 1 ? (
          <Box display='flex' justifyContent='center' mt={2}>
            <Pagination
              count={finalTotalPages}
              page={Math.min(currentPage, finalTotalPages)}
              onChange={(_, page) => {
                // Ensure page doesn't exceed valid total pages
                const validPage = Math.min(page, finalTotalPages);
                handlePageChange(validPage);
              }}
              color='primary'
              showFirstButton
              showLastButton
            />
          </Box>
        ) : null;
      })()}

      {/* Pagination Info */}
      {totalItems > 0 && (
        <Box display='flex' justifyContent='center' mt={1}>
          <Typography variant='body2' color='textSecondary'>
            {getLabel(
              `Showing page ${currentPage} of ${totalPages} (${totalItems} total records)`,
              `عرض الصفحة ${currentPage} من ${totalPages} (${totalItems} سجل إجمالي)`
            )}
          </Typography>
        </Box>
      )}

      {/* Notifications */}
      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />

      {/* Delete Confirmation - Department modal style */}
      <Dialog
        open={confirmOpen}
        onClose={cancelDelete}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            direction: direction === 'rtl' ? 'rtl' : 'ltr',
            backgroundColor: bgColor,
            color: textColor,
            border: `1px solid ${borderColor}`,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1, color: textColor }}>
          {deleteTitle}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center' }}>
            <WarningIcon
              sx={{
                fontSize: { xs: 48, sm: 64 },
                color: 'warning.main',
                mb: 2,
              }}
            />
            <Typography
              variant='body1'
              sx={{ mb: 2, lineHeight: 1.6, color: textColor }}
            >
              {deleteMessage}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', p: 3, pt: 1 }}>
          <AppButton
            onClick={cancelDelete}
            variant='outlined'
            variantType='secondary'
            sx={{ color: textColor, borderColor }}
          >
            {getLabel('Cancel', 'إلغاء')}
          </AppButton>
          <AppButton
            onClick={confirmDelete}
            variant='contained'
            variantType='danger'
          >
            {getLabel('Delete', 'حذف')}
          </AppButton>
        </DialogActions>
      </Dialog>

      {/* Modal with AddEmployeeForm (AppFormModal wrapper for consistent styling) */}
      <AppFormModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={
          editing
            ? getLabel('Edit Employee', 'تعديل الموظف')
            : getLabel('Add New Employee', 'إضافة موظف جديد')
        }
        maxWidth='md'
        isRtl={direction === 'rtl'}
        hideActions
        wrapInForm={false}
        paperSx={{
          width: { xs: '100%', sm: '90%', md: '900px', lg: '900px' },
          maxWidth: { xs: '100%', sm: '90%', md: '900px', lg: '900px' },
        }}
      >
        <AddEmployeeForm
          key={editing ? `edit-${editing.id}` : 'create'}
          onSubmit={editing ? handleUpdateEmployee : handleAddEmployee}
          onDeleteDocument={editing ? handleDeleteDocument : undefined}
          submitting={submitting}
          initialData={
            editing
              ? {
                  id: editing.id,
                  firstName: editing.firstName,
                  lastName: editing.lastName,
                  email: editing.email,
                  phone: editing.phone,
                  designationId: editing.designationId,
                  departmentId: editing.departmentId,
                  gender: editing.status === 'Active' ? 'male' : 'female', // Default/estimate since not in employee
                  role: (editing.role_name || '').trim() || 'Employee',
                  role_name: editing.role_name,
                  cnicNumber: editing.cnic_number,
                  profilePicture: editing.profile_picture,
                  cnicFrontPicture: editing.cnic_picture,
                  cnicBackPicture: editing.cnic_back_picture,
                }
              : null
          }
        />
      </AppFormModal>

      {/* Employee View Modal */}
      <EmployeeViewModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setViewingEmployee(null);
        }}
        employee={viewingEmployee}
      />
    </Box>
  );
};

// Export default component only
export default EmployeeManager;
