import { useState, useEffect, useMemo } from 'react';
import type { DepartmentFormData, DepartmentFormErrors } from '../../types';
import {
  Box,
  Typography,
  Paper,
  // Snackbar,
  // Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Add as AddIcon, Business as BusinessIcon } from '@mui/icons-material';
// useOutletContext removed (darkMode not used)
import { DepartmentCard } from './DepartmentCard';
import AppFormModal, { type FormField } from '../common/AppFormModal';
import AppButton from '../common/AppButton';
import { VALIDATION_LIMITS } from '../../constants/appConstants';
import DeleteConfirmationDialog from '../common/DeleteConfirmationDialog';
import { useLanguage } from '../../hooks/useLanguage';
import AppPageTitle from '../common/AppPageTitle';
import {
  departmentApiService,
  type FrontendDepartment,
} from '../../api/departmentApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import {
  isSystemAdmin as isSystemAdminFn,
  isHRAdmin as isHrAdminFn,
} from '../../utils/roleUtils';
import type { SystemTenant } from '../../types/tenant';
// COLORS not required here
import AppDropdown from '../common/AppDropdown';

const labels = {
  en: {
    title: 'Departments',
    create: 'Create Department',
    createShort: 'Create',
    createFirst: 'Create First Department',
    noDepartments: 'No Departments Found',
    description: 'Get started by creating your first department',
  },
  ar: {
    title: 'إدارة الأقسام',
    create: 'إنشاء قسم',
    createShort: 'إنشاء',
    createFirst: 'إنشاء قسم جديد',
    noDepartments: 'لا توجد أقسام',
    description: 'ابدأ بإنشاء قسم جديد لإدارة مؤسستك',
  },
};

