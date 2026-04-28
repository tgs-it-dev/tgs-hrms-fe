import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  useMediaQuery,
  IconButton,
  CircularProgress,
  useTheme,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Switch,
  Tooltip,
  Chip,
  Pagination,
  Avatar,
} from '@mui/material';

import type { SelectChangeEvent } from '@mui/material/Select';
import AddIcon from '@mui/icons-material/Add';
import RestoreIcon from '@mui/icons-material/Restore';

import CloseIcon from '@mui/icons-material/Close';
import {
  SystemTenantApi,
  type SystemTenant,
  type SystemTenantDetail,
} from '../../api/systemTenantApi';
import { formatDate } from '../../utils/dateUtils';
import { env } from '../../config/env';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppButton from '../common/AppButton';
import AppTable from '../common/AppTable';
import AppCard from '../common/AppCard';
import AppFormModal from '../common/AppFormModal';
import AppDropdown from '../common/AppDropdown';
import { Icons } from '../../assets/icons';
import DeleteConfirmationDialog from '../common/DeleteConfirmationDialog';
import { PAGINATION } from '../../constants/appConstants';
import AppPageTitle from '../common/AppPageTitle';

type StatusFilterOption = 'all' | 'active' | 'suspended' | 'deleted';

const createEmptyTenantForm = () => ({
  name: '',
  domain: '',
  logo: '',
  adminName: '',
  adminEmail: '',
});

