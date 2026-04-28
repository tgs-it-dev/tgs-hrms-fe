import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  CircularProgress,
  Stack,
  Tooltip,
  useMediaQuery,
  Pagination,
} from '@mui/material';
import AppDropdown from '../common/AppDropdown';
import AppButton from '../common/AppButton';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import { useTheme } from '@mui/material/styles';
import systemEmployeeApiService, {
  type SystemEmployee,
} from '../../api/systemEmployeeApi';
import {
  designationApiService,
  type BackendDesignation,
} from '../../api/designationApi';
import {
  departmentApiService,
  type BackendDepartment,
} from '../../api/departmentApi';
import SystemEmployeeProfileView from './SystemEmployeeProfileView';
import { formatDate } from '../../utils/dateUtils';
import employeeApi from '../../api/employeeApi';
import { PAGINATION } from '../../constants/appConstants';
import AppTable from '../common/AppTable';
import { Icons } from '../../assets/icons';

type EmployeeWithTenantName = SystemEmployee & {
  tenantName: string;
  departmentName?: string;
  designationTitle?: string;
};

const TenantBasedEmployeeManager: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeWithTenantName[]>([]);
  const [departments, setDepartments] = useState<BackendDepartment[]>([]);
  const [designations, setDesignations] = useState<BackendDesignation[]>([]);
  const [tenants, setTenants] = useState<SystemEmployee[]>([]);

  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    tenantId: '',
    departmentId: '',
    designationId: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = PAGINATION.DEFAULT_PAGE_SIZE;

  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeWithTenantName | null>(null);
  const [openProfile, setOpenProfile] = useState(false);
  const [tenantsLoaded, setTenantsLoaded] = useState(false);
  const initialLoadDoneRef = useRef(false);
  const isLoadingRef = useRef(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery('(min-width:601px) and (max-width:786px)');

  // Fetch tenants once on mount; departments are loaded when tenant is selected
  const fetchFiltersData = async () => {
    try {
      const tenantRes = await systemEmployeeApiService.getAllTenants(true);
      setTenants(tenantRes || []);
      setTenantsLoaded(true);
    } catch {
      // Leave filters empty if loading fails
    }
  };

  // Fetch departments for the selected tenant only (system admin: departments by tenant)
  const fetchDepartmentsByTenant = async (tenantId: string) => {
    if (!tenantId) {
      setDepartments([]);
      return;
    }
    try {
      const res =
        await departmentApiService.getAllTenantsWithDepartments(tenantId);
      const tenantData = res?.tenants?.find(
        t => t.tenant_id === tenantId || String(t.tenant_id) === tenantId
      );
      const deptList = tenantData?.departments ?? [];
      const mapped: BackendDepartment[] = deptList.map(d => ({
        id: d.id,
        tenantId,
        name: d.name,
        description: d.description,
        createdAt: d.created_at ? new Date(d.created_at) : new Date(),
        updatedAt: d.created_at ? new Date(d.created_at) : new Date(),
      }));
      setDepartments(mapped);
    } catch {
      setDepartments([]);
    }
  };

  // Fetch designations for department dropdown
  const fetchDesignationsByDepartment = async (departmentId: string) => {
    if (!departmentId) {
      setDesignations([]);
      return;
    }
    try {
      const res = await designationApiService.getDesignationsByDepartment(
        departmentId,
        null
      );
      setDesignations(res.items || []);
    } catch {
      // Leave designations empty if loading fails
    }
  };

  // Fetch employees - only when tenants are loaded and filters/page change
  const fetchEmployees = async () => {
    // Prevent duplicate calls
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {
        page: currentPage,
      };
      if (filters.tenantId) params.tenantId = filters.tenantId;
      if (filters.departmentId) params.departmentId = filters.departmentId;
      if (filters.designationId) params.designationId = filters.designationId;

      const res = await systemEmployeeApiService.getSystemEmployees(params);
      const employeesData: SystemEmployee[] = Array.isArray(res)
        ? res
        : res.items || [];

      // Map flat API fields to include tenantName (match by tenantId)
      const mapped: EmployeeWithTenantName[] = employeesData.map(emp => {
        const e = emp as unknown as Record<string, unknown>;
        const tenantId =
          (typeof e.tenantId === 'string' && e.tenantId) ||
          (typeof e.tenant_id === 'string' && e.tenant_id) ||
          (typeof e.tenant === 'object' &&
            e.tenant &&
            typeof (e.tenant as Record<string, unknown>).id === 'string' &&
            (e.tenant as Record<string, unknown>).id) ||
          undefined;

        const matchedTenant = tenants.find(t => t.id === String(tenantId));

        // Safely read departmentName / designationTitle from backend shapes
        const departmentName =
          typeof e.departmentName === 'string'
            ? e.departmentName
            : typeof e.department_name === 'string'
              ? e.department_name
              : '';

        const designationTitle =
          typeof e.designationTitle === 'string'
            ? e.designationTitle
            : typeof e.designation_title === 'string'
              ? e.designation_title
              : '';

        return {
          ...emp,
          tenantName: matchedTenant ? matchedTenant.name : '', // Tenant name if available
          departmentName,
          designationTitle,
        };
      });

      setEmployees(mapped);

      // pagination info
      if (!Array.isArray(res) && typeof res.totalPages !== 'undefined') {
        setTotalPages(res.totalPages || 1);
        setTotalRecords(res.total || mapped.length);
      } else {
        // fallback estimate
        const hasMore = mapped.length === itemsPerPage;
        setTotalPages(hasMore ? currentPage + 1 : currentPage);
        setTotalRecords(
          hasMore
            ? currentPage * itemsPerPage
            : (currentPage - 1) * itemsPerPage + mapped.length
        );
      }
    } catch {
      setEmployees([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  // mount: load tenants first (departments load when tenant is selected)
  useEffect(() => {
    fetchFiltersData();
  }, []);

  // When tenant is selected, load that tenant's departments only
  useEffect(() => {
    if (filters.tenantId) {
      fetchDepartmentsByTenant(filters.tenantId);
    } else {
      setDepartments([]);
    }
  }, [filters.tenantId]);

  useEffect(() => {
    if (filters.departmentId)
      fetchDesignationsByDepartment(filters.departmentId);
    else setDesignations([]);
  }, [filters.departmentId]);

  // No need to update tenant names separately - they're included when employees are fetched

  // Track previous filter values to detect actual changes
  const prevFiltersRef = useRef({
    tenantId: '',
    departmentId: '',
    designationId: '',
    currentPage: 1,
  });

  // Load employees ONLY after tenants are loaded, and when filters/page change
  // This prevents reload when tenants load
  useEffect(() => {
    // Wait for tenants to load first - don't fetch employees until tenants are ready
    if (!tenantsLoaded) {
      return;
    }

    // Check if filters or page actually changed
    const filtersChanged =
      prevFiltersRef.current.tenantId !== filters.tenantId ||
      prevFiltersRef.current.departmentId !== filters.departmentId ||
      prevFiltersRef.current.designationId !== filters.designationId ||
      prevFiltersRef.current.currentPage !== currentPage;

    // On initial load, fetch employees once
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      prevFiltersRef.current = {
        tenantId: filters.tenantId,
        departmentId: filters.departmentId,
        designationId: filters.designationId,
        currentPage: currentPage,
      };
      fetchEmployees();
      return;
    }

    // When filters or page change, fetch employees
    // But only if filters actually changed and not already loading
    if (filtersChanged && !isLoadingRef.current) {
      prevFiltersRef.current = {
        tenantId: filters.tenantId,
        departmentId: filters.departmentId,
        designationId: filters.designationId,
        currentPage: currentPage,
      };
      fetchEmployees();
    }
    // Note: We wait for tenantsLoaded before fetching employees
    // Tenant names are included when employees are fetched
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tenantsLoaded,
    filters.tenantId,
    filters.departmentId,
    filters.designationId,
    currentPage,
  ]);

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'tenantId') {
      setFilters(prev => ({
        ...prev,
        tenantId: value,
        departmentId: '',
        designationId: '',
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [key]: value,
        ...(key === 'departmentId' ? { designationId: '' } : {}),
      }));
    }
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ tenantId: '', departmentId: '', designationId: '' });
    setCurrentPage(1);
  };

  const handleDownload = async () => {
    try {
      // Use backend API to export employees CSV
      const tenantId = filters.tenantId || undefined;
      const departmentId = filters.departmentId || undefined;
      const designationId = filters.designationId || undefined;
      const blob = await employeeApi.exportSystemEmployeesCSV(
        tenantId,
        departmentId,
        designationId
      );

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = tenantId
        ? `employees_tenant_${tenantId}.csv`
        : 'employees_all_tenants.csv';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export employees. Please try again.');
    }
  };

  const handleOpenProfile = (employee: EmployeeWithTenantName) => {
    setSelectedEmployee(employee);
    setOpenProfile(true);
  };

  // styling vars removed (unused)

  const hasMorePages = employees.length === itemsPerPage;
  const estimatedTotalRecords =
    totalRecords ||
    (hasMorePages
      ? currentPage * itemsPerPage
      : (currentPage - 1) * itemsPerPage + employees.length);
  const estimatedTotalPages =
    totalPages || (hasMorePages ? currentPage + 1 : currentPage);

  return (
    <Box>
      <Typography
        variant='h4'
        fontWeight={600}
        fontSize={{ xs: '32px', lg: '48px' }}
        mb={3}
      >
        Employee List
      </Typography>

      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='flex-start'
        flexWrap={isMobile ? 'wrap' : 'nowrap'}
        flexDirection={isMobile ? 'column' : 'row'}
        gap={2}
        mb={2}
      >
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={2}
          sx={{
            flex: 1,
            width: isMobile ? '100%' : 'auto',
            alignItems: isMobile ? 'stretch' : 'flex-start',
          }}
        >
          <AppDropdown
            label='Tenant'
            options={[
              { value: 'All Tenants', label: 'All Tenants' },
              ...tenants.map(t => ({ value: t.id, label: t.name })),
            ]}
            value={filters.tenantId}
            onChange={e =>
              handleFilterChange('tenantId', String(e.target.value))
            }
            containerSx={{ width: isMobile ? '100%' : isTablet ? '30%' : 190 }}
          />

          <AppDropdown
            label='Department'
            options={[
              { value: 'All Departments', label: 'All Departments' },
              ...departments.map(d => ({ value: d.id, label: d.name })),
            ]}
            value={filters.departmentId}
            onChange={e =>
              handleFilterChange('departmentId', String(e.target.value))
            }
            disabled={!filters.tenantId}
            containerSx={{ width: isMobile ? '100%' : isTablet ? '30%' : 190 }}
          />

          <AppDropdown
            label='Designation'
            options={[
              { value: 'All Designations', label: 'All Designations' },
              ...designations.map(des => ({ value: des.id, label: des.title })),
            ]}
            value={filters.designationId}
            onChange={e =>
              handleFilterChange('designationId', String(e.target.value))
            }
            disabled={!filters.departmentId}
            containerSx={{ width: isMobile ? '100%' : isTablet ? '30%' : 190 }}
          />

          <AppButton
            variant='outlined'
            variantType='secondary'
            onClick={handleClearFilters}
            sx={{
              width: isMobile ? '100%' : isTablet ? '30%' : 190,
              minWidth: isTablet ? 140 : undefined,
              // height: '47px',
              padding: isMobile ? undefined : '6px 15px',
              alignSelf: isMobile ? 'stretch' : 'flex-end',
              borderColor: 'var(--primary-dark-color)',
              color: 'var(--primary-dark-color)',
            }}
          >
            Clear Filters
          </AppButton>
        </Stack>

        <Box
          sx={{
            width: isMobile ? '100%' : 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isMobile ? 'flex-start' : 'flex-end',
            alignSelf: isMobile ? 'stretch' : 'flex-end',
          }}
        >
          <Tooltip title='Export Employee List'>
            <IconButton
              onClick={handleDownload}
              sx={{
                backgroundColor: 'var(--primary-dark-color)',
                borderRadius: '6px',
                padding: '6px',
                color: 'white',
                '&:hover': { backgroundColor: 'var(--primary-dark-color)' },
              }}
            >
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <AppTable>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Tenant</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Designation</TableCell>
            <TableCell>Invite Status</TableCell>
            <TableCell>Created At</TableCell>
            <TableCell align='center'>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} align='center'>
                <CircularProgress sx={{ color: 'var(--primary-dark-color)' }} />
              </TableCell>
            </TableRow>
          ) : employees.length ? (
            employees.map(emp => (
              <TableRow key={emp.id}>
                <TableCell>{emp.name}</TableCell>
                <TableCell>{emp.tenantName || <em>—</em>}</TableCell>
                <TableCell>{emp.departmentName || <em>—</em>}</TableCell>
                <TableCell>{emp.designationTitle || <em>—</em>}</TableCell>
                <TableCell>{emp.status}</TableCell>
                <TableCell>
                  {emp.createdAt ? formatDate(emp.createdAt) : 'N/A'}
                </TableCell>
                <TableCell align='center'>
                  <Tooltip title='View'>
                    <IconButton onClick={() => handleOpenProfile(emp)}>
                      <Box
                        component='img'
                        src={Icons.password}
                        alt='View'
                        sx={{
                          width: { xs: 16, sm: 20 },
                          height: { xs: 16, sm: 20 },
                        }}
                      />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} align='center'>
                No employees found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </AppTable>

      {openProfile && selectedEmployee && (
        <SystemEmployeeProfileView
          open={openProfile}
          onClose={() => {
            setOpenProfile(false);
            setSelectedEmployee(null);
          }}
          employeeId={selectedEmployee.id}
        />
      )}

      {estimatedTotalPages > 1 && (
        <Box display='flex' justifyContent='center' mt={2} mb={1}>
          <Pagination
            count={estimatedTotalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color='primary'
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {employees.length > 0 && (
        <Box display='flex' justifyContent='center' mb={2}>
          <Typography variant='body2' color='textSecondary'>
            Showing page {currentPage} of {estimatedTotalPages} (
            {estimatedTotalRecords} total records)
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TenantBasedEmployeeManager;
