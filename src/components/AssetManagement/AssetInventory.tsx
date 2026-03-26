import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  // MenuItem,
  // InputAdornment,
  // Menu,
  // ListItemIcon,
  // ListItemText,
  CircularProgress,
  Stack,
  Pagination,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Icons } from '../../assets/icons';
import Icon from '../common/Icon';
import type { Asset, AssetFilters, AssetStatus } from '../../types/asset';
import { assetApi, type Asset as ApiAsset } from '../../api/assetApi';
// Use shared AppFormModal instead of AssetModal
import AppFormModal from '../common/AppFormModal';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import StatusChip from './StatusChip';
import { DeleteConfirmationDialog } from '../common/DeleteConfirmationDialog';
import {
  assetCategories,
  getSubcategoriesByCategoryId,
} from '../../Data/assetCategories';
import { isManager as roleIsManager } from '../../utils/auth';
import { formatDate } from '../../utils/dateUtils';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import AppCard from '../common/AppCard';
import AppTable from '../common/AppTable';
import AppDropdown from '../common/AppDropdown';
import AppButton from '../common/AppButton';
import AppSearch from '../common/AppSearch';
import ErrorSnackbar from '../common/ErrorSnackbar';
import { PAGINATION } from '../../constants/appConstants';

// Extended interface for API asset response that may include additional user information
interface ApiAssetWithUser extends ApiAsset {
  assignedToName?: string;
  assignedByUser?: {
    name: string;
  };
}

type InventoryAsset = Asset & {
  categoryName?: string;
  category_id?: string;
  purchase_date?: string;
  subcategoryName?: string;
};

const resolveCategoryName = (asset: InventoryAsset): string =>
  asset.category?.name ?? asset.categoryName ?? '';

const resolveCategoryId = (asset: InventoryAsset): string =>
  asset.category?.id ?? asset.category_id ?? '';

// resolvePurchaseDate helper removed (unused after menu refactor)

const resolveSubcategoryName = (asset: InventoryAsset): string | undefined =>
  asset.subcategoryName;