export const TenantPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [tenants, setTenants] = useState<SystemTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();

  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');

  const [selectedTenant, setSelectedTenant] = useState<SystemTenant | null>(
    null
  );
  const [tenantDetail, setTenantDetail] = useState<SystemTenantDetail | null>(
    null
  );

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [tenantForm, setTenantForm] = useState(createEmptyTenantForm);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTenantId, setEditTenantId] = useState<string | null>(null);
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editDomain, setEditDomain] = useState('');
  const [editLogo, setEditLogo] = useState('');
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [uploadingEditLogo, setUploadingEditLogo] = useState(false);

  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Track logo load failure in details modal to fall back to initials
  const [detailLogoFailed, setDetailLogoFailed] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [, setTotalRecords] = useState(0);
  const itemsPerPage = PAGINATION.DEFAULT_PAGE_SIZE;

  const filteredTenants = useMemo(() => {
    if (statusFilter === 'all') return tenants;
    if (statusFilter === 'deleted') return tenants.filter(t => t.isDeleted);
    if (statusFilter === 'active')
      return tenants.filter(t => !t.isDeleted && t.status === 'active');
    if (statusFilter === 'suspended')
      return tenants.filter(t => !t.isDeleted && t.status === 'suspended');
    return tenants;
  }, [tenants, statusFilter]);

  const isStatusFilterWithClientPagination =
    (statusFilter === 'deleted' ||
      statusFilter === 'suspended' ||
      statusFilter === 'active') &&
    filteredTenants.length > 0;

  const effectiveTotalPages = isStatusFilterWithClientPagination
    ? Math.max(1, Math.ceil(filteredTenants.length / itemsPerPage))
    : totalPages;

  const displayedTenants = useMemo(() => {
    if (!isStatusFilterWithClientPagination) return filteredTenants;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTenants.slice(start, start + itemsPerPage);
  }, [
    filteredTenants,
    isStatusFilterWithClientPagination,
    currentPage,
    itemsPerPage,
  ]);

  const fetchTenants = useCallback(async () => {
    try {
      setIsLoading(true);

      const fetchAllForFilter =
        statusFilter === 'deleted' ||
        statusFilter === 'suspended' ||
        statusFilter === 'active';

      if (fetchAllForFilter) {
        const first = await SystemTenantApi.getAll({
          page: 1,
          limit: itemsPerPage,
          includeDeleted: true,
        });
        const totalPagesFromApi = first.totalPages || 1;
        const allData = [...(first.data || [])];

        if (totalPagesFromApi > 1) {
          const rest = await Promise.all(
            Array.from({ length: totalPagesFromApi - 1 }, (_, i) =>
              SystemTenantApi.getAll({
                page: i + 2,
                limit: itemsPerPage,
                includeDeleted: true,
              })
            )
          );
          rest.forEach(r => allData.push(...(r.data || [])));
        }

        setTenants(allData);
        setTotalRecords(first.total ?? allData.length);
        setTotalPages(1);
      } else {
        const res = await SystemTenantApi.getAll({
          page: currentPage,
          limit: itemsPerPage,
          includeDeleted: true,
        });

        setTenants(res.data);
        setTotalRecords(res.total);
        setTotalPages(res.totalPages);
      }
    } catch {
      showError('Failed to fetch tenants');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, showError, statusFilter]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const closeCreateModal = () => {
    setIsFormOpen(false);
    setTenantForm(createEmptyTenantForm());
    setSelectedLogoFile(null);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(null);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('File size should be less than 5MB');
      return;
    }
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    setSelectedLogoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
  };

  const handleRemoveLogoFile = () => {
    setSelectedLogoFile(null);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(null);
  };

  const handleCreate = async () => {
    const { name, domain, adminName, adminEmail } = tenantForm;
    if (
      !name.trim() ||
      !domain.trim() ||
      !adminName.trim() ||
      !adminEmail.trim()
    ) {
      showError('All fields are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail.trim())) {
      showError('Admin email must be a valid email');
      return;
    }

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name.trim()) || !nameRegex.test(adminName.trim())) {
      showError('Names can only contain letters and spaces');
      return;
    }

    try {
      setUploadingLogo(true);
      const tenantData: {
        name: string;
        domain: string;
        logo?: File;
        adminName: string;
        adminEmail: string;
      } = {
        name: name.trim(),
        domain: domain.trim(),
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
      };

      if (selectedLogoFile) {
        tenantData.logo = selectedLogoFile;
      }

      await SystemTenantApi.create(tenantData);
      fetchTenants();
      showSuccess('Tenant created successfully');
      closeCreateModal();
    } catch (error) {
      let errorMessage = 'Failed to create tenant';

      const maybeAxiosError = error as {
        response?: {
          status?: number;
          data?: {
            message?: string;
            errors?: Array<{ field: string; message: string }>;
          };
        };
      };

      if (maybeAxiosError.response?.data?.errors) {
        const errors = maybeAxiosError.response.data.errors;
        errorMessage = errors.map(e => e.message).join(', ');
      } else if (maybeAxiosError.response?.data?.message) {
        errorMessage = maybeAxiosError.response.data.message;
      }

      const alreadyExists =
        maybeAxiosError.response?.status === 409 ||
        maybeAxiosError.response?.data?.message
          ?.toLowerCase()
          .includes('already');

      if (alreadyExists) {
        errorMessage = 'Tenant already exists';
      }

      showError(errorMessage);
    } finally {
      setUploadingLogo(false);
    }
  };
  const handleUpdate = async () => {
    if (!editTenantId || !editCompanyName.trim() || !editDomain.trim()) {
      showError('Company name and domain are required');
      return;
    }

    try {
      setUploadingEditLogo(true);

      const updateData: {
        tenantId: string;
        companyName: string;
        domain: string;
        logo?: string | File;
      } = {
        tenantId: editTenantId,
        companyName: editCompanyName.trim(),
        domain: editDomain.trim(),
      };

      // If a new logo file is selected, pass it directly (will be sent as multipart)
      // Otherwise, pass the existing logo URL if available
      if (editLogoFile) {
        updateData.logo = editLogoFile;
      } else if (editLogo) {
        updateData.logo = editLogo;
      }

      const updatedTenant = await SystemTenantApi.update(updateData);
      setTenants(prev =>
        prev.map(t => (t.id === editTenantId ? { ...t, ...updatedTenant } : t))
      );
      showSuccess('Tenant updated successfully');
      setIsEditOpen(false);
      // Reset edit form
      setEditTenantId(null);
      setEditCompanyName('');
      setEditDomain('');
      setEditLogo('');
      setEditLogoFile(null);
      if (editLogoPreview) {
        URL.revokeObjectURL(editLogoPreview);
      }
      setEditLogoPreview(null);
      fetchTenants();
    } catch {
      showError('Failed to update tenant');
    } finally {
      setUploadingEditLogo(false);
    }
  };

  const handleEditLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('File size should be less than 5MB');
      return;
    }

    if (editLogoPreview) {
      URL.revokeObjectURL(editLogoPreview);
    }

    setEditLogoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setEditLogoPreview(previewUrl);
  };

  const handleRemoveEditLogoFile = () => {
    setEditLogoFile(null);
    if (editLogoPreview) {
      URL.revokeObjectURL(editLogoPreview);
    }
    setEditLogoPreview(null);
  };

  const toggleStatus = async (tenant: SystemTenant) => {
    try {
      const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
      const updatedTenant = await SystemTenantApi.updateStatus(
        tenant.id,
        newStatus
      );
      setTenants(prev =>
        prev.map(t => (t.id === updatedTenant.id ? updatedTenant : t))
      );
      showSuccess(
        `Tenant "${tenant.name}" status changed to "${
          updatedTenant.status.charAt(0).toUpperCase() +
          updatedTenant.status.slice(1).toLowerCase()
        }"`
      );
    } catch {
      showError('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!selectedTenant) return;
    try {
      await SystemTenantApi.remove(selectedTenant.id);
      fetchTenants();
      showSuccess('Tenant deleted successfully');
    } catch {
      showError('Failed to delete tenant');
    } finally {
      setIsDeleteOpen(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await SystemTenantApi.restore(id);
      fetchTenants();
      showSuccess('Tenant restored successfully');
    } catch {
      showError('Failed to restore tenant');
    }
  };

  const handleViewDetails = async (tenant: SystemTenant) => {
    try {
      setDetailLogoFailed(false);
      const detail = await SystemTenantApi.getById(tenant.id);
      setTenantDetail(detail);
      setIsDetailOpen(true);
    } catch {
      showError('Failed to load tenant details');
    }
  };

  const handleOpenEdit = async (tenant: SystemTenant) => {
    try {
      setEditTenantId(tenant.id);
      setEditCompanyName(tenant.name);

      // Fetch tenant details to get domain and logo
      try {
        const tenantDetail = await SystemTenantApi.getById(tenant.id);

        // Set domain from tenant detail
        if (tenantDetail.domain) {
          setEditDomain(tenantDetail.domain);
        } else if (tenantDetail.company?.domain) {
          setEditDomain(tenantDetail.company.domain);
        }

        // Set logo from tenant detail
        let logoUrl = tenantDetail.logo || tenantDetail.company?.logo_url;

        // Convert relative path to full URL if needed
        if (logoUrl && typeof logoUrl === 'string' && logoUrl.startsWith('/')) {
          logoUrl = `${env.apiBaseUrl}${logoUrl}`;
        }

        if (
          logoUrl &&
          typeof logoUrl === 'string' &&
          logoUrl !== '[object Object]'
        ) {
          setEditLogo(logoUrl);
          setEditLogoPreview(logoUrl);
        }
      } catch {
        // Set domain from tenant object as fallback
        setEditDomain('');
      }

      setIsEditOpen(true);
    } catch {
      showError('Failed to load tenant details');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems={isMobile ? 'stretch' : 'center'}
        flexDirection={isMobile ? 'column' : 'row'}
        aligItemns='center'
        gap={2}
        mb={1}
      >
        <AppPageTitle>Tenant Management</AppPageTitle>

        <Box
          display='flex'
          flexDirection={isMobile ? 'column' : 'row'}
          gap={2}
          alignItems={isMobile ? 'stretch' : 'center'}
        >
          <AppDropdown
            label='Status'
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'suspended', label: 'Suspended' },
              { value: 'deleted', label: 'Deleted' },
            ]}
            value={statusFilter}
            onChange={(e: SelectChangeEvent<string | number>) => {
              const v = e.target.value;
              setStatusFilter(
                (v === '' || v === 'all'
                  ? 'all'
                  : String(v)) as StatusFilterOption
              );
            }}
            showLabel={false}
            containerSx={{
              minWidth: { xs: '100%', sm: 140 },
              '& .MuiOutlinedInput-root': { minHeight: '40px' },
            }}
            sx={{
              '.MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
            }}
          />
          <AppButton
            variant='contained'
            variantType='primary'
            onClick={() => setIsFormOpen(true)}
            startIcon={<AddIcon />}
            sx={{
              fontSize: '16px',
              fontWeight: 600,
              textTransform: 'none',
              padding: '8px 32px',
              borderRadius: '12px',
              width: { xs: '100%', lg: '200px' },
              height: '40px',
            }}
          >
            Create Tenant
          </AppButton>
        </Box>
      </Box>

      {/* Table */}
      {isLoading ? (
        <Box display='flex' justifyContent='center' alignItems='center' mt={6}>
          <CircularProgress />
        </Box>
      ) : (
        // <AppCard sx={{ padding: 0, borderRadius: 1, overflow: 'hidden' }}>
        <AppTable>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Name</strong>
              </TableCell>
              <TableCell>
                <strong>Status</strong>
              </TableCell>
              <TableCell>
                <strong>Created</strong>
              </TableCell>
              <TableCell align='center'>
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedTenants.map(t => (
              <TableRow key={t.id} hover>
                <TableCell>{t.name}</TableCell>
                <TableCell>
                  {!t.isDeleted && (
                    <Switch
                      checked={t.status === 'active'}
                      onChange={() => toggleStatus(t)}
                      aria-label={`Toggle status for tenant ${t.name}`}
                      role='switch'
                      aria-checked={t.status === 'active'}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: 'var(--primary-dark-color) !important',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                          {
                            backgroundColor:
                              'var(--primary-dark-color) !important',
                          },
                      }}
                    />
                  )}
                  {t.isDeleted
                    ? 'Deleted'
                    : t.status.charAt(0).toUpperCase() +
                      t.status.slice(1).toLowerCase()}
                </TableCell>
                <TableCell>{formatDate(t.created_at)}</TableCell>
                <TableCell align='center'>
                  {!t.isDeleted ? (
                    <>
                      <Tooltip title='View Details'>
                        <IconButton
                          color='primary'
                          onClick={() => handleViewDetails(t)}
                          aria-label={`View details for tenant ${t.name}`}
                        >
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
                      <Tooltip title='Edit Tenant'>
                        <IconButton
                          color='primary'
                          onClick={() => handleOpenEdit(t)}
                          aria-label={`Edit tenant ${t.name}`}
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
                      </Tooltip>

                      <Tooltip title='Delete'>
                        <IconButton
                          color='error'
                          onClick={() => {
                            setSelectedTenant(t);
                            setIsDeleteOpen(true);
                          }}
                          aria-label={`Delete tenant ${t.name}`}
                        >
                          <Box
                            component='img'
                            src={Icons.delete}
                            alt='Delete'
                            sx={{
                              width: { xs: 16, sm: 20 },
                              height: { xs: 16, sm: 20 },
                            }}
                          />
                        </IconButton>
                      </Tooltip>
                    </>
                  ) : (
                    <Tooltip title='Restore Tenant'>
                      <IconButton
                        color='success'
                        onClick={() => handleRestore(t.id)}
                        aria-label={`Restore tenant ${t.name}`}
                      >
                        <RestoreIcon aria-hidden='true' />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {displayedTenants.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align='center'>
                  <Typography sx={{ py: 3, color: 'text.secondary' }}>
                    No tenant records found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </AppTable>
        // </AppCard>
      )}
      {effectiveTotalPages > 1 && displayedTenants.length > 0 && (
        <Box display='flex' justifyContent='center' mt={2}>
          <Pagination
            count={effectiveTotalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color='primary'
            showFirstButton
            showLastButton
          />
        </Box>
      )}
      {displayedTenants.length > 0 && (
        <Box display='flex' justifyContent='center' mt={1}>
          <Typography variant='body2' color='textSecondary'>
            Showing page {currentPage} of {effectiveTotalPages} (
            {displayedTenants.length} records)
          </Typography>
        </Box>
      )}

      {/* Detail Modal (AppFormModal) */}
      <AppFormModal
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onSubmit={() => setIsDetailOpen(false)}
        title={'Tenant Details'}
        submitLabel={'Close'}
        cancelLabel={''}
        hideCancel={true}
        isSubmitting={false}
        hasChanges={true}
        fields={[
          {
            name: 'details',
            label: '',
            component: (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {tenantDetail ? (
                  <>
                    <AppCard
                      sx={{
                        p: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      {(() => {
                        const rawLogo =
                          (typeof tenantDetail.logo === 'string'
                            ? tenantDetail.logo
                            : undefined) ??
                          (typeof tenantDetail.company?.logo_url === 'string'
                            ? tenantDetail.company.logo_url
                            : undefined);

                        let logoUrl: string | null = rawLogo ?? null;

                        if (logoUrl && logoUrl.startsWith('/')) {
                          logoUrl = `${env.apiBaseUrl}${logoUrl}`;
                        }

                        const isValidLogo =
                          !detailLogoFailed &&
                          typeof logoUrl === 'string' &&
                          logoUrl.trim() !== '';

                        const companyName =
                          tenantDetail.company?.company_name ||
                          tenantDetail.name ||
                          '';
                        const initials =
                          companyName
                            .trim()
                            .split(/\s+/)
                            .slice(0, 2)
                            .map(word => word.charAt(0).toUpperCase())
                            .join('') || 'NA';

                        return isValidLogo && logoUrl ? (
                          <img
                            src={logoUrl}
                            alt='Tenant Logo'
                            style={{
                              width: 70,
                              height: 70,
                              borderRadius: '10px',
                              objectFit: 'cover',
                              border: '1px solid #ddd',
                            }}
                            onError={() => {
                              setDetailLogoFailed(true);
                            }}
                          />
                        ) : (
                          <Avatar
                            sx={{
                              width: 70,
                              height: 70,
                              borderRadius: '10px',
                              bgcolor: '#3f51b5',
                              color: '#fff',
                              fontWeight: 600,
                              fontSize: 20,
                            }}
                            variant='rounded'
                          >
                            {initials}
                          </Avatar>
                        );
                      })()}

                      <Box>
                        <Typography variant='h6' fontWeight={600}>
                          {tenantDetail.name}
                        </Typography>
                      </Box>
                    </AppCard>

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 2,
                      }}
                    >
                      <AppCard variant='outlined' sx={{ p: 2 }}>
                        <Typography
                          variant='subtitle1'
                          color='primary'
                          fontWeight={600}
                        >
                          Tenant Information
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography>
                            <strong>Domain:</strong> {tenantDetail.domain}
                          </Typography>
                          <Typography>
                            <strong>Status:</strong>{' '}
                            <Chip
                              label={
                                tenantDetail.status.charAt(0).toUpperCase() +
                                tenantDetail.status.slice(1).toLowerCase()
                              }
                              color={
                                tenantDetail.status === 'active'
                                  ? 'success'
                                  : tenantDetail.status === 'suspended'
                                    ? 'warning'
                                    : 'error'
                              }
                              size='small'
                              sx={{ ml: 1 }}
                            />
                          </Typography>
                          <Typography>
                            <strong>Created:</strong>{' '}
                            {formatDate(tenantDetail.created_at)}
                          </Typography>
                        </Box>
                      </AppCard>

                      {tenantDetail.company && (
                        <AppCard variant='outlined' sx={{ p: 2 }}>
                          <Typography
                            variant='subtitle1'
                            color='primary'
                            fontWeight={600}
                          >
                            Company Information
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Typography>
                              <strong>Name:</strong>{' '}
                              {tenantDetail.company.company_name}
                            </Typography>
                            <Typography>
                              <strong>Plan:</strong>{' '}
                              {tenantDetail.company.plan_id}
                            </Typography>
                            <Typography>
                              <strong>Paid:</strong>{' '}
                              <Chip
                                label={
                                  tenantDetail.company.is_paid ? 'Paid' : 'Free'
                                }
                                color={
                                  tenantDetail.company.is_paid
                                    ? 'success'
                                    : 'warning'
                                }
                                size='small'
                                sx={{ ml: 1 }}
                              />
                            </Typography>
                          </Box>
                        </AppCard>
                      )}

                      <AppCard variant='outlined' sx={{ p: 2 }}>
                        <Typography
                          variant='subtitle1'
                          color='primary'
                          fontWeight={600}
                        >
                          Summary
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography>
                            <strong>Departments:</strong>{' '}
                            {tenantDetail.departmentCount}
                          </Typography>
                          <Typography>
                            <strong>Employees:</strong>{' '}
                            {tenantDetail.employeeCount}
                          </Typography>
                        </Box>
                      </AppCard>
                    </Box>

                    {tenantDetail.departments?.length > 0 && (
                      <AppCard variant='outlined' sx={{ p: 2 }}>
                        <Typography
                          variant='subtitle1'
                          color='primary'
                          fontWeight={600}
                        >
                          Departments
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {tenantDetail.departments.map(dep => (
                            <Chip
                              key={dep.id}
                              label={dep.name}
                              size='small'
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        </Box>
                      </AppCard>
                    )}
                  </>
                ) : (
                  <Box display='flex' justifyContent='center' mt={2}>
                    <CircularProgress />
                  </Box>
                )}
              </Box>
            ),
            value: '',
            onChange: () => {},
          },
        ]}
      />

      {/* Create Modal (AppFormModal) */}
      <AppFormModal
        open={isFormOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreate}
        title={'Create Tenant'}
        submitLabel={uploadingLogo ? 'Uploading...' : 'Save'}
        cancelLabel={'Cancel'}
        isSubmitting={uploadingLogo}
        hasChanges={true}
        fields={[
          {
            name: 'name',
            label: 'Tenant Name',
            type: 'text',
            placeholder: 'Enter tenant name',
            required: true,
            value: tenantForm.name,
            onChange: value =>
              setTenantForm(prev => ({ ...prev, name: String(value) })),
            error: undefined,
          },
          {
            name: 'domain',
            label: 'Domain',
            type: 'text',
            value: tenantForm.domain,
            onChange: value =>
              setTenantForm(prev => ({ ...prev, domain: String(value) })),
            placeholder: 'Enter domain name',
          },
          {
            name: 'logo',
            label: 'Company Logo',
            component: (
              <Box>
                <input
                  accept='image/*'
                  style={{ display: 'none' }}
                  id='logo-upload-button'
                  type='file'
                  onChange={handleLogoFileChange}
                />
                <label htmlFor='logo-upload-button'>
                  <AppButton
                    variant='outlined'
                    variantType='secondary'
                    component='span'
                    startIcon={
                      <Box
                        aria-hidden='true'
                        sx={{
                          width: 18,
                          height: 18,
                          backgroundColor: 'var(--primary-dark-color)',
                          WebkitMaskImage: `url(${Icons.upload})`,
                          maskImage: `url(${Icons.upload})`,
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                          WebkitMaskPosition: 'center',
                          maskPosition: 'center',
                        }}
                      />
                    }
                    fullWidth
                    sx={{
                      mb: 2,
                      color: 'var(--primary-dark-color)',
                      borderColor: 'var(--primary-dark-color)',
                      '&:hover': { borderColor: 'var(--primary-dark-color)' },
                    }}
                  >
                    {selectedLogoFile ? 'Change Logo' : 'Upload Company Logo'}
                  </AppButton>
                </label>
                {logoPreview && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mt: 2,
                      p: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                    }}
                  >
                    <Avatar
                      src={logoPreview}
                      alt='Logo preview'
                      sx={{ width: 80, height: 80 }}
                      variant='rounded'
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant='body2' fontWeight='bold'>
                        {selectedLogoFile?.name}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {(selectedLogoFile?.size || 0) / 1024} KB
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={handleRemoveLogoFile}
                      color='error'
                      size='small'
                      aria-label='Remove logo file'
                    >
                      <CloseIcon aria-hidden='true' />
                    </IconButton>
                  </Box>
                )}
              </Box>
            ),
            value: '',
            onChange: () => {},
          },
          {
            name: 'adminName',
            label: 'Admin Name',
            type: 'text',
            placeholder: 'Enter admin name',
            value: tenantForm.adminName,
            onChange: value =>
              setTenantForm(prev => ({ ...prev, adminName: String(value) })),
          },
          {
            name: 'adminEmail',
            label: 'Admin Email',
            type: 'text',
            placeholder: 'Enter admin email',
            value: tenantForm.adminEmail,
            onChange: value =>
              setTenantForm(prev => ({ ...prev, adminEmail: String(value) })),
          },
        ]}
      />

      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedTenant(null);
        }}
        onConfirm={handleDelete}
        message={
          selectedTenant
            ? `Are you sure you want to delete "${selectedTenant.name}"? This action cannot be undone.`
            : ''
        }
        itemName={selectedTenant?.name || undefined}
        isRTL={false}
      />
      {/* Edit Tenant Modal (AppFormModal) */}
      <AppFormModal
        open={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditTenantId(null);
          setEditCompanyName('');
          setEditDomain('');
          setEditLogo('');
          setEditLogoFile(null);
          if (editLogoPreview) {
            URL.revokeObjectURL(editLogoPreview);
          }
          setEditLogoPreview(null);
        }}
        onSubmit={handleUpdate}
        title={'Edit Tenant'}
        submitLabel={uploadingEditLogo ? 'Updating...' : 'Update'}
        cancelLabel={'Cancel'}
        isSubmitting={uploadingEditLogo}
        hasChanges={true}
        fields={[
          {
            name: 'companyName',
            label: 'Company Name',
            type: 'text',
            required: true,
            value: editCompanyName,
            onChange: value => setEditCompanyName(String(value)),
          },
          {
            name: 'domain',
            label: 'Domain',
            type: 'text',
            required: true,
            value: editDomain,
            onChange: value => setEditDomain(String(value)),
            placeholder: 'example.com',
          },
          {
            name: 'logo',
            label: 'Company Logo',
            component: (
              <Box>
                <input
                  accept='image/*'
                  style={{ display: 'none' }}
                  id='edit-logo-upload-button'
                  type='file'
                  onChange={handleEditLogoFileChange}
                />
                <label htmlFor='edit-logo-upload-button'>
                  <AppButton
                    variant='outlined'
                    variantType='secondary'
                    component='span'
                    startIcon={
                      <Box
                        aria-hidden='true'
                        sx={{
                          width: 18,
                          height: 18,
                          backgroundColor: 'var(--primary-dark-color)',
                          WebkitMaskImage: `url(${Icons.upload})`,
                          maskImage: `url(${Icons.upload})`,
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                          WebkitMaskPosition: 'center',
                          maskPosition: 'center',
                        }}
                      />
                    }
                    fullWidth
                    sx={{
                      mb: 2,
                      color: 'var(--primary-dark-color)',
                      borderColor: 'var(--primary-dark-color)',
                      '&:hover': { borderColor: 'var(--primary-dark-color)' },
                    }}
                  >
                    {editLogoFile ? 'Change Logo' : 'Upload Company Logo'}
                  </AppButton>
                </label>
                {(editLogoPreview || editLogo) && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mt: 2,
                      p: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                    }}
                  >
                    <Avatar
                      src={editLogoPreview || editLogo}
                      alt='Logo preview'
                      sx={{ width: 80, height: 80 }}
                      variant='rounded'
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant='body2' fontWeight='bold'>
                        {editLogoFile?.name || 'Current Logo'}
                      </Typography>
                      {editLogoFile && (
                        <Typography variant='caption' color='text.secondary'>
                          {(editLogoFile.size || 0) / 1024} KB
                        </Typography>
                      )}
                    </Box>
                    {editLogoFile && (
                      <IconButton
                        onClick={handleRemoveEditLogoFile}
                        color='error'
                        size='small'
                        aria-label='Remove logo file'
                      >
                        <CloseIcon aria-hidden='true' />
                      </IconButton>
                    )}
                  </Box>
                )}
              </Box>
            ),
            value: '',
            onChange: () => {},
          },
        ]}
      />

      {/* Snackbar */}
      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
};

export default TenantPage;