export const DepartmentList: React.FC = () => {
  const theme = useTheme();
  const { language } = useLanguage();

  const isRtl = language === 'ar';
  const lang = labels[language];

  // Get user role
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);
  const userRoleValue = user?.role;
  const isSystemAdmin = isSystemAdminFn(userRoleValue);
  const isHrAdmin = isHrAdminFn(userRoleValue);

  const [departments, setDepartments] = useState<FrontendDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<FrontendDepartment | null>(null);
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    description: '',
  });
  const [originalData, setOriginalData] = useState<DepartmentFormData>({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<DepartmentFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allTenants, setAllTenants] = useState<SystemTenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all');
  const [, setLoadingTenants] = useState(false);
  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();

  // Fetch tenants for system admin from departments API
  useEffect(() => {
    if (!isSystemAdmin) return;

    const fetchTenants = async () => {
      try {
        setLoadingTenants(true);
        // Use GET:/departments API to get tenant list
        const response =
          await departmentApiService.getAllTenantsWithDepartments();

        // Extract unique tenants from the departments API response
        const uniqueTenantsMap = new Map<string, SystemTenant>();
        response.tenants.forEach(tenant => {
          if (!uniqueTenantsMap.has(tenant.tenant_id)) {
            uniqueTenantsMap.set(tenant.tenant_id, {
              id: tenant.tenant_id,
              name: tenant.tenant_name,
              status: tenant.tenant_status as
                | 'active'
                | 'suspended'
                | 'delelted',
              isDeleted: false,
              created_at: '',
              updated_at: '',
              deleted_at: null,
            });
          }
        });

        setAllTenants(Array.from(uniqueTenantsMap.values()));
      } catch {
        // Leave tenant filter empty on failure
      } finally {
        setLoadingTenants(false);
      }
    };

    fetchTenants();
  }, [isSystemAdmin]);

  /* ---------- API handlers ---------- */
  const fetchDepartments = async () => {
    try {
      setLoading(true);

      if (isSystemAdmin) {
        // Use new API for system admin
        // Pass tenant_id only if a specific tenant is selected (not "all")
        const tenantIdParam =
          selectedTenantId && selectedTenantId !== 'all'
            ? selectedTenantId
            : undefined;
        const response =
          await departmentApiService.getAllTenantsWithDepartments(
            tenantIdParam
          );

        // Filter departments based on selected tenant
        const allDepartments: FrontendDepartment[] = [];
        response.tenants.forEach(tenant => {
          // If "All Tenants" is selected or no tenant selected, show all departments
          // Otherwise, only show departments from selected tenant
          if (
            selectedTenantId === 'all' ||
            !selectedTenantId ||
            tenant.tenant_id === selectedTenantId
          ) {
            tenant.departments.forEach(dept => {
              allDepartments.push({
                id: dept.id,
                name: dept.name,
                nameAr: '',
                description: dept.description || '',
                descriptionAr: '',
              });
            });
          }
        });

        setDepartments(allDepartments);
      } else {
        // Use existing API for other roles
        const backendDepartments =
          await departmentApiService.getAllDepartments();
        const frontendDepartments = backendDepartments.map(dept =>
          departmentApiService.convertBackendToFrontend(dept)
        );
        setDepartments(frontendDepartments);
      }
    } catch (error: unknown) {
      showError(error, { operation: 'fetch', resource: 'department' });
    } finally {
      setLoading(false);
    }
  };

  // Load departments on component mount and when tenant changes
  useEffect(() => {
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSystemAdmin, selectedTenantId]);

  const handleTenantChange = (event: SelectChangeEvent<string>) => {
    setSelectedTenantId(event.target.value);
  };

  const handleCreateDepartment = async (data: DepartmentFormData) => {
    try {
      // Only send English fields to backend
      const departmentDto = {
        name: data.name,
        description: data.description, // Send empty string if description is cleared
      };

      const newBackendDepartment =
        await departmentApiService.createDepartment(departmentDto);
      const newFrontendDepartment =
        departmentApiService.convertBackendToFrontend(newBackendDepartment);

      // Create frontend department
      const newDepartment: FrontendDepartment = {
        ...newFrontendDepartment,
      };

      setDepartments(prev => [newDepartment, ...prev]);
      setIsFormModalOpen(false);
      showSuccess('Department created successfully');
    } catch (error: unknown) {
      showError(error, { operation: 'create', resource: 'department' });
    }
  };

  const handleEditDepartment = async (data: DepartmentFormData) => {
    if (!selectedDepartment) return;

    try {
      // Only send English fields to backend
      const departmentDto = {
        name: data.name,
        description: data.description, // Send empty string if description is cleared
      };

      const updatedBackendDepartment =
        await departmentApiService.updateDepartment(
          selectedDepartment.id,
          departmentDto
        );
      const updatedFrontendDepartment =
        departmentApiService.convertBackendToFrontend(updatedBackendDepartment);

      // Create updated frontend department
      const updatedDepartment: FrontendDepartment = {
        ...updatedFrontendDepartment,
      };

      setDepartments(prev =>
        prev.map(d => (d.id === selectedDepartment.id ? updatedDepartment : d))
      );
      setSelectedDepartment(null);
      setIsFormModalOpen(false);
      showSuccess('Department updated successfully');
    } catch (error: unknown) {
      showError(error, { operation: 'update', resource: 'department' });
    }
  };

  // Form modal handlers
  useEffect(() => {
    if (selectedDepartment) {
      const initialData = {
        name: selectedDepartment.name,
        description: selectedDepartment.description || '',
      };
      setFormData(initialData);
      setOriginalData(initialData);
    } else {
      const initialData = {
        name: '',
        description: '',
      };
      setFormData(initialData);
      setOriginalData(initialData);
    }
    setErrors({});
  }, [selectedDepartment, isFormModalOpen]);

  const isEditing = Boolean(selectedDepartment);
  const hasChanges = isEditing
    ? formData.name !== originalData.name ||
      (formData.description || '') !== (originalData.description || '')
    : formData.name.trim() !== '' || (formData.description || '').trim() !== '';

  // Used to disable Create/Update until all required fields are valid
  const isFormValid =
    formData.name.trim().length >=
      VALIDATION_LIMITS.MIN_DEPARTMENT_NAME_LENGTH &&
    (formData.description || '').length <=
      VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH;

  const validateForm = (): boolean => {
    const newErrors: DepartmentFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = isRtl
        ? 'اسم القسم مطلوب'
        : 'Department name is required';
    } else if (
      formData.name.trim().length < VALIDATION_LIMITS.MIN_DEPARTMENT_NAME_LENGTH
    ) {
      newErrors.name = isRtl
        ? `اسم القسم يجب أن يكون على الأقل ${VALIDATION_LIMITS.MIN_DEPARTMENT_NAME_LENGTH} حرفين`
        : `Department name must be at least ${VALIDATION_LIMITS.MIN_DEPARTMENT_NAME_LENGTH} characters`;
    }

    if (
      formData.description &&
      formData.description.length > VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH
    ) {
      newErrors.description = isRtl
        ? `الوصف يجب أن يكون أقل من ${VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH} حرف`
        : `Description must be less than ${VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      await new Promise(r => setTimeout(r, 300));
      if (selectedDepartment) {
        await handleEditDepartment(formData);
      } else {
        await handleCreateDepartment(formData);
      }
    } catch {
      // Handle error silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsFormModalOpen(false);
    setSelectedDepartment(null);
  };

  const title = isEditing
    ? isRtl
      ? 'تعديل القسم'
      : 'Edit Department'
    : isRtl
      ? 'إنشاء قسم جديد'
      : 'Create New Department';

  const fields: FormField[] = [
    {
      name: 'name',
      label: isRtl ? 'اسم القسم' : 'Department Name',
      type: 'text',
      required: true,
      placeholder: 'Name',
      value: formData.name,
      error: errors.name,
      onChange: value => {
        setFormData(prev => ({ ...prev, name: value as string }));
        if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
      },
    },
    {
      name: 'description',
      label: isRtl ? 'الوصف (اختياري)' : 'Description (Optional)',
      type: 'textarea',
      placeholder: 'Description',
      maxLength: VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH,
      value: formData.description || '',
      error: errors.description,
      onChange: value => {
        setFormData(prev => ({ ...prev, description: value as string }));
        if (errors.description)
          setErrors(prev => ({ ...prev, description: undefined }));
      },
    },
  ];

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;

    try {
      await departmentApiService.deleteDepartment(selectedDepartment.id);
      setDepartments(prev => prev.filter(d => d.id !== selectedDepartment.id));
      setSelectedDepartment(null);
      setIsDeleteModalOpen(false);
      showError(new Error('Department deleted successfully'));
    } catch (error: unknown) {
      showError(error, { operation: 'delete', resource: 'department' });
    }
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        direction: isRtl ? 'rtl' : 'ltr',
        minHeight: '100vh',
        color: theme.palette.text.primary,
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <AppPageTitle
          isRtl={isRtl}
          sx={{ mb: 0, textAlign: isRtl ? 'right' : 'left' }}
        >
          {lang.title}
        </AppPageTitle>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
          }}
        >
          {isSystemAdmin && (
            <AppDropdown
              value={selectedTenantId}
              onChange={handleTenantChange}
              options={[
                {
                  value: 'all',
                  label: language === 'ar' ? 'جميع المستأجرين' : 'All Tenants',
                },
                ...allTenants.map(t => ({ value: t.id, label: t.name })),
              ]}
              containerSx={{
                width: { xs: '100%', sm: 200 },
                maxWidth: { xs: '100%', sm: '400px' },
              }}
              sx={{
                color: theme.palette.text.primary,

                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.divider,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.divider,
                },
              }}
            />
          )}
          {!isSystemAdmin && !isHrAdmin && (
            <AppButton
              variantType='primary'
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedDepartment(null);
                setIsFormModalOpen(true);
              }}
              sx={{
                fontSize: 'var(--body-font-size)',
                lineHeight: 'var(--body-line-height)',
                letterSpacing: 'var(--body-letter-spacing)',
                boxShadow: 'none',
                minWidth: { xs: 'auto', sm: 'auto' },
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
                sx={{
                  display: { xs: 'none', sm: 'inline' },
                  fontSize: { xs: '16px', lg: '16px' },
                }}
              >
                {lang.create}
              </Box>
              <Box
                component='span'
                sx={{
                  display: { xs: 'inline', sm: 'none' },
                  fontSize: { xs: '12px', lg: '16px' },
                }}
              >
                {lang.createShort}
              </Box>
            </AppButton>
          )}
        </Box>
      </Box>

      {/* Content */}
      {loading ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 1px 3px rgba(0,0,0,0.3)'
                : '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <Box
            display='flex'
            justifyContent='center'
            alignItems='center'
            height={200}
          >
            <CircularProgress />
          </Box>
        </Paper>
      ) : departments.length === 0 ? (
        <Paper
          sx={{
            mt: 2,
            p: 4,
            textAlign: 'center',
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 1px 3px rgba(0,0,0,0.3)'
                : '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <BusinessIcon
            sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }}
          />
          <Typography
            variant='h6'
            sx={{ color: theme.palette.text.secondary }}
            gutterBottom
          >
            {lang.noDepartments}
          </Typography>
          <Typography
            variant='body2'
            sx={{ color: theme.palette.text.secondary, mb: 3 }}
          >
            {lang.description}
          </Typography>
          {!isSystemAdmin && !isHrAdmin && (
            <AppButton
              variantType='primary'
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedDepartment(null);
                setIsFormModalOpen(true);
              }}
              sx={{
                boxShadow: 'none',
              }}
            >
              {lang.createFirst}
            </AppButton>
          )}
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(2, 1fr)',
            },
            gap: 3,
          }}
        >
          {departments.map(d => (
            <DepartmentCard
              key={d.id}
              department={d}
              onEdit={
                isSystemAdmin || isHrAdmin
                  ? undefined
                  : dept => {
                      setSelectedDepartment(dept);
                      setIsFormModalOpen(true);
                    }
              }
              onDelete={
                isSystemAdmin || isHrAdmin
                  ? undefined
                  : dept => {
                      setSelectedDepartment(dept);
                      setIsDeleteModalOpen(true);
                    }
              }
              isRtl={isRtl}
            />
          ))}
        </Box>
      )}

      {/* Modals */}
      <AppFormModal
        open={isFormModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        title={title}
        fields={fields}
        submitLabel={
          isSubmitting
            ? isRtl
              ? 'جاري الحفظ...'
              : 'Saving...'
            : isEditing
              ? isRtl
                ? 'تحديث'
                : 'Update'
              : isRtl
                ? 'إنشاء'
                : 'Create'
        }
        cancelLabel={isRtl ? 'إلغاء' : 'Cancel'}
        isSubmitting={isSubmitting}
        hasChanges={hasChanges}
        submitDisabled={isSubmitting || !hasChanges || !isFormValid}
        isRtl={isRtl}
        applyButtonWidth={true}
      />

      <DeleteConfirmationDialog
        open={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDepartment(null);
        }}
        onConfirm={handleDeleteDepartment}
        message={
          selectedDepartment
            ? isRtl
              ? `هل أنت متأكد من أنك تريد حذف قسم "${selectedDepartment.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`
              : `Are you sure you want to delete the department "${selectedDepartment.name}"? This action cannot be undone.`
            : ''
        }
        itemName={selectedDepartment?.name}
        isRTL={isRtl}
      />

      {/* Snackbar for notifications */}
      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
};