const AssetInventory: React.FC = () => {
  const [assets, setAssets] = useState<InventoryAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<InventoryAsset[]>([]);
  const [statusCounts, setStatusCounts] = useState<{
    total: number;
    available: number;
    assigned: number;
    retired: number;
    under_maintenance: number;
    pending: number;
  }>({
    total: 0,
    available: 0,
    assigned: 0,
    retired: 0,
    under_maintenance: 0,
    pending: 0,
  }); // Store counts from API response
  const initialLoadRef = React.useRef(false); // Track if initial load has been done
  const fetchingRef = React.useRef(false); // Track if fetch is in progress to prevent duplicate calls
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AssetFilters>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<InventoryAsset | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<InventoryAsset | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();
  // Using shared AppDropdown which manages its own open state

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = storedUser.role;

  const hideActions = false;

  const showSnackbar = React.useCallback(
    (
      message: string,
      severity: 'success' | 'error' | 'warning' | 'info' = 'success'
    ) => {
      if (severity === 'success') {
        showSuccess(message);
      } else {
        // Use centralized error handler for non-success notifications
        showError(message);
      }
    },
    [showSuccess, showError]
  );
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    total: 0,
    page: 1,
    limit: PAGINATION.DEFAULT_PAGE_SIZE, // Backend returns records per page
    totalPages: 1,
  });

  // Helper function to get user name from API response or fallback
  const getUserName = React.useCallback(
    (apiAsset: ApiAssetWithUser): string => {
      // Check if the API response includes user name information
      if (apiAsset.assignedToName) {
        return apiAsset.assignedToName;
      }
      if (apiAsset.assignedByUser?.name) {
        return apiAsset.assignedByUser.name;
      }
      // Fallback to user ID if no name is provided
      return apiAsset.assigned_to
        ? `User ${apiAsset.assigned_to}`
        : 'Unassigned';
    },
    []
  );

  // Helper function to transform API assets
  const transformApiAssets = React.useCallback(
    (apiAssets: ApiAssetWithUser[]): InventoryAsset[] => {
      return apiAssets.map((apiAsset: ApiAssetWithUser) => {
        // Handle new API response structure where category is an object
        const categoryObj =
          typeof apiAsset.category === 'object'
            ? apiAsset.category
            : {
                id: apiAsset.category_id || '',
                name: apiAsset.categoryName || apiAsset.category || '',
              };

        // Handle subcategory - can be object or string
        const subcategoryObj = apiAsset.subcategory
          ? typeof apiAsset.subcategory === 'object'
            ? apiAsset.subcategory
            : {
                id: apiAsset.subcategory_id || '',
                name: apiAsset.subcategoryName || apiAsset.subcategory || '',
              }
          : undefined;

        return {
          id: apiAsset.id,
          name: apiAsset.name,
          category: {
            id: categoryObj.id || apiAsset.category_id || '',
            name: categoryObj.name || apiAsset.categoryName || '',
            nameAr: categoryObj.name || apiAsset.categoryName || '',
            description: categoryObj.description || undefined,
            color: undefined,
            subcategories: undefined,
          },
          status: apiAsset.status,
          assignedTo: apiAsset.assigned_to || undefined,
          assignedToName:
            apiAsset.assignedToName ||
            apiAsset.assignedToUser?.name ||
            (apiAsset.assigned_to ? getUserName(apiAsset) : undefined),
          serialNumber: '', // Not provided by API
          purchaseDate: apiAsset.purchase_date,
          location: '', // Not provided by API
          description: '', // Not provided by API
          createdAt: apiAsset.created_at,
          updatedAt: apiAsset.created_at,
          subcategoryId:
            subcategoryObj?.id || apiAsset.subcategory_id || undefined,
          subcategoryName:
            subcategoryObj?.name || apiAsset.subcategoryName || undefined,
          categoryName: apiAsset.categoryName,
          category_id: apiAsset.category_id,
          purchase_date: apiAsset.purchase_date,
        };
      });
    },
    [getUserName]
  );

  // Removed fetchAllAssetsForStats - using counts from API response instead

  // Fetch assets from API
  const fetchAssets = React.useCallback(
    async (
      page: number = 1,
      limit: number = PAGINATION.DEFAULT_PAGE_SIZE,
      isInitialLoad: boolean = false
    ) => {
      // Prevent duplicate calls
      if (fetchingRef.current) {
        return;
      }

      try {
        fetchingRef.current = true;

        // Only show initial loading on very first load, not on pagination or when returning to page 1
        if (isInitialLoad && page === 1) {
          setInitialLoading(true);
        }

        // Ensure page and limit are always provided
        const response = await assetApi.getAllAssets({
          page: page || 1,
          limit: limit || PAGINATION.DEFAULT_PAGE_SIZE,
        });

        const apiAssets = response.assets; // Extract assets from paginated response

        // Backend returns 25 records per page (fixed page size)
        // If we get 25 records, there might be more pages
        // If we get less than 25, it's the last page
        const hasMorePages = apiAssets.length === limit;

        // Use backend pagination info if available, otherwise estimate.
        // Always use the page we requested so UI shows correct "page X of Y" and list stays in sync.
        const requestedPage = page || 1;
        if (
          response.pagination &&
          response.pagination.total &&
          response.pagination.totalPages
        ) {
          setPagination({
            ...response.pagination,
            page: requestedPage,
          });
        } else {
          // Fallback: estimate based on current page and records received
          const estimatedTotal = hasMorePages
            ? page * limit
            : (page - 1) * limit + apiAssets.length;
          const estimatedTotalPages = hasMorePages ? page + 1 : page;

          setPagination({
            total: estimatedTotal,
            page: requestedPage,
            limit: (limit || PAGINATION.DEFAULT_PAGE_SIZE) as number,
            totalPages: estimatedTotalPages,
          });
        }

        // Update counts from API response if available
        if (response.counts) {
          setStatusCounts({
            total: response.counts.total || 0,
            available: response.counts.available || 0,
            assigned: response.counts.assigned || 0,
            retired: response.counts.retired || 0,
            under_maintenance: response.counts.under_maintenance || 0,
            pending: response.counts.pending || 0,
          });
        }

        // Check if we have assets
        if (!apiAssets || apiAssets.length === 0) {
          setAssets([]);
          return;
        }

        // Transform API assets to match component interface
        const transformedAssets = transformApiAssets(apiAssets);

        setAssets(transformedAssets);
      } catch (error) {
        console.error('Failed to fetch assets:', error);
        // Use centralized error handler when available
        try {
          showError(error);
        } catch {
          // Fallback to local snackbar
          showSnackbar('Failed to load assets', 'error');
        }
      } finally {
        fetchingRef.current = false;
        // Only set initial loading to false on very first load
        if (isInitialLoad && page === 1) {
          setInitialLoading(false);
        }
      }
    },
    [transformApiAssets, showError, showSnackbar]
  );

  // Initial load: fetch paginated assets (counts are included in API response)
  useEffect(() => {
    // Only run initial load once
    if (initialLoadRef.current) {
      return;
    }
    if (fetchingRef.current) {
      return; // Don't fetch if already fetching
    }

    initialLoadRef.current = true;

    // Fetch paginated assets (counts are included in API response)
    fetchAssets(pagination.page, pagination.limit, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on initial mount

  // Handle page changes: only fetch paginated assets, not stats
  // Note: handlePageChange already calls fetchAssets, so this useEffect is not needed
  // Keeping it commented out to avoid double fetching
  // useEffect(() => {
  //   if (pagination.page > 0) {
  //     fetchAssets(pagination.page, pagination.limit);
  //   }
  // }, [pagination.page, pagination.limit, fetchAssets]);

  // Filter and search logic
  useEffect(() => {
    let filtered = assets;

    // Search filter (name, serial, location, assignedTo, category, subcategory)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        asset =>
          asset.name.toLowerCase().includes(term) ||
          asset.serialNumber.toLowerCase().includes(term) ||
          asset.location.toLowerCase().includes(term) ||
          (asset.assignedToName &&
            asset.assignedToName.toLowerCase().includes(term)) ||
          resolveCategoryName(asset).toLowerCase().includes(term) ||
          (resolveSubcategoryName(asset) || '').toLowerCase().includes(term) ||
          (asset.category?.requestedItem || '')
            .toLowerCase()
            .includes(term)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(asset => asset.status === filters.status);
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(
        asset => resolveCategoryName(asset) === filters.category
      );
    }

    setFilteredAssets(filtered);
  }, [assets, searchTerm, filters]);

  const handleAddAsset = () => {
    setEditingAsset(null);
    // reset form fields for create
    setFormName('');
    setFormCategoryId('');
    setFormSubcategory('');
    setFormPurchaseDate(new Date());
    setIsModalOpen(true);
  };

  // Form state for AppFormModal (replace AssetModal)
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formSubcategory, setFormSubcategory] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState<Date | null>(
    new Date()
  );

  const categoryOptions = assetCategories.map(cat => ({
    value: cat.id,
    label: cat.name,
  }));
  // Backend-driven category/subcategory options to ensure UUIDs are used
  const [apiCategories, setApiCategories] = useState<
    { value: string; label: string }[]
  >([]);
  const [apiSubcategories, setApiSubcategories] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await assetApi.getAllAssetCategories();
        // Define a flexible item type
        type CategoryItem = { id: string; name: string };
        let categoriesData: CategoryItem[] = [];
        // Handle various response shapes safely
        const anyResp = response as unknown as {
          data?: CategoryItem[];
          items?: CategoryItem[];
          categories?: CategoryItem[];
        };

        if (Array.isArray(response)) {
          categoriesData = response as unknown as CategoryItem[];
        } else if (Array.isArray(anyResp.data)) {
          categoriesData = anyResp.data;
        } else if (Array.isArray(anyResp.items)) {
          categoriesData = anyResp.items;
        } else if (Array.isArray(anyResp.categories)) {
          categoriesData = anyResp.categories;
        }

        const mapped = categoriesData.map(cat => ({
          value: cat.id,
          label: cat.name,
        }));
        setApiCategories(mapped);
      } catch {
        // Fallback to local static categories when API fails
        setApiCategories(categoryOptions);
      }
    };

    if (isModalOpen) fetchCategories();
    // Only run when modal opens/closes
  }, [isModalOpen, categoryOptions]);

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!formCategoryId) {
        setApiSubcategories([]);
        return;
      }
      try {
        const response =
          await assetApi.getAssetSubcategoriesByCategoryId(formCategoryId);
        type SubCategoryItem = {
          id: string;
          name: string;
          category?: string | { id?: string; name?: string };
          category_id?: string;
        };
        let subcategoriesData: SubCategoryItem[] = [];
        // Handle various response shapes safely
        const anyResp = response as unknown as {
          data?: SubCategoryItem[];
          items?: SubCategoryItem[];
          subcategories?: SubCategoryItem[];
        };

        if (Array.isArray(response)) {
          subcategoriesData = response as unknown as SubCategoryItem[];
        } else if (Array.isArray(anyResp.data)) {
          subcategoriesData = anyResp.data;
        } else if (Array.isArray(anyResp.items)) {
          subcategoriesData = anyResp.items;
        } else if (Array.isArray(anyResp.subcategories)) {
          subcategoriesData = anyResp.subcategories;
        }

        // Filter to only subcategories that belong to the selected category
        // (API may return all subcategories and ignore category_id param)
        const hasCategoryOnSubs = subcategoriesData.some(
          s => s.category !== undefined || s.category_id !== undefined
        );
        const filtered = hasCategoryOnSubs
          ? subcategoriesData.filter(sub => {
              const cat = sub.category;
              if (sub.category_id === formCategoryId) return true;
              if (typeof cat === 'string') return cat === formCategoryId;
              if (cat && typeof cat === 'object' && cat.id)
                return cat.id === formCategoryId;
              return false;
            })
          : subcategoriesData;

        const mapped = filtered.map(s => ({
          value: s.id,
          label: s.name,
        }));
        setApiSubcategories(mapped);
      } catch {
        // Fallback to static data when API fails
        const staticSubs = getSubcategoriesByCategoryId(formCategoryId).map(
          s => ({ value: s, label: s })
        );
        setApiSubcategories(staticSubs);
      }
    };

    if (isModalOpen) fetchSubcategories();
  }, [formCategoryId, isModalOpen]);

  const handleEditAsset = (asset: InventoryAsset) => {
    setEditingAsset(asset);
    // populate form fields from the selected asset
    setFormName(asset.name || '');
    setFormCategoryId(resolveCategoryId(asset) || '');
    setFormSubcategory(asset.subcategoryId || '');
    setFormPurchaseDate(
      asset.purchaseDate ? new Date(asset.purchaseDate) : new Date()
    );
    setIsModalOpen(true);
  };

  const handleDeleteAsset = (asset: InventoryAsset) => {
    setAssetToDelete(asset);
    setDeleteDialogOpen(true);
  };

  // menu handlers removed — menu UI was removed, so these handlers are unused

  const handleAssetSubmit = async (data: {
    name: string;
    categoryId: string;
    subcategoryId?: string;
    purchaseDate: string;
    assignedTo?: string;
  }) => {
    setLoading(true);
    try {
      if (editingAsset) {
        // Update existing asset
        const updateData: {
          name: string;
          categoryId: string;
          subcategoryId?: string;
          purchaseDate: string;
        } = {
          name: data.name,
          categoryId: data.categoryId,
          purchaseDate: data.purchaseDate,
        };

        // Only include subcategoryId if it's provided
        if (data.subcategoryId && data.subcategoryId.trim() !== '') {
          updateData.subcategoryId = data.subcategoryId;
        }

        await assetApi.updateAsset(editingAsset.id, updateData);

        // User name will be fetched in the refresh

        // Assets will be refreshed from API
        showSuccess('Asset updated successfully');
        // Refresh the current page to update counts (not initial load)
        fetchAssets(pagination.page, pagination.limit, false);
      } else {
        // Create new asset
        const createData: {
          name: string;
          categoryId: string;
          subcategoryId?: string;
          purchaseDate: string;
        } = {
          name: data.name,
          categoryId: data.categoryId,
          purchaseDate: data.purchaseDate,
        };

        // Only include subcategoryId if it's provided
        if (data.subcategoryId && data.subcategoryId.trim() !== '') {
          createData.subcategoryId = data.subcategoryId;
        }

        await assetApi.createAsset(createData);

        // User name will be fetched in the refresh

        // Assets will be refreshed from API
        showSuccess('Asset created successfully');
        // Refresh the current page to update counts (not initial load)
        fetchAssets(pagination.page, pagination.limit, false);
      }

      setIsModalOpen(false);
    } catch (error: unknown) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;

    setLoading(true);
    try {
      await assetApi.deleteAsset(assetToDelete.id);

      showError(new Error('Asset deleted successfully'));
      setDeleteDialogOpen(false);
      setAssetToDelete(null);
      // Refresh the current page to update counts
      fetchAssets(pagination.page, pagination.limit, false);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  // menu-related actions removed: status change helpers consolidated elsewhere

  // Use counts from API response
  const displayCounts = useMemo(() => {
    // Use counts from API response if available
    if (
      statusCounts.total > 0 ||
      statusCounts.available > 0 ||
      statusCounts.assigned > 0 ||
      statusCounts.retired > 0 ||
      statusCounts.under_maintenance > 0
    ) {
      return {
        total: statusCounts.total,
        available: statusCounts.available,
        assigned: statusCounts.assigned,
        retired: statusCounts.retired,
        underMaintenance: statusCounts.under_maintenance,
      };
    }

    // Fallback: Use total from pagination, show 0 for status counts until API provides them
    return {
      total: pagination.total || 0,
      available: 0,
      assigned: 0,
      underMaintenance: 0,
      retired: 0,
    };
  }, [statusCounts, pagination.total]);

  // When filters/search are active, show filtered count in pagination summary (fixes HR role seeing wrong total)
  const hasActiveFilters =
    searchTerm.trim() !== '' || !!filters.status || !!filters.category;
  const displayPagination = useMemo(
    () =>
      hasActiveFilters
        ? {
          total: filteredAssets.length,
          totalPages: 1,
          page: 1,
          limit: pagination.limit,
        }
        : pagination,
    [
      hasActiveFilters,
      filteredAssets.length,
      pagination.total,
      pagination.page,
      pagination.limit,
      pagination.totalPages,
    ]
  );

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    newPage: number
  ) => {
    // Update page in state immediately so "Showing page X of Y" and pagination control update
    setPagination(prev => ({ ...prev, page: newPage }));
    // Fetch the new page data (list will update when response arrives)
    fetchAssets(newPage, pagination.limit, false);
  };

  // Modal form helpers for AppFormModal
  const hasFormChanges = editingAsset
    ? // compare simple fields for edit
      formName !== (editingAsset.name || '') ||
      formCategoryId !== resolveCategoryId(editingAsset) ||
      formSubcategory !== (editingAsset.subcategoryId || '')
    : // for create, require name and category selected
      formName.trim() !== '' && formCategoryId !== '';

  const onFormSubmit = () => {
    // Format purchase date as YYYY-MM-DD
    const formatDate = (date: Date | null) => {
      if (!date) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const payload = {
      name: formName,
      categoryId: formCategoryId,
      subcategoryId:
        formSubcategory && formSubcategory.trim() !== ''
          ? formSubcategory
          : undefined,
      purchaseDate: formatDate(formPurchaseDate),
    };

    void handleAssetSubmit(payload);
  };

  const baseModalFields = [
    {
      name: 'name',
      label: 'Asset Name',
      type: 'text' as const,
      required: true,
      value: formName,
      onChange: (v: string | number) => setFormName(String(v)),
    },
    {
      name: 'category',
      label: 'Category',
      type: 'dropdown' as const,
      value: formCategoryId,
      options: apiCategories.length > 0 ? apiCategories : categoryOptions,
      onChange: (v: string | number) => {
        setFormCategoryId(String(v));
        setFormSubcategory(''); // Reset subcategory when category changes
      },
      // ensure we match what AppFormModal expects for custom components or props
    },
    {
      name: 'subcategory',
      label: 'Subcategory',
      type: 'dropdown' as const,
      value: formSubcategory,
      options:
        apiSubcategories.length > 0
          ? apiSubcategories
          : formCategoryId
            ? getSubcategoriesByCategoryId(formCategoryId).map(s => ({
                value: s,
                label: s,
              }))
            : [],
      onChange: (v: string | number) => setFormSubcategory(String(v)),
    },
    {
      name: 'purchaseDate',
      label: 'Purchase Date',
      value: formPurchaseDate ? formPurchaseDate.toISOString() : '',
      component: (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label='Purchase Date'
            value={formPurchaseDate}
            onChange={date =>
              setFormPurchaseDate(date ? new Date(date.toString()) : null)
            }
            slotProps={{
              textField: {
                fullWidth: true,
                sx: theme => ({
                  '& .MuiInputBase-input': {
                    color: theme.palette.text.primary,
                  },

                  '& .MuiInputLabel-root': {
                    color: theme.palette.text.secondary,
                  },

                  '& .MuiIconButton-root': {
                    color:
                      theme.palette.mode === 'dark'
                        ? theme.palette.grey[400]
                        : theme.palette.text.secondary,
                  },

                  '& .MuiIconButton-root svg': {
                    color:
                      theme.palette.mode === 'dark'
                        ? theme.palette.grey[400]
                        : theme.palette.text.secondary,
                  },
                }),
              },

              desktopPaper: {
                sx: theme => ({
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: '12px',
                }),
              },

              popper: {
                sx: {
                  '& .MuiPaper-root': {
                    borderRadius: '12px',
                  },
                },
              },

              day: {
                sx: theme => ({
                  '&.Mui-selected, &.Mui-selected:hover': {
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                  },

                  '&.MuiPickersDay-today:not(.Mui-selected)': {
                    borderColor: theme.palette.primary.main,
                  },
                }),
              },
            }}
          />
        </LocalizationProvider>
      ),
      onChange: () => {},
    },
  ];

  // Modal fields (Assigned To removed for both create and edit)
  const modalFields = baseModalFields;

  if (initialLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <Stack alignItems='center' py={4}>
          <CircularProgress />
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
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
        <Typography
          variant='h4'
          fontSize={{ xs: '32px', lg: '48px' }}
          fontWeight={600}
        >
          Asset Inventory
        </Typography>
        <Box
          sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}
        >
          <AppButton
            variant='contained'
            variantType='primary'
            startIcon={<AddIcon />}
            onClick={handleAddAsset}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 400,
              fontSize: 'var(--body-font-size)',
              lineHeight: 'var(--body-line-height)',
              letterSpacing: 'var(--body-letter-spacing)',
              bgcolor: 'var(--primary-dark-color)',
              color: '#FFFFFF',
              boxShadow: 'none',
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: 200 },
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
            Add Asset
          </AppButton>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <AppCard compact>
            <Typography color='textSecondary' gutterBottom>
              Total Assets
            </Typography>
            <Typography variant='h4' fontWeight={600}>
              {displayCounts.total}
            </Typography>
          </AppCard>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <AppCard compact>
            <Typography color='textSecondary' gutterBottom>
              Available
            </Typography>
            <Typography variant='h4' fontWeight={600} color='success.main'>
              {displayCounts.available}
            </Typography>
          </AppCard>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <AppCard compact>
            <Typography color='textSecondary' gutterBottom>
              Assigned
            </Typography>
            <Typography variant='h4' fontWeight={600} color='info.main'>
              {displayCounts.assigned}
            </Typography>
          </AppCard>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <AppCard compact>
            <Typography color='textSecondary' gutterBottom>
              Maintenance
            </Typography>
            <Typography variant='h4' fontWeight={600} color='warning.main'>
              {displayCounts.underMaintenance}
            </Typography>
          </AppCard>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <AppCard compact>
            <Typography color='textSecondary' gutterBottom>
              Retired
            </Typography>
            <Typography variant='h4' fontWeight={600} color='text.secondary'>
              {displayCounts.retired}
            </Typography>
          </AppCard>
        </Box>
      </Box>

      {/* Filters and Search */}
      <AppCard sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: { xs: 'wrap', md: 'nowrap' },
            gap: 2,
            alignItems: 'center',
            py: 2,
          }}
        >
          <Box
            sx={{
              flex: { xs: '0 0 100%', md: '1 1 150px' },
              minWidth: '150px',
              width: { xs: '100%', md: 'auto' },
              order: { xs: 1, md: 1 },
            }}
          >
            <AppSearch
              placeholder='Search assets by name, category'
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              sx={{
                borderRadius: '12px',
                width: '100%',
                '& .MuiInputBase-root': { minHeight: '48px' },
                '& .MuiInputBase-input': { padding: '12px 16px' },
              }}
            />
          </Box>
          <Box
            sx={{
              flex: { xs: '0 0 100%', md: '1 1 150px' },
              minWidth: '150px',
              width: { xs: '100%', md: 'auto' },
              order: { xs: 2, md: 2 },
            }}
          >
            <AppDropdown
              label='Status'
              showLabel={false}
              size='small'
              fullWidth
              value={filters.status || ''}
              onChange={e => {
                const value = e.target.value as string;
                setFilters((prev: AssetFilters) => ({
                  ...prev,
                  status: value === '' ? undefined : (value as AssetStatus),
                }));
              }}
              options={[
                { value: 'all', label: 'Status' },
                { value: 'available', label: 'Available' },
                { value: 'assigned', label: 'Assigned' },
                { value: 'under_maintenance', label: 'Under Maintenance' },
                { value: 'retired', label: 'Retired' },
              ]}
            />
          </Box>
          <Box
            sx={{
              flex: { xs: '0 0 100%', md: '1 1 150px' },
              minWidth: '150px',
              width: { xs: '100%', md: 'auto' },
              order: { xs: 3, md: 3 },
            }}
          >
            <AppDropdown
              label='Category'
              showLabel={false}
              size='small'
              fullWidth
              value={filters.category || ''}
              onChange={e => {
                const value = e.target.value as string;
                setFilters((prev: AssetFilters) => ({
                  ...prev,
                  category: value === '' ? undefined : value,
                }));
              }}
              options={[
                { value: 'all', label: 'Category' },
                ...assetCategories.map(cat => ({
                  value: cat.name,
                  label: cat.name,
                })),
              ]}
            />
          </Box>
          <Box
            sx={{
              flex: '0 0 auto',
              width: { xs: '100%', md: 'auto' },
              display: 'flex',
              justifyContent: { xs: 'flex-start', md: 'flex-start' },
              order: { xs: 4, md: 4 },
            }}
          >
            <AppButton
              // variant='contained'
              // variantType='primary'
              startIcon={<FilterIcon />}
              onClick={() => setFilters({})}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 400,
                fontSize: 'var(--body-font-size)',
                lineHeight: 'var(--body-line-height)',
                letterSpacing: 'var(--body-letter-spacing)',
                // bgcolor: 'var(--primary-dark-color)',
                backgroundColor: 'transparent',
                color: 'var(--primary-dark-color)',
                border: '1px solid var(--primary-dark-color)',
                boxShadow: 'none',
                px: { xs: 1, sm: 1.25 },
                py: { xs: 0.6, sm: 0.8 },
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: 'var(--primary-dark-color)',
                  border: '1px solid var(--primary-dark-color)',
                  boxShadow: 'none',
                },
                '& .MuiButton-startIcon': {
                  marginRight: { xs: 0.5, sm: 0.75 },
                  '& > *:nth-of-type(1)': {
                    fontSize: { xs: '16px', sm: '18px' },
                  },
                },
              }}
            >
              Clear Filters
            </AppButton>
          </Box>
        </Box>
      </AppCard>

      {/* Assets Table */}
      <AppCard sx={{ padding: 0 }}>
        <AppTable>
          <TableHead>
            <TableRow>
              <TableCell>Asset Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Purchase Date</TableCell>
              {!hideActions && <TableCell align='center'>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAssets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align='center'>
                  <Typography variant='body2' color='text.secondary'>
                    No assets found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredAssets.map(asset => (
                <TableRow key={asset.id} hover>
                  <TableCell>
                    <Box>
                      <Box sx={{ maxWidth: 200 }}>
                        <Tooltip title={asset.name} placement='top'>
                          <Typography
                            variant='body2'
                            fontWeight={500}
                            sx={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {asset.name}
                          </Typography>
                        </Tooltip>
                      </Box>
                      {asset.description && (
                        <Typography variant='caption' color='text.secondary'>
                          {asset.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box>
                      <Typography variant='body2' fontWeight={500}>
                        {resolveCategoryName(asset) || 'N/A'}
                      </Typography>
                      {resolveSubcategoryName(asset) && (
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {resolveSubcategoryName(asset)}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  <TableCell>
                    <StatusChip status={asset.status} type='asset' />
                  </TableCell>

                  <TableCell>
                    {asset.assignedToName ? (
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <PersonIcon fontSize='small' />
                        <Typography variant='body2'>
                          {asset.assignedToName}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant='body2' color='text.secondary'>
                        Unassigned
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>{formatDate(asset.purchaseDate)}</TableCell>

                  {!hideActions && (
                    <TableCell align='center'>
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 0,
                          justifyContent: 'center',
                        }}
                      >
                        <Tooltip title='Edit' arrow>
                          <IconButton
                            size='small'
                            onClick={() => handleEditAsset(asset)}
                            aria-label={`Edit asset ${asset.name}`}
                            sx={{ p: { xs: 0.5, sm: 1 } }}
                          >
                            {roleIsManager() ? (
                              <Icon
                                name='edit'
                                sx={{
                                  width: { xs: 16, sm: 20 },
                                  height: { xs: 16, sm: 20 },
                                }}
                              />
                            ) : (
                              <Box
                                component='img'
                                src={Icons.edit}
                                alt='Edit'
                                sx={{
                                  width: { xs: 16, sm: 20 },
                                  height: { xs: 16, sm: 20 },
                                }}
                              />
                            )}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title='Delete' arrow>
                          <IconButton
                            size='small'
                            onClick={() => handleDeleteAsset(asset)}
                            aria-label={`Delete asset ${asset.name}`}
                            sx={{ p: { xs: 0.5, sm: 1 } }}
                          >
                            {roleIsManager() ? (
                              <Icon
                                name='delete'
                                sx={{
                                  width: { xs: 16, sm: 20 },
                                  height: { xs: 16, sm: 20 },
                                }}
                              />
                            ) : (
                              <Box
                                component='img'
                                src={Icons.delete}
                                alt='Delete'
                                sx={{
                                  width: { xs: 16, sm: 20 },
                                  height: { xs: 16, sm: 20 },
                                }}
                              />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </AppTable>
      </AppCard>

      {/* Pagination */}
      {displayPagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={displayPagination.totalPages}
            page={displayPagination.page}
            onChange={handlePageChange}
            color='primary'
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Pagination Info - total records = count on current page (updates when page changes) */}
      {(assets.length > 0 || filteredAssets.length > 0) && (
        <Box display='flex' justifyContent='center' mt={1}>
          <Typography variant='body2' color='textSecondary'>
            Showing page {displayPagination.page} of {displayPagination.totalPages} (
            {filteredAssets.length} total records)
          </Typography>
        </Box>
      )}

      {/* Asset Modal (using shared AppFormModal) */}
      <AppFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onFormSubmit}
        title={editingAsset ? 'Edit Asset' : 'Add New Asset'}
        fields={modalFields}
        submitLabel={editingAsset ? 'Update' : 'Create'}
        cancelLabel='Cancel'
        isSubmitting={loading}
        hasChanges={!!hasFormChanges}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        title='Delete Asset'
        message={`Are you sure you want to delete "${assetToDelete?.name}"? This action cannot be undone.`}
        confirmText='Delete'
        cancelText='Cancel'
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteDialogOpen(false)}
        itemName={assetToDelete?.name}
        loading={loading}
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

export default AssetInventory;
