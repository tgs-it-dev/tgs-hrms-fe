import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Pagination,
  useTheme,
} from '@mui/material';
import AppTable from '../common/AppTable';
import { Add as AddIcon } from '@mui/icons-material';
import AppDropdown from '../common/AppDropdown';
import { Icons } from '../../assets/icons';

import AppFormModal, { type FormField } from '../common/AppFormModal';
import AppButton from '../common/AppButton';
import DeleteConfirmationDialog from '../common/DeleteConfirmationDialog';
import { useLanguage } from '../../hooks/useLanguage';
import AppPageTitle from '../common/AppPageTitle';
import {
  designationApiService,
  type FrontendDesignation,
} from '../../api/designationApi';
import {
  departmentApiService,
  type FrontendDepartment,
} from '../../api/departmentApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import {
  isSystemAdmin as isSystemAdminFn,
  isHRAdmin as isHRAdminFn,
} from '../../utils/roleUtils';
import type { SystemTenant } from '../../types/tenant';
import systemEmployeeApiService from '../../api/systemEmployeeApi';
import { PAGINATION } from '../../constants/appConstants';
import { useUser } from '../../hooks/useUser';

export default function DesignationManager() {
  const theme = useTheme();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  // Get user role
  const { user } = useUser();
  const userRoleValue = user?.role;
  const isSystemAdmin = isSystemAdminFn(userRoleValue);
  const isHRAdmin = isHRAdminFn(userRoleValue);
  const [designations, setDesignations] = useState<FrontendDesignation[]>([]);
  const [departments, setDepartments] = useState<FrontendDepartment[]>([]);
  const [designationTenantMap, setDesignationTenantMap] = useState<
    Map<string, { tenantId: string; tenantName: string }>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] =
    useState<FrontendDesignation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [designationToDelete, setDesignationToDelete] =
    useState<FrontendDesignation | null>(null);
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalTitleAr, setOriginalTitleAr] = useState('');
  const [originalDepartmentId, setOriginalDepartmentId] = useState('');
  const [errors, setErrors] = useState<{
    title?: string;
    titleAr?: string;
    departmentId?: string;
  }>({});
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | 'all'
  >('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [allTenants, setAllTenants] = useState<SystemTenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all');
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const itemsPerPage = PAGINATION.DEFAULT_PAGE_SIZE;
  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();

  const getText = (en: string, ar: string) => (language === 'ar' ? ar : en);

  // Fetch tenants for system admin
  useEffect(() => {
    if (!isSystemAdmin) return;

    const fetchTenants = async () => {
      try {
        setLoadingTenants(true);
        // Use the same API as Employee List to get all tenants
        const data = await systemEmployeeApiService.getAllTenants(true);
        // Show all tenants (no filtering) - same as Employee List
        setAllTenants(data || []);
      } catch {
        // Ignore; tenant filter list will simply be empty
      } finally {
        setLoadingTenants(false);
      }
    };

    fetchTenants();
  }, [isSystemAdmin]);

  const fetchDepartments = useCallback(async () => {
    try {
      setDepartmentsLoading(true);
      const backendDepartments = await departmentApiService.getAllDepartments();
      const frontendDepartments = backendDepartments.map(department =>
        departmentApiService.convertBackendToFrontend(department)
      );
      setDepartments(frontendDepartments);
    } catch (error: unknown) {
      showError(error, { operation: 'fetch', resource: 'department' });
    } finally {
      setDepartmentsLoading(false);
    }
  }, [showError]);

  const fetchDesignations = useCallback(
    async (departmentId: string, page: number = 1) => {
      try {
        setLoading(true);
        const response =
          await designationApiService.getDesignationsByDepartment(
            departmentId,
            page
          );
        const frontendDesignations = response.items.map(designation =>
          designationApiService.convertBackendToFrontend(designation)
        );
        setDesignations(frontendDesignations);

        const hasMorePages = response.items.length === itemsPerPage;

        if (response.totalPages && response.total) {
          setCurrentPage(response.page);
          setTotalRecords(response.total);
        } else {
          setCurrentPage(response.page || page);
          setTotalRecords(
            hasMorePages
              ? page * itemsPerPage
              : (page - 1) * itemsPerPage + response.items.length
          );
        }
      } catch (error: unknown) {
        showError(error, { operation: 'fetch', resource: 'designation' });
        setDesignations([]);
      } finally {
        setLoading(false);
      }
    },
    [showError, itemsPerPage]
  );

  // Fetch designations for system admin
  const fetchSystemAdminDesignations = useCallback(async () => {
    try {
      setLoading(true);
      // Pass tenant_id only if a specific tenant is selected (not "all")
      const tenantIdParam =
        selectedTenantId && selectedTenantId !== 'all'
          ? selectedTenantId
          : undefined;
      const response =
        await designationApiService.getAllTenantsWithDesignations(
          tenantIdParam
        );

      // Flatten designations from all tenants or selected tenant
      const allDesignations: FrontendDesignation[] = [];
      const allDepartmentsMap = new Map<string, FrontendDepartment>();
      const tenantMap = new Map<
        string,
        { tenantId: string; tenantName: string }
      >();

      response.tenants.forEach(tenant => {
        // If "All Tenants" is selected or no tenant selected, show all designations
        // Otherwise, only show designations from selected tenant
        if (
          selectedTenantId === 'all' ||
          !selectedTenantId ||
          tenant.tenant_id === selectedTenantId
        ) {
          tenant.departments.forEach(dept => {
            // Add department to map if not already present
            if (!allDepartmentsMap.has(dept.department_id)) {
              allDepartmentsMap.set(dept.department_id, {
                id: dept.department_id,
                name: dept.department_name,
                nameAr: '',
                description: '',
                descriptionAr: '',
              });
            }

            // Add designations
            dept.designations.forEach(des => {
              allDesignations.push({
                id: des.id,
                title: des.title,
                titleAr: '',
                departmentId: dept.department_id,
              });
              // Store tenant info for this designation
              tenantMap.set(des.id, {
                tenantId: tenant.tenant_id,
                tenantName: tenant.tenant_name,
              });
            });
          });
        }
      });

      setDesignations(allDesignations);
      setDepartments(Array.from(allDepartmentsMap.values()));
      setDesignationTenantMap(tenantMap);
      setTotalRecords(allDesignations.length);
      setCurrentPage(1);
    } catch (error: unknown) {
      showError(error, { operation: 'fetch', resource: 'designation' });
      setDesignations([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTenantId, showError]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (isSystemAdmin) {
      // For system admin, pagination is handled client-side
      return;
    }
    if (selectedDepartmentId !== 'all') {
      fetchDesignations(selectedDepartmentId, page);
    }
    // For 'all', pagination is handled client-side, so no need to fetch
  };

  const fetchAllDesignations = useCallback(async () => {
    try {
      setLoading(true);
      const backendDesignations =
        await designationApiService.getAllDesignations();
      const frontendDesignations = backendDesignations.map(designation =>
        designationApiService.convertBackendToFrontend(designation)
      );
      setDesignations(frontendDesignations);
      // Reset pagination when fetching all designations
      setCurrentPage(1);
      setTotalRecords(frontendDesignations.length);
    } catch (error: unknown) {
      console.error('Error fetching all designations:', error);
      showError(error, { operation: 'fetch', resource: 'designation' });
      setDesignations([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    if (isSystemAdmin) {
      fetchSystemAdminDesignations();
    } else {
      setCurrentPage(1);
      if (selectedDepartmentId !== 'all') {
        fetchDesignations(selectedDepartmentId, 1);
      } else {
        fetchAllDesignations();
      }
    }
  }, [
    isSystemAdmin,
    selectedDepartmentId,
    selectedTenantId,
    fetchDesignations,
    fetchAllDesignations,
    fetchSystemAdminDesignations,
  ]);

  // Form state management
  useEffect(() => {
    if (editingDesignation) {
      setTitle(editingDesignation.title);
      setTitleAr(editingDesignation.titleAr || '');
      setDepartmentId(editingDesignation.departmentId);
      setOriginalTitle(editingDesignation.title);
      setOriginalTitleAr(editingDesignation.titleAr || '');
      setOriginalDepartmentId(editingDesignation.departmentId);
    } else {
      setTitle('');
      setTitleAr('');
      setDepartmentId('');
      setOriginalTitle('');
      setOriginalTitleAr('');
      setOriginalDepartmentId('');
    }
    setErrors({});
  }, [editingDesignation, modalOpen]);

  const hasChanges = editingDesignation
    ? title !== originalTitle ||
    titleAr !== originalTitleAr ||
    departmentId !== originalDepartmentId
    : title.trim() !== '' || titleAr.trim() !== '' || departmentId !== '';

  // Disable Create/Update until required fields are present (and basic validation passes)
  const isFormValid =
    title.trim().length > 0 &&
    departmentId.trim().length > 0 &&
    (!titleAr.trim() || titleAr.trim().length >= 2);

  const validateForm = () => {
    const newErrors: {
      title?: string;
      titleAr?: string;
      departmentId?: string;
    } = {};

    if (!title.trim()) {
      newErrors.title = getText(
        'Designation title is required',
        'عنوان المسمى الوظيفي مطلوب'
      );
    }

    if (!editingDesignation && !departmentId) {
      newErrors.departmentId = getText(
        'Please select a department',
        'يرجى اختيار قسم'
      );
    }

    if (titleAr.trim() && titleAr.trim().length < 2) {
      newErrors.titleAr = getText(
        'Arabic title must be at least 2 characters',
        'العنوان بالعربية يجب أن يكون على الأقل حرفين'
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = () => {
    if (validateForm()) {
      handleSaveDesignation({
        title: title.trim(),
        titleAr: titleAr.trim(),
        departmentId,
      });
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingDesignation(null);
  };

  const departmentOptions = departments.map(dept => ({
    value: dept.id,
    label: getText(dept.name, dept.nameAr),
  }));

  const fields: FormField[] = [
    {
      name: 'departmentId',
      label: getText('Department', 'القسم'),
      type: 'dropdown',
      required: true,
      options: departmentOptions,
      value: departmentId,
      error: errors.departmentId,
      disabled: !!editingDesignation,
      onChange: value => {
        setDepartmentId(value as string);
        if (errors.departmentId)
          setErrors(prev => ({ ...prev, departmentId: undefined }));
      },
    },
    {
      name: 'title',
      label: getText('Designation Title', 'عنوان المسمى الوظيفي (بالإنجليزية)'),
      type: 'text',
      required: true,
      placeholder: 'Designation Title',
      value: title,
      error: errors.title,
      onChange: value => {
        setTitle(value as string);
        if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
      },
    },
  ];

  const handleSaveDesignation = async (data: {
    title: string;
    titleAr: string;
    departmentId: string;
  }) => {
    try {
      setIsSubmitting(true);
      if (editingDesignation) {
        const designationDto = {
          title: data.title,
          departmentId: data.departmentId,
        };
        const updatedBackendDesignation =
          await designationApiService.updateDesignation(
            editingDesignation.id,
            designationDto
          );
        const updatedFrontendDesignation =
          designationApiService.convertBackendToFrontend(
            updatedBackendDesignation
          );
        const updatedDesignation: FrontendDesignation = {
          ...updatedFrontendDesignation,
          titleAr: data.titleAr || '',
        };
        setDesignations(prev =>
          prev.map(d =>
            d.id === editingDesignation.id ? updatedDesignation : d
          )
        );

        showSuccess('Designation updated successfully');
      } else {
        // Create new designation
        const designationDto = {
          title: data.title,
          departmentId: data.departmentId,
        };
        const newBackendDesignation =
          await designationApiService.createDesignation(designationDto);
        const newFrontendDesignation =
          designationApiService.convertBackendToFrontend(newBackendDesignation);
        const newDesignation: FrontendDesignation = {
          ...newFrontendDesignation,
          titleAr: data.titleAr || '',
        };
        setDesignations(prev => [newDesignation, ...prev]);
        setCurrentPage(1);

        showSuccess('Designation created successfully');
      }
      setModalOpen(false);
      setEditingDesignation(null);
    } catch (error: unknown) {
      showError(error, { operation: 'create', resource: 'designation' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDesignation = async () => {
    if (designationToDelete) {
      try {
        await designationApiService.deleteDesignation(designationToDelete.id);
        setDesignations(prev =>
          prev.filter(d => d.id !== designationToDelete.id)
        );
        showError(new Error('Designation deleted successfully'));
      } catch (error: unknown) {
        showError(error, { operation: 'delete', resource: 'designation' });
      }
    }
    setDeleteDialogOpen(false);
    setDesignationToDelete(null);
  };

  const filteredDesignations = useMemo(() => {
    if (selectedDepartmentId === 'all') {
      return designations;
    }
    return designations.filter(d => d.departmentId === selectedDepartmentId);
  }, [designations, selectedDepartmentId]);

  const isServerSidePagination =
    selectedDepartmentId !== 'all' && !isSystemAdmin;

  const paginatedData = isServerSidePagination
    ? filteredDesignations
    : filteredDesignations.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

  return (
    <Box dir={isRTL ? 'rtl' : 'ltr'}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3,
          gap: 2,
        }}
      >
        <AppPageTitle isRtl={isRTL} sx={{ mb: 0 }}>
          {getText('Designation', 'المسمى الوظيفي')}
        </AppPageTitle>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            justifyContent: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          {isSystemAdmin ? (
            <>
              <AppDropdown
                label={getText('Tenant', 'المستأجر')}
                showLabel={false}
                options={
                  loadingTenants
                    ? [
                      {
                        value: '',
                        label: getText(
                          'Loading tenants...',
                          'جاري تحميل المستأجرين...'
                        ),
                      },
                    ]
                    : [
                      {
                        value: 'all',
                        label: getText('All Tenants', 'جميع المستأجرين'),
                      },
                      ...allTenants.map((tenant: SystemTenant) => ({
                        value: tenant.id,
                        label: tenant.name,
                      })),
                    ]
                }
                value={selectedTenantId}
                onChange={e => {
                  const newValue =
                    e.target.value === '' ? 'all' : String(e.target.value);
                  setSelectedTenantId(newValue);
                  setSelectedDepartmentId('all');
                }}
                disabled={loadingTenants}
                containerSx={{ minWidth: { xs: '100%', sm: 250 } }}
                sx={{
                  '& .MuiSelect-select': {
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    paddingLeft: '16px !important',
                    paddingRight: '44px !important',
                  },
                  '& .MuiOutlinedInput-input': {
                    textAlign: 'left',
                    paddingLeft: '16px !important',
                    paddingRight: '44px !important',
                  },
                  '& .MuiSelect-select.MuiSelect-outlined.MuiInputBase-input.MuiOutlinedInput-input':
                  {
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    paddingLeft: '16px !important',
                    paddingRight: '44px !important',
                  },
                }}
              />
              <AppDropdown
                label={getText('Filter by department', 'تصفية حسب القسم')}
                showLabel={true}
                options={[
                  {
                    value: 'all',
                    label: getText('All Departments', 'كل الأقسام'),
                  },
                  ...departments.map(d => ({
                    value: d.id,
                    label: getText(d.name, d.nameAr),
                  })),
                ]}
                value={selectedDepartmentId}
                onChange={e => {
                  const newValue =
                    e.target.value === '' ? 'all' : String(e.target.value);
                  setSelectedDepartmentId(newValue);
                  setCurrentPage(1);
                }}
                disabled={departmentsLoading}
                containerSx={{ minWidth: { xs: '100%', sm: 250 } }}
                sx={{
                  '& .MuiSelect-select': {
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    paddingLeft: '16px !important',
                    paddingRight: '44px !important',
                  },
                  '& .MuiOutlinedInput-input': {
                    textAlign: 'left',
                    paddingLeft: '16px !important',
                    paddingRight: '44px !important',
                  },
                  '& .MuiSelect-select.MuiSelect-outlined.MuiInputBase-input.MuiOutlinedInput-input':
                  {
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    paddingLeft: '16px !important',
                    paddingRight: '44px !important',
                  },
                }}
              />
            </>
          ) : !isHRAdmin ? (
            <>
              <AppButton
                variantType='primary'
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingDesignation(null);
                  setModalOpen(true);
                }}
                sx={{
                  fontSize: 'var(--body-font-size)',
                  lineHeight: 'var(--body-line-height)',
                  letterSpacing: 'var(--body-letter-spacing)',
                  boxShadow: 'none',
                  minWidth: { xs: 'auto', sm: 200 },
                  width: { xs: '100%', sm: 'auto' },
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 0.75, sm: 1 },
                  '& .MuiButton-startIcon': {
                    marginRight: { xs: 0.5, sm: 1 },
                    '& > *:nth-of-type(1)': {
                      fontSize: { xs: '18px', sm: '20px' },
                    },
                  },
                }}
              >
                <Box
                  component='span'
                  sx={{ display: { xs: 'none', sm: 'inline' } }}
                >
                  {getText('Create Designation', 'إنشاء مسمى وظيفي')}
                </Box>
                <Box
                  component='span'
                  sx={{ display: { xs: 'inline', sm: 'none' } }}
                >
                  {getText('Create', 'إنشاء')}
                </Box>
              </AppButton>
            </>
          ) : null}
        </Box>
      </Box>

      {!isSystemAdmin && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant='body2'
            sx={{
              fontSize: { xs: '14px', lg: '16px' },
              lineHeight: 'var(--body-line-height)',
              color: theme.palette.text.secondary,
              mb: 1,
            }}
          >
            {getText('Filter by department', 'تصفية حسب القسم')}
          </Typography>
          <AppDropdown
            label={getText('Filter by department', 'تصفية حسب القسم')}
            showLabel={false}
            options={[
              { value: 'all', label: getText('All Departments', 'كل الأقسام') },
              ...(departmentsLoading
                ? []
                : departments.map(d => ({
                  value: d.id,
                  label: getText(d.name, d.nameAr),
                }))),
            ]}
            value={selectedDepartmentId}
            onChange={e => {
              const newValue =
                e.target.value === '' ? 'all' : String(e.target.value);
              setSelectedDepartmentId(newValue);
              setCurrentPage(1);
            }}
            disabled={departmentsLoading}
            containerSx={{ mb: 2, width: '100%' }}
            sx={{
              '& .MuiSelect-select': {
                justifyContent: 'flex-start',
                textAlign: 'left',
                paddingLeft: '16px !important',
                paddingRight: '44px !important',
              },
              '& .MuiOutlinedInput-input': {
                textAlign: 'left',
                paddingLeft: '16px !important',
                paddingRight: '44px !important',
              },
              '& .MuiSelect-select.MuiSelect-outlined.MuiInputBase-input.MuiOutlinedInput-input':
              {
                justifyContent: 'flex-start',
                textAlign: 'left',
                paddingLeft: '16px !important',
                paddingRight: '44px !important',
              },
            }}
          />

          <Typography
            variant='body2'
            sx={{
              fontSize: { xs: '14px', lg: '16px' },
              lineHeight: 'var(--body-line-height)',
              color: theme.palette.text.secondary,
            }}
          >
            {filteredDesignations.length}{' '}
            {getText('Designation(s)', 'مسمى وظيفي')}
          </Typography>
        </Box>
      )}

      {isSystemAdmin && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant='body2'
            sx={{
              mb: 2,
              fontSize: { xs: '14px', lg: '16px' },
              lineHeight: 'var(--body-line-height)',
              color: theme.palette.text.secondary,
            }}
          >
            {filteredDesignations.length}{' '}
            {getText('Designation(s)', 'مسمى وظيفي')}
          </Typography>
        </Box>
      )}

      <AppTable>
        <TableHead>
          <TableRow>
            {isSystemAdmin && (
              <TableCell
                sx={{
                  ...(isRTL ? { textAlign: 'right' } : { textAlign: 'left' }),
                }}
              >
                {getText('Tenant', 'المستأجر')}
              </TableCell>
            )}
            <TableCell
              sx={{
                ...(isRTL ? { textAlign: 'right' } : { textAlign: 'left' }),
              }}
            >
              {getText('Designation Title', 'المسمى الوظيفي')}
            </TableCell>
            {(selectedDepartmentId === 'all' || isSystemAdmin) && (
              <TableCell
                sx={{
                  ...(isRTL ? { textAlign: 'right' } : { textAlign: 'left' }),
                }}
              >
                {getText('Department', 'القسم')}
              </TableCell>
            )}
            {!isSystemAdmin && (
              <TableCell
                align='center'
                sx={{
                  minWidth: { xs: 80, sm: 120 },
                }}
              >
                {getText('Actions', 'الإجراءات')}
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={
                  isSystemAdmin ? 3 : selectedDepartmentId === 'all' ? 3 : 2
                }
                align='center'
                sx={{ color: 'text.secondary' }}
              >
                <Box
                  display='flex'
                  justifyContent='center'
                  alignItems='center'
                  py={3}
                >
                  <CircularProgress />
                </Box>
              </TableCell>
            </TableRow>
          ) : paginatedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={
                  isSystemAdmin ? 3 : selectedDepartmentId === 'all' ? 3 : 2
                }
                align='center'
                sx={{ color: 'text.secondary' }}
              >
                {selectedDepartmentId === 'all'
                  ? getText('No designations found', 'لا توجد مسميات وظيفية')
                  : getText(
                    'No designations found for this department',
                    'لا توجد مسميات وظيفية لهذا القسم'
                  )}
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map(designation => {
              const department = departments.find(
                d => d.id === designation.departmentId
              );
              const departmentName = department
                ? getText(department.name, department.nameAr)
                : 'Unknown Department';
              const tenantInfo = designationTenantMap.get(designation.id);

              return (
                <TableRow key={designation.id} hover>
                  {isSystemAdmin && (
                    <TableCell
                      sx={{
                        ...(isRTL
                          ? { textAlign: 'right' }
                          : { textAlign: 'left' }),
                      }}
                    >
                      {tenantInfo?.tenantName || '-'}
                    </TableCell>
                  )}
                  <TableCell
                    sx={{
                      ...(isRTL
                        ? { textAlign: 'right' }
                        : { textAlign: 'left' }),
                    }}
                  >
                    {getText(designation.title, designation.titleAr)}
                  </TableCell>
                  {(selectedDepartmentId === 'all' || isSystemAdmin) && (
                    <TableCell
                      sx={{
                        ...(isRTL
                          ? { textAlign: 'right' }
                          : { textAlign: 'left' }),
                      }}
                    >
                      {departmentName}
                    </TableCell>
                  )}
                  {!isSystemAdmin && (
                    <TableCell align='center'>
                      <Box
                        sx={{
                          display: 'flex',
                          gap: { xs: 0.5, sm: 1 },
                          justifyContent: 'center',
                        }}
                      >
                        <IconButton
                          size='small'
                          onClick={() => {
                            if (isHRAdmin) return;
                            setEditingDesignation(designation);
                            setModalOpen(true);
                          }}
                          title={
                            isHRAdmin
                              ? getText('Edit (disabled)', 'تعديل (معطل)')
                              : getText('Edit', 'تعديل')
                          }
                          aria-label={`Edit designation ${getText(designation.title, designation.titleAr)}`}
                          disabled={isHRAdmin}
                          sx={{
                            p: { xs: 0.5, sm: 1 },
                            color: theme.palette.primary.main,
                            '&:hover': {
                              backgroundColor: theme.palette.action.hover,
                            },
                          }}
                        >
                          <Box
                            component='img'
                            src={Icons.edit}
                            alt='Edit'
                            sx={{
                              width: { xs: 16, sm: 20 },
                              height: { xs: 16, sm: 20 },
                            }}
                          />
                        </IconButton>
                        {!isHRAdmin && (
                          <IconButton
                            size='small'
                            onClick={() => {
                              setDesignationToDelete(designation);
                              setDeleteDialogOpen(true);
                            }}
                            title={getText('Delete', 'حذف')}
                            aria-label={`Delete designation ${getText(designation.title, designation.titleAr)}`}
                            sx={{
                              p: { xs: 0.5, sm: 1 },
                              color: theme.palette.error.main,
                              '&:hover': {
                                backgroundColor: theme.palette.action.hover,
                              },
                            }}
                          >
                            <Box
                              component='img'
                              src={Icons.delete}
                              alt='Delete'
                              sx={{
                                width: { xs: 16, sm: 20 },
                                height: { xs: 16, sm: 20 },
                                filter:
                                  theme.palette.mode === 'dark'
                                    ? 'brightness(0) saturate(100%) invert(27%) sepia(95%) saturate(7151%) hue-rotate(348deg) brightness(95%) contrast(89%)'
                                    : 'none',
                              }}
                            />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </AppTable>

      {(() => {
        // Calculate pagination based on current view (server-side vs client-side)
        const currentTotalItems = isServerSidePagination
          ? totalRecords
          : filteredDesignations.length;

        // Calculate exact total pages
        const exactTotalPages =
          currentTotalItems > 0 && itemsPerPage > 0
            ? Math.ceil(currentTotalItems / itemsPerPage)
            : 1;

        const finalTotalPages = exactTotalPages;

        // Get current page record count for visibility logic
        const currentPageRowsCount = paginatedData.length;

        // Pagination visibility logic
        const shouldShowPagination =
          finalTotalPages > 1 &&
          currentPageRowsCount > 0 &&
          (currentPage === 1
            ? currentPageRowsCount === itemsPerPage // First page: only show if full limit (optional, but matches EmployeeList)
            : true);

        return shouldShowPagination ? (
          <Box display='flex' justifyContent='center' mt={2}>
            <Pagination
              count={finalTotalPages}
              page={Math.min(currentPage, finalTotalPages)}
              onChange={(_, page) => {
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

      {paginatedData.length > 0 && (
        <Box display='flex' justifyContent='center' mt={1}>
          <Typography variant='body2' color='textSecondary'>
            {getText(
              `Showing page ${currentPage} of ${isServerSidePagination ? Math.ceil(totalRecords / itemsPerPage) : Math.ceil(filteredDesignations.length / itemsPerPage)} (${paginatedData.length} records)`,
              `عرض الصفحة ${currentPage} من ${isServerSidePagination ? Math.ceil(totalRecords / itemsPerPage) : Math.ceil(filteredDesignations.length / itemsPerPage)} (${paginatedData.length} سجل)`
            )}
          </Typography>
        </Box>
      )}

      <AppFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        title={
          editingDesignation
            ? getText('Edit Designation', 'تعديل المسمى الوظيفي')
            : getText('Create New Designation', 'إنشاء مسمى وظيفي جديد')
        }
        fields={fields}
        submitLabel={
          editingDesignation
            ? getText('Update', 'تحديث')
            : getText('Create', 'إنشاء')
        }
        isSubmitting={isSubmitting}
        cancelLabel={getText('Cancel', 'إلغاء')}
        hasChanges={hasChanges}
        submitDisabled={!hasChanges || !isFormValid || isSubmitting}
        isRtl={isRTL}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDesignationToDelete(null);
        }}
        onConfirm={handleDeleteDesignation}
        message={
          designationToDelete
            ? getText(
              `Are you sure you want to delete "${getText(designationToDelete.title, designationToDelete.titleAr)}"? This action cannot be undone.`,
              `هل أنت متأكد أنك تريد حذف "${getText(designationToDelete.title, designationToDelete.titleAr)}"؟ لا يمكن التراجع عن هذا الإجراء.`
            )
            : ''
        }
        itemName={
          designationToDelete
            ? getText(designationToDelete.title, designationToDelete.titleAr)
            : undefined
        }
        isRTL={isRTL}
      />

      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
}
