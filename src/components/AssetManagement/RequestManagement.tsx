import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  MenuItem,
  Tabs,
  Tab,
  Avatar,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Stack,
  Pagination,
  Alert,
  useTheme,
} from '@mui/material';

import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type { AssetRequest, Asset, AssetStatus } from '../../types/asset';
import {
  assetApi,
  type AssetRequest as ApiAssetRequest,
  type PaginatedResponse,
} from '../../api/assetApi';
import StatusChip from './StatusChip';
import { assetCategories } from '../../Data/assetCategories';
import type { AxiosError } from 'axios';
import { formatDate } from '../../utils/dateUtils';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
// AppButton not used in this file after switching to AppFormModal
import AppSelect from '../common/AppSelect';
import AppTable from '../common/AppTable';
import AppCard from '../common/AppCard';
import AppSearch from '../common/AppSearch';
import AppFormModal, { type FormField } from '../common/AppFormModal';
import AppTextarea from '../common/AppTextarea';
import { PAGINATION } from '../../constants/appConstants';
import { useUser } from '../../hooks/useUser';
import { isAdmin, isHRAdmin } from '../../utils/roleUtils';

// Extended interface for API asset request response that may include additional fields
interface ApiAssetRequestExtended extends Omit<ApiAssetRequest, 'category_id'> {
  category_id?: string;
  subcategory_id?: string | null;
  category?: {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
  };
  subcategory?:
  | {
    id?: string;
    name?: string;
  }
  | string
  | null;
  subcategory_name?: string;
  subcategoryName?: string;
  requestedByName?: string;
  employee_id?: string;
  employee_name?: string;
  assigned_asset_id?: string | null;
  assigned_asset_name?: string | null;
  requestedByUser?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
  };
  approvedByName?: string;
  approvedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  // Legacy field for backward compatibility
  asset_category?: string;
}

// Normalize status to ensure it matches expected values
const normalizeRequestStatus = (
  status: string
): 'pending' | 'approved' | 'rejected' | 'cancelled' => {
  const normalized = (status || '').toLowerCase().trim();
  switch (normalized) {
    case 'pending':
      return 'pending';
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'rejected';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    default:
      return 'pending'; // Default fallback
  }
};

const schema = yup.object({
  action: yup.string().required('Action is required'),
  rejectionReason: yup.string().notRequired(),
  assignedAssetId: yup.string().when('action', {
    is: 'approve',
    then: schema => schema.required('Please select an asset to assign'),
    otherwise: schema => schema.notRequired(),
  }),
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const RequestManagement: React.FC = () => {
  const { user } = useUser();
  const canViewManagerRemarks = isAdmin(user?.role) || isHRAdmin(user?.role);
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [requestComments, setRequestComments] = useState<Record<string, string>>({});
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AssetRequest | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const initialLoadRef = React.useRef(false); // Track if initial load has been done
  const fetchingRef = React.useRef(false); // Track if fetch is in progress to prevent duplicate calls
  const lastFetchedPageRef = React.useRef<{
    page: number;
    limit: number;
    statusFilter?: string;
  } | null>(null);
  const assetsFetchedRef = React.useRef(false); // Track if assets have been fetched
  const backendSupportsFilteringRef = React.useRef(false); // feature-detect whether backend supports status filtering
  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();
  const lastTabRef = React.useRef(0); // Track last tab to detect tab changes
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );
  const theme = useTheme();

  // Get status filter based on active tab
  const getStatusFilter = (tabIndex: number): string | undefined => {
    switch (tabIndex) {
      case 0:
        return undefined; // All requests
      case 1:
        return 'pending';
      case 2:
        return 'approved';
      case 3:
        return 'rejected';
      default:
        return undefined;
    }
  };

  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>({
    page: 1,
    limit: PAGINATION.DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      action: '',
      rejectionReason: '',
      assignedAssetId: '',
    },
  });

  const selectedAction = watch('action');

  const transformApiRequests = React.useCallback(
    (apiRequests: ApiAssetRequestExtended[]): AssetRequest[] => {
      return apiRequests.map((apiRequest: ApiAssetRequestExtended) => {
        // Handle new API response structure with category_id and category object
        const categoryId =
          apiRequest.category_id || apiRequest.asset_category || '';
        const subcategoryId = apiRequest.subcategory_id || undefined;

        // Get category name from API response category object
        let mainCategoryName = '';
        if (
          apiRequest.category &&
          typeof apiRequest.category === 'object' &&
          apiRequest.category !== null
        ) {
          mainCategoryName = apiRequest.category.name || categoryId;
        } else if (apiRequest.asset_category) {
          mainCategoryName = apiRequest.asset_category;
        } else {
          mainCategoryName = categoryId;
        }

        // Get subcategory name from API response subcategory object
        let subcategoryName = '';
        if (apiRequest.subcategory) {
          if (
            typeof apiRequest.subcategory === 'object' &&
            apiRequest.subcategory !== null
          ) {
            subcategoryName =
              apiRequest.subcategory.name || apiRequest.subcategoryName || '';
          } else {
            subcategoryName = apiRequest.subcategory || '';
          }
        } else if (apiRequest.subcategoryName) {
          subcategoryName = apiRequest.subcategoryName;
        } else if (apiRequest.subcategory_name) {
          subcategoryName = apiRequest.subcategory_name;
        }

        // Get employee name from API response
        let employeeName = '';
        if (apiRequest.requestedByName) {
          employeeName = apiRequest.requestedByName;
        } else if (
          apiRequest.requestedByUser &&
          apiRequest.requestedByUser.name
        ) {
          employeeName = apiRequest.requestedByUser.name;
        } else if (apiRequest.requested_by) {
          employeeName = `User ${apiRequest.requested_by}`;
        }

        return {
          id: apiRequest.id,
          employeeId: apiRequest.requested_by,
          employeeName: employeeName,
          category: {
            id: categoryId,
            name: mainCategoryName,
            nameAr: mainCategoryName,
            description: '',
            color: 'var(--primary-dark-color)',
            requestedItem: subcategoryName || undefined,
          },
          subcategoryId: subcategoryId || undefined,
          subcategoryName: subcategoryName || undefined,
          remarks: apiRequest.remarks,
          managerRemarks:
            Array.isArray(apiRequest.comments) && apiRequest.comments.length > 0
              ? apiRequest.comments[apiRequest.comments.length - 1]?.comment
              : undefined,
          status: normalizeRequestStatus(apiRequest.status),
          requestedDate: apiRequest.requested_date,
          processedDate: apiRequest.approved_date || undefined,
          processedBy: apiRequest.approved_by || undefined,
          processedByName:
            apiRequest.approvedByName ||
            (apiRequest.approved_by
              ? `User ${apiRequest.approved_by}`
              : undefined),
          rejectionReason:
            apiRequest.rejection_reason && apiRequest.rejection_reason !== null
              ? apiRequest.rejection_reason
              : undefined,
          assignedAssetId: undefined, // Not provided by API
          assignedAssetName: undefined, // Not provided by API
        };
      });
    },
    []
  );

  const [statusCounts, setStatusCounts] = useState<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
  }>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
  }); // Store counts from API response

  // Fetch assets separately (only once, not on every request fetch)
  const fetchAssets = React.useCallback(async () => {
    if (assetsFetchedRef.current) return; // Already fetched

    try {
      assetsFetchedRef.current = true;

      // Fetch assets for assignment - fetch all assets with high limit to get all pages
      // This ensures all available assets are shown in the Assign Asset dropdown
      let allAssets: Record<string, unknown>[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      const maxPages = 50; // Safety limit to prevent infinite loops

      while (hasMorePages && currentPage <= maxPages) {
        const apiAssetsResponse = await assetApi.getAllAssets({
          page: currentPage,
          limit: 100, // Use a high limit to fetch more assets per page
        });

        if (apiAssetsResponse.assets && apiAssetsResponse.assets.length > 0) {
          allAssets = [...allAssets, ...apiAssetsResponse.assets];

          // Check if there are more pages
          const totalPages = apiAssetsResponse.pagination?.totalPages || 1;
          hasMorePages = currentPage < totalPages;
          currentPage++;
        } else {
          hasMorePages = false;
        }
      }

      const transformedAssets: Asset[] = allAssets.map(
        (apiAsset: Record<string, unknown>) => {
          // Extract category name from API response
          // Category can be an object { id, name, ... } or a string
          let categoryName = '';
          let categoryId = '';

          if (
            apiAsset.category &&
            typeof apiAsset.category === 'object' &&
            apiAsset.category !== null
          ) {
            const categoryObj = apiAsset.category as {
              id?: string;
              name?: string;
            };
            categoryName = categoryObj.name || '';
            categoryId =
              categoryObj.id || (apiAsset.category_id as string) || '';
          } else if (apiAsset.categoryName) {
            categoryName = apiAsset.categoryName as string;
            categoryId = (apiAsset.category_id as string) || '';
          } else if (typeof apiAsset.category === 'string') {
            categoryName = apiAsset.category;
            categoryId =
              (apiAsset.category_id as string) || (apiAsset.category as string);
          } else {
            categoryName = (apiAsset.categoryName as string) || '';
            categoryId = (apiAsset.category_id as string) || '';
          }

          // Try to find matching category from our comprehensive list
          const matchingCategory = assetCategories.find(
            cat =>
              cat.name.toLowerCase() === categoryName.toLowerCase() ||
              cat.subcategories?.some(
                sub => sub.toLowerCase() === categoryName.toLowerCase()
              )
          );

          return {
            id: apiAsset.id as string,
            name: apiAsset.name as string,
            category: matchingCategory
              ? {
                id: matchingCategory.id,
                name: matchingCategory.name,
                nameAr: matchingCategory.nameAr,
                description: matchingCategory.description,
                color: matchingCategory.color,
                subcategories: matchingCategory.subcategories,
              }
              : {
                id: categoryId,
                name: categoryName,
                nameAr: categoryName,
                description: '',
                color: 'var(--primary-dark-color)',
              },
            status: apiAsset.status as AssetStatus,
            assignedTo: apiAsset.assigned_to as string | undefined,
            assignedToName: undefined,
            serialNumber: '',
            purchaseDate: apiAsset.purchase_date as string,
            location: '',
            description: '',
            createdAt: apiAsset.created_at as string,
            updatedAt: apiAsset.created_at as string,
            subcategoryId: (apiAsset.subcategoryId ||
              apiAsset.subcategory_id) as string | undefined,
          };
        }
      );

      setAssets(transformedAssets);
    } catch {
      assetsFetchedRef.current = false; // Reset on error so it can retry
    }
  }, []);

  // Fetch data from API
  const fetchRequests = React.useCallback(
    async (
      page: number = 1,
      limit: number = PAGINATION.DEFAULT_PAGE_SIZE,
      statusFilter?: string,
      isInitialLoad: boolean = false
    ) => {
      // Prevent duplicate calls
      if (fetchingRef.current) {
        return;
      }

      try {
        fetchingRef.current = true;

        if (isInitialLoad && page === 1) {
          setInitialLoading(true);
        }

        // If backend doesn't support filtering and we have a status filter,
        // we need to fetch all pages to get all filtered records
        // First, check if backend supports filtering by making a test call
        let allFilteredRequests: AssetRequest[] = [];
        let finalTotal = 0;
        let finalTotalPages = 1;
        let backendLimit = limit;
        let backendPage = page;

        if (statusFilter) {
          // First, fetch page 1 to check if backend filters
          const testApiFilters: {
            page: number;
            limit: number;
            status?: string;
          } = {
            page: 1,
            limit: limit,
            status: statusFilter,
          };

          const testResponse: PaginatedResponse<ApiAssetRequest> =
            await assetApi.getAllAssetRequests(testApiFilters);

          const testTransformed = transformApiRequests(
            (testResponse.items || []) as ApiAssetRequestExtended[]
          );

          // Check if backend filtered correctly
          const allMatchFilter =
            testTransformed.length === 0 ||
            testTransformed.every(req => req.status === statusFilter);

          if (allMatchFilter && testResponse.total && testResponse.totalPages) {
            // Backend supports filtering - use normal pagination
            backendSupportsFilteringRef.current = true;

            // Build API filters for the requested page
            const apiFilters: {
              page: number;
              limit: number;
              status?: string;
            } = {
              page,
              limit,
              status: statusFilter,
            };

            const apiResponse: PaginatedResponse<ApiAssetRequest> =
              await assetApi.getAllAssetRequests(apiFilters);

            const transformedRequests = transformApiRequests(
              (apiResponse.items || []) as ApiAssetRequestExtended[]
            );

            allFilteredRequests = transformedRequests;
            finalTotal = apiResponse.total || 0;
            finalTotalPages = apiResponse.totalPages || 1;
            backendLimit = apiResponse.limit || limit;
            backendPage = apiResponse.page || page;

            // Update counts
            if (apiResponse.counts) {
              setStatusCounts({
                total: apiResponse.counts.total || 0,
                pending: apiResponse.counts.pending || 0,
                approved: apiResponse.counts.approved || 0,
                rejected: apiResponse.counts.rejected || 0,
                cancelled: apiResponse.counts.cancelled || 0,
              });
            }
          } else {
            // Backend doesn't support filtering - fetch all pages and filter client-side

            let allRequests: AssetRequest[] = [];
            let currentPage = 1;
            let hasMorePages = true;
            const maxPages = 100; // Safety limit
            let totalPagesFromBackend = testResponse.totalPages || 1;

            // Fetch all pages
            while (
              hasMorePages &&
              currentPage <= maxPages &&
              currentPage <= totalPagesFromBackend
            ) {
              const pageApiFilters: {
                page: number;
                limit: number;
              } = {
                page: currentPage,
                limit: limit,
              };

              const pageResponse: PaginatedResponse<ApiAssetRequest> =
                await assetApi.getAllAssetRequests(pageApiFilters);

              const pageTransformed = transformApiRequests(
                (pageResponse.items || []) as ApiAssetRequestExtended[]
              );

              allRequests = [...allRequests, ...pageTransformed];

              // Update totalPages if we got new info
              if (pageResponse.totalPages) {
                totalPagesFromBackend = pageResponse.totalPages;
              }

              hasMorePages =
                currentPage < totalPagesFromBackend &&
                pageTransformed.length === limit;
              currentPage++;

              // Update counts from first page
              if (currentPage === 2 && pageResponse.counts) {
                setStatusCounts({
                  total: pageResponse.counts.total || 0,
                  pending: pageResponse.counts.pending || 0,
                  approved: pageResponse.counts.approved || 0,
                  rejected: pageResponse.counts.rejected || 0,
                  cancelled: pageResponse.counts.cancelled || 0,
                });
              }
            }

            // Filter client-side
            allFilteredRequests = allRequests.filter(
              req => req.status === statusFilter
            );

            // Calculate pagination for filtered results
            finalTotal = allFilteredRequests.length;
            finalTotalPages = Math.ceil(finalTotal / limit);
            backendLimit = limit;
            backendPage = page;

            // Apply pagination to filtered results
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            allFilteredRequests = allFilteredRequests.slice(
              startIndex,
              endIndex
            );

            // Update counts from test response if available
            if (testResponse.counts) {
              setStatusCounts({
                total: testResponse.counts.total || 0,
                pending: testResponse.counts.pending || 0,
                approved: testResponse.counts.approved || 0,
                rejected: testResponse.counts.rejected || 0,
                cancelled: testResponse.counts.cancelled || 0,
              });
            }
          }
        } else {
          // No filter - normal pagination
          const apiFilters: {
            page: number;
            limit: number;
          } = {
            page,
            limit,
          };

          const apiResponse: PaginatedResponse<ApiAssetRequest> =
            await assetApi.getAllAssetRequests(apiFilters);

          const transformedRequests = transformApiRequests(
            (apiResponse.items || []) as ApiAssetRequestExtended[]
          );

          allFilteredRequests = transformedRequests;
          finalTotal = apiResponse.total || 0;
          finalTotalPages = apiResponse.totalPages || 1;
          backendLimit = apiResponse.limit || limit;
          backendPage = apiResponse.page || page;

          // Update counts
          if (apiResponse.counts) {
            setStatusCounts({
              total: apiResponse.counts.total || 0,
              pending: apiResponse.counts.pending || 0,
              approved: apiResponse.counts.approved || 0,
              rejected: apiResponse.counts.rejected || 0,
              cancelled: apiResponse.counts.cancelled || 0,
            });
          }
        }

        // Use the results we prepared
        const finalRequests = allFilteredRequests;

        // Set pagination
        setPagination(prev => ({
          ...prev,
          page: backendPage,
          limit: backendLimit,
          total: finalTotal,
          totalPages: finalTotalPages,
        }));

        setRequests(finalRequests);

        let allAssets: Record<string, unknown>[] = [];
        let assetCurrentPage = 1;
        let assetsHasMorePages = true;
        const maxPages = 50; // Safety limit to prevent infinite loops

        while (assetsHasMorePages && assetCurrentPage <= maxPages) {
          const apiAssetsResponse = await assetApi.getAllAssets({
            page: assetCurrentPage,
            limit: 100, // Use a high limit to fetch more assets per page
          });

          if (apiAssetsResponse.assets && apiAssetsResponse.assets.length > 0) {
            allAssets = [...allAssets, ...apiAssetsResponse.assets];

            // Check if there are more pages
            const totalPages = apiAssetsResponse.pagination?.totalPages || 1;
            assetsHasMorePages = assetCurrentPage < totalPages;
            assetCurrentPage++;
          } else {
            assetsHasMorePages = false;
          }
        }

        const transformedAssets: Asset[] = allAssets.map(
          (apiAsset: Record<string, unknown>) => {
            // Extract category name from API response
            // Category can be an object { id, name, ... } or a string
            let categoryName = '';
            let categoryId = '';

            if (
              apiAsset.category &&
              typeof apiAsset.category === 'object' &&
              apiAsset.category !== null
            ) {
              const categoryObj = apiAsset.category as {
                id?: string;
                name?: string;
              };
              categoryName = categoryObj.name || '';
              categoryId =
                categoryObj.id || (apiAsset.category_id as string) || '';
            } else if (apiAsset.categoryName) {
              categoryName = apiAsset.categoryName as string;
              categoryId = (apiAsset.category_id as string) || '';
            } else if (typeof apiAsset.category === 'string') {
              categoryName = apiAsset.category;
              categoryId =
                (apiAsset.category_id as string) ||
                (apiAsset.category as string);
            } else {
              categoryName = (apiAsset.categoryName as string) || '';
              categoryId = (apiAsset.category_id as string) || '';
            }

            // Try to find matching category from our comprehensive list
            const matchingCategory = assetCategories.find(
              cat =>
                cat.name.toLowerCase() === categoryName.toLowerCase() ||
                cat.subcategories?.some(
                  sub => sub.toLowerCase() === categoryName.toLowerCase()
                )
            );

            return {
              id: apiAsset.id as string,
              name: apiAsset.name as string,
              category: matchingCategory
                ? {
                  id: matchingCategory.id,
                  name: matchingCategory.name,
                  nameAr: matchingCategory.nameAr,
                  description: matchingCategory.description,
                  color: matchingCategory.color,
                  subcategories: matchingCategory.subcategories,
                }
                : {
                  id: categoryId,
                  name: categoryName,
                  nameAr: categoryName,
                  description: '',
                  color: 'var(--primary-dark-color)',
                },
              status: apiAsset.status as AssetStatus,
              assignedTo: apiAsset.assigned_to as string | undefined,
              assignedToName: undefined,
              serialNumber: '',
              purchaseDate: apiAsset.purchase_date as string,
              location: '',
              description: '',
              createdAt: apiAsset.created_at as string,
              updatedAt: apiAsset.created_at as string,
              subcategoryId: (apiAsset.subcategoryId ||
                apiAsset.subcategory_id) as string | undefined,
            };
          }
        );

        setAssets(transformedAssets);
      } catch (error: unknown) {
        const axiosError = error as
          | AxiosError<{ message?: string }>
          | undefined;

        // Only show error toast if it's a real error (not 404 or empty results)
        const status = axiosError?.response?.status;
        const errorMessage =
          axiosError?.response?.data?.message || axiosError?.message || '';

        // Don't show error for 404 (not found) or if it's just empty results
        if (status !== 404 && status !== 200 && errorMessage) {
          showError(errorMessage || 'Failed to load data');
        } else {
          // If it's 404 or empty results, just set empty state without showing error
          setRequests([]);
          setPagination(prev => ({
            ...prev,
            total: 0,
            totalPages: 1,
          }));
        }
      } finally {
        fetchingRef.current = false;
        // Only set initial loading to false on very first load
        if (isInitialLoad && page === 1) {
          setInitialLoading(false);
        }
      }
    },
    [transformApiRequests, showError]
  );

  // Initial load effect
  React.useEffect(() => {
    if (initialLoadRef.current || fetchingRef.current) {
      return;
    }

    initialLoadRef.current = true;
    lastTabRef.current = tabValue;

    const statusFilter = getStatusFilter(tabValue);
    lastFetchedPageRef.current = {
      page: 1,
      limit: pagination.limit,
      statusFilter: statusFilter,
    };

    fetchRequests(1, pagination.limit, statusFilter, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Handle tab changes - separate effect to ensure it always runs
  React.useEffect(() => {
    if (!initialLoadRef.current) {
      lastTabRef.current = tabValue; // Initialize
      return;
    }
    if (fetchingRef.current) return;

    // Check if tab actually changed
    if (lastTabRef.current === tabValue) {
      return; // Tab hasn't changed
    }

    lastTabRef.current = tabValue;
    const statusFilter = getStatusFilter(tabValue);

    // Mark as fetched to prevent page change effect from running
    lastFetchedPageRef.current = {
      page: 1,
      limit: pagination.limit,
      statusFilter: statusFilter,
    };

    // Update pagination - this will trigger page change effect, but it will see it's already fetched
    setPagination(prev => ({
      ...prev,
      page: 1,
      total: 0,
      totalPages: 0,
    }));

    // Fetch directly - page change effect will see it's already fetched and skip
    fetchRequests(1, pagination.limit, statusFilter, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue]);

  // Handle page/limit changes
  React.useEffect(() => {
    if (!initialLoadRef.current) return;
    if (fetchingRef.current) return;

    const statusFilter = getStatusFilter(tabValue);
    const lastFetched = lastFetchedPageRef.current;

    // Check if already fetched this combination
    if (
      lastFetched &&
      lastFetched.page === pagination.page &&
      lastFetched.limit === pagination.limit &&
      lastFetched.statusFilter === statusFilter
    ) {
      return;
    }

    lastFetchedPageRef.current = {
      page: pagination.page,
      limit: pagination.limit,
      statusFilter: statusFilter,
    };

    fetchRequests(pagination.page, pagination.limit, statusFilter, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  // Filter requests by search term only (status filtering is done by backend)
  const filteredRequests = useMemo(() => {
    if (!searchTerm) return requests;

    return requests.filter(
      request =>
        request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.category.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        request.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [requests, searchTerm]);

  // Get available assets for the selected category
  const availableAssets = useMemo(() => {
    if (!selectedRequest) return [];

    const filtered = assets.filter(asset => {
      // Check if asset status is available
      if (asset.status !== 'available') {
        return false;
      }

      // If request has a subcategoryId, ONLY match assets with the exact same subcategoryId
      if (selectedRequest.subcategoryId) {
        // Exact subcategory ID match required
        if (asset.subcategoryId === selectedRequest.subcategoryId) {
          return true;
        }
        // If subcategoryId doesn't match, reject this asset
        return false;
      }

      // If no subcategoryId in request, fall back to category name matching
      // Get the request category name
      const requestCategoryName = selectedRequest.category.name;

      // Direct category name match
      if (asset.category.name === requestCategoryName) {
        return true;
      }

      // Check if the request has subcategory format (e.g., "IT Equipment - Laptop")
      if (requestCategoryName.includes(' - ')) {
        const mainCategoryName = requestCategoryName.split(' - ')[0];
        if (asset.category.name === mainCategoryName) {
          return true;
        }
      }

      // If request category is a main category, check if asset category matches
      // This handles cases where asset might be in a subcategory but request is for main category
      const mainCategories = [
        'IT Equipment',
        'Software & Licenses',
        'Office Equipment',
        'Mobility / Transport',
        'Employee Accessories',
        'Facility Assets',
        'Health & Safety',
        'Miscellaneous / Custom',
      ];

      if (mainCategories.includes(requestCategoryName)) {
        // Check if asset category starts with the main category
        if (asset.category.name.startsWith(requestCategoryName)) {
          return true;
        }
      }

      return false;
    });

    return filtered;
  }, [assets, selectedRequest]);

  // Get filtered requests for display (status filtering is done by backend, only search is client-side)
  const getFilteredRequestsByTab = (status?: string) => {
    if (!status || status === 'all') return filteredRequests;
    return filteredRequests.filter(r => r.status === status);
  };

  const handleProcessRequest = (request: AssetRequest) => {
    setSelectedRequest(request);
    setIsProcessModalOpen(true);
    reset({
      action: request.status === 'approved' ? 'approve' : '',
      rejectionReason: '',
      assignedAssetId: '',
    });
    setAnchorEl(null);
    // Fetch assets when modal opens (only if not already fetched)
    if (!assetsFetchedRef.current) {
      fetchAssets();
    }
  };

  const handleViewRequest = (request: AssetRequest) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
    setAnchorEl(null);
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    requestId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedRequestId(requestId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRequestId(null);
  };

  const handleProcessSubmit = async (data: Record<string, unknown>) => {
    if (!selectedRequest) return;

    setLoading(true);
    try {
      if (data.action === 'approve') {
        // Validate that we have a valid asset ID
        if (!data.assignedAssetId) {
          throw new Error('No asset selected for assignment');
        }

        // Check if the selected asset is actually in our available assets list
        const selectedAsset = availableAssets.find(
          asset => asset.id === data.assignedAssetId
        );
        if (!selectedAsset) {
          throw new Error(
            'Selected asset is not available or not in the correct category'
          );
        }

        // Validate subcategory ID match if request has subcategoryId
        if (selectedRequest.subcategoryId) {
          if (selectedAsset.subcategoryId !== selectedRequest.subcategoryId) {
            throw new Error(
              `The selected asset does not match the requested subcategory. Requested subcategory ID: ${selectedRequest.subcategoryId}, Asset subcategory ID: ${selectedAsset.subcategoryId || 'none'}`
            );
          }
        }

        // Prepare payload for approval - use snake_case only
        const payload = {
          asset_id: data.assignedAssetId as string,
          employee_id: selectedRequest.employeeId,
          request_id: selectedRequest.id,
          category_id: selectedRequest.category.id,
          subcategory_id: selectedRequest.subcategoryId || undefined,
        };

        try {
          await assetApi.approveAssetRequest(selectedRequest.id, payload);

          // Update local state immediately with approval details
          setRequests(prevRequests =>
            prevRequests.map(request =>
              request.id === selectedRequest.id
                ? {
                  ...request,
                  status: 'approved' as const,
                  assignedAssetId: data.assignedAssetId as string,
                  assignedAssetName: selectedAsset.name,
                  processedDate: new Date().toISOString().split('T')[0],
                  processedBy: 'current-user', // You might want to get this from auth context
                  processedByName: 'Current User', // You might want to get this from auth context
                }
                : request
            )
          );

          // Refresh paginated requests to update counts
          fetchRequests(
            pagination.page,
            pagination.limit,
            getStatusFilter(tabValue),
            false
          );

          // Show success message with asset assignment details
          showSuccess(
            `Asset "${selectedAsset.name}" has been assigned to ${selectedRequest.employeeName} successfully!`
          );

          // Close modal and return early for approval - no need to refresh from API
          setIsProcessModalOpen(false);
          setLoading(false);
          return;
        } catch (approvalError: unknown) {
          const axiosError = approvalError as
            | AxiosError<{ message?: string }>
            | undefined;

          const errorMessage =
            axiosError?.response?.data?.message ||
            axiosError?.message ||
            'Failed to approve request';
          showError(errorMessage);
          setLoading(false);
          return;
        }
      } else if (data.action === 'reject') {
        try {
          await assetApi.rejectAssetRequest(
            selectedRequest.id,
            data.rejectionReason as string
          );

          // Update local state immediately with rejection reason
          setRequests(prevRequests =>
            prevRequests.map(request =>
              request.id === selectedRequest.id
                ? {
                  ...request,
                  status: 'rejected' as const,
                  rejectionReason: data.rejectionReason as string,
                  processedDate: new Date().toISOString().split('T')[0],
                  processedBy: 'current-user', // You might want to get this from auth context
                  processedByName: 'Current User', // You might want to get this from auth context
                }
                : request
            )
          );

          // Refresh paginated requests to update counts
          fetchRequests(
            pagination.page,
            pagination.limit,
            getStatusFilter(tabValue),
            false
          );

          showError(
            new Error(
              `Request from ${selectedRequest.employeeName} has been rejected successfully`
            )
          );

          // Close modal and return early for rejection - no need to refresh from API
          setIsProcessModalOpen(false);
          setLoading(false);
          return;
        } catch {
          showError('Failed to reject request');
          setLoading(false);
          return;
        }
      }

      const statusFilter = getStatusFilter(tabValue);
      // Build API filters - only include status if it's defined
      const apiFilters: {
        page: number;
        limit: number;
        status?: string;
      } = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (statusFilter) {
        apiFilters.status = statusFilter;
      }

      const apiResponse: PaginatedResponse<ApiAssetRequest> =
        await assetApi.getAllAssetRequests(apiFilters);

      // Refresh assets to reflect assignment status - fetch all assets with pagination
      let allAssets: Record<string, unknown>[] = [];
      let assetCurrentPage = 1;
      let assetsHasMorePages = true;
      const maxPages = 50; // Safety limit to prevent infinite loops

      while (assetsHasMorePages && assetCurrentPage <= maxPages) {
        const apiAssetsResponse = await assetApi.getAllAssets({
          page: assetCurrentPage,
          limit: 100, // Use a high limit to fetch more assets per page
        });

        if (apiAssetsResponse.assets && apiAssetsResponse.assets.length > 0) {
          allAssets = [...allAssets, ...apiAssetsResponse.assets];

          // Check if there are more pages
          const totalPages = apiAssetsResponse.pagination?.totalPages || 1;
          assetsHasMorePages = assetCurrentPage < totalPages;
          assetCurrentPage++;
        } else {
          assetsHasMorePages = false;
        }
      }

      const transformedAssets: Asset[] = allAssets.map(
        (apiAsset: Record<string, unknown>) => {
          // Extract category name from API response
          // Category can be an object { id, name, ... } or a string
          let categoryName = '';
          let categoryId = '';

          if (
            apiAsset.category &&
            typeof apiAsset.category === 'object' &&
            apiAsset.category !== null
          ) {
            const categoryObj = apiAsset.category as {
              id?: string;
              name?: string;
            };
            categoryName = categoryObj.name || '';
            categoryId =
              categoryObj.id || (apiAsset.category_id as string) || '';
          } else if (apiAsset.categoryName) {
            categoryName = apiAsset.categoryName as string;
            categoryId = (apiAsset.category_id as string) || '';
          } else if (typeof apiAsset.category === 'string') {
            categoryName = apiAsset.category;
            categoryId =
              (apiAsset.category_id as string) || (apiAsset.category as string);
          } else {
            categoryName = (apiAsset.categoryName as string) || '';
            categoryId = (apiAsset.category_id as string) || '';
          }

          // Try to find matching category from our comprehensive list
          const matchingCategory = assetCategories.find(
            cat =>
              cat.name.toLowerCase() === categoryName.toLowerCase() ||
              cat.subcategories?.some(
                sub => sub.toLowerCase() === categoryName.toLowerCase()
              )
          );

          return {
            id: apiAsset.id as string,
            name: apiAsset.name as string,
            category: matchingCategory
              ? {
                id: matchingCategory.id,
                name: matchingCategory.name,
                nameAr: matchingCategory.nameAr,
                description: matchingCategory.description,
                color: matchingCategory.color,
                subcategories: matchingCategory.subcategories,
              }
              : {
                id: categoryId,
                name: categoryName,
                nameAr: categoryName,
                description: '',
                color: 'var(--primary-dark-color)',
                subcategories: [],
              },
            status: apiAsset.status as AssetStatus,
            assignedTo: (apiAsset.assigned_to as string) || undefined,
            assignedToName: (apiAsset.assigned_to_name as string) || undefined,
            serialNumber: '',
            purchaseDate: apiAsset.purchase_date as string,
            location: '',
            description: '',
            createdAt: apiAsset.created_at as string,
            updatedAt:
              (apiAsset.updated_at as string) ||
              (apiAsset.created_at as string),
            subcategoryId: (apiAsset.subcategoryId ||
              apiAsset.subcategory_id) as string | undefined,
          };
        }
      );

      setAssets(transformedAssets);

      const transformedRequests: AssetRequest[] = apiResponse.items.map(
        (apiRequest: ApiAssetRequestExtended) => {
          // Guard against undefined asset_category
          if (!apiRequest.asset_category) {
            // Return a default/fallback request structure
            return {
              id: apiRequest.id,
              employeeId:
                apiRequest.employee_id || apiRequest.requested_by || '',
              employeeName:
                apiRequest.employee_name ||
                apiRequest.requestedByName ||
                'Unknown',
              category: {
                id: '',
                name: 'Unknown Category',
                nameAr: '',
                description: '',
              },
              status: apiRequest.status || 'pending',
              requestedDate:
                apiRequest.requested_date || new Date().toISOString(),
              assignedAssetId: apiRequest.assigned_asset_id || undefined,
              assignedAssetName: apiRequest.assigned_asset_name || undefined,
            };
          }

          // Try to find matching category from our comprehensive list
          let matchingCategory = assetCategories.find(
            cat =>
              cat.name.toLowerCase() ===
              apiRequest.asset_category!.toLowerCase() ||
              cat.subcategories?.some(
                sub =>
                  sub.toLowerCase() === apiRequest.asset_category!.toLowerCase()
              )
          );

          // If no direct match, try to match subcategory format (e.g., "Mobility / Transport - Fuel Card")
          if (!matchingCategory && apiRequest.asset_category?.includes(' - ')) {
            const [mainCategoryName, subcategoryName] =
              apiRequest.asset_category.split(' - ');
            matchingCategory = assetCategories.find(
              cat =>
                cat.name.toLowerCase() === mainCategoryName.toLowerCase() &&
                cat.subcategories?.some(
                  sub => sub.toLowerCase() === subcategoryName.toLowerCase()
                )
            );
          }

          // Use asset_category as main category name (no need to split)
          const mainCategoryName = apiRequest.asset_category;
          const subcategoryName = '';

          return {
            id: apiRequest.id,
            employeeId: apiRequest.requested_by,
            employeeName:
              apiRequest.requestedByName ||
              apiRequest.requestedByUser?.name ||
              `User ${apiRequest.requested_by}`,
            category: matchingCategory
              ? {
                id: matchingCategory.id,
                name: matchingCategory.name,
                nameAr: matchingCategory.nameAr,
                description: matchingCategory.description,
                color: matchingCategory.color,
                subcategories: matchingCategory.subcategories,
                // Add the specific item requested
                requestedItem: subcategoryName || apiRequest.asset_category,
              }
              : {
                id: apiRequest.asset_category || 'unknown',
                name: mainCategoryName || 'Unknown Category',
                nameAr: apiRequest.asset_category || 'Unknown Category',
                description: '',
                color: 'var(--primary-dark-color)',
                requestedItem: subcategoryName || apiRequest.asset_category,
              },
            remarks: apiRequest.remarks,
            managerRemarks:
              Array.isArray(apiRequest.comments) && apiRequest.comments.length > 0
                ? apiRequest.comments[apiRequest.comments.length - 1]?.comment
                : undefined,
            status: normalizeRequestStatus(apiRequest.status),
            requestedDate: apiRequest.requested_date,
            processedDate: apiRequest.approved_date || undefined,
            processedBy: apiRequest.approved_by || undefined,
            processedByName:
              apiRequest.approvedByName ||
              (apiRequest.approved_by
                ? `User ${apiRequest.approved_by}`
                : undefined),
            rejectionReason: undefined,
            assignedAssetId: undefined,
            assignedAssetName: undefined,
          };
        }
      );

      setRequests(transformedRequests);

      // Update pagination info from API response - use backend values
      const backendLimit = apiResponse.limit || pagination.limit;
      const backendTotal = apiResponse.total || 0;
      const backendTotalPages = apiResponse.totalPages || 1;
      const backendPage = apiResponse.page || pagination.page;

      setPagination(prev => ({
        ...prev,
        page: backendPage,
        limit: backendLimit,
        total: backendTotal,
        totalPages: backendTotalPages,
      }));

      setIsProcessModalOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    // Page change is not initial load, so pass false
    setPagination(prev => ({ ...prev, page }));
  };

  // Use counts from API response
  const displayCounts = useMemo(() => {
    // Always use counts from statusCounts state (updated from API response)
    return {
      all: statusCounts.total,
      pending: statusCounts.pending,
      approved: statusCounts.approved,
      rejected: statusCounts.rejected,
    };
  }, [statusCounts]);

  const viewModalFields = React.useMemo((): FormField[] => {
    if (!selectedRequest) return [];

    return [
      {
        name: 'headingEmployeeInfo',
        label: '',
        value: '',
        onChange: () => { },
        component: (
          <Box sx={{ mb: 1 }}>
            <Typography
              fontWeight={600}
              className='subheading2'
              sx={{ color: 'text.primary' }}
            >
              Employee Information
            </Typography>
          </Box>
        ),
      },
      {
        name: 'employeeInfo',
        label: 'Employee',
        value: selectedRequest.employeeName || '',
        onChange: () => { },
        component: (
          <Box>
            <Typography variant='body1' fontWeight={600}>
              {selectedRequest.employeeName}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {selectedRequest.category.name}
            </Typography>
            {(selectedRequest.subcategoryName ||
              selectedRequest.category.requestedItem) && (
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ display: 'block', mt: 0.5 }}
                >
                  {selectedRequest.subcategoryName ||
                    selectedRequest.category.requestedItem}
                </Typography>
              )}
          </Box>
        ),
      },
      {
        name: 'headingRequestInfo',
        label: '',
        value: '',
        onChange: () => { },
        component: (
          <Box sx={{ mt: 1 }}>
            <Typography
              fontWeight={600}
              className='subheading2'
              sx={{ color: 'text.primary' }}
            >
              Request Information
            </Typography>
          </Box>
        ),
      },
      {
        name: 'status',
        label: 'Status',
        value: selectedRequest.status || '',
        onChange: () => { },
        component: (
          <StatusChip status={selectedRequest.status} type='request' />
        ),
      },
      {
        name: 'requestedDate',
        label: 'Requested Date',
        value: selectedRequest.requestedDate || '',
        onChange: () => { },
        component: (
          <Typography>{formatDate(selectedRequest.requestedDate)}</Typography>
        ),
      },
      {
        name: 'headingEmployeeRemarks',
        label: '',
        value: '',
        onChange: () => { },
        component: (
          <Box sx={{ mt: 1 }}>
            <Typography
              fontWeight={600}
              className='subheading2'
              sx={{ color: 'text.primary' }}
            >
              Employee Remarks
            </Typography>
          </Box>
        ),
      },
      {
        name: 'remarks',
        label: 'Remarks',
        value: selectedRequest.remarks || '',
        onChange: () => { },
        component: selectedRequest.remarks ? (
          <Typography
            variant='body2'
            sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {selectedRequest.remarks}
          </Typography>
        ) : (
          <Typography variant='body2' color='text.secondary'>
            No remarks
          </Typography>
        ),
      },
      {
        name: 'headingProcessing',
        label: '',
        value: '',
        onChange: () => { },
        component: (
          <Box sx={{ mt: 1 }}>
            <Typography
              fontWeight={600}
              className='subheading2'
              sx={{ color: 'text.primary' }}
            >
              Processing Information
            </Typography>
          </Box>
        ),
      },
      {
        name: 'processing',
        label: 'Processing Information',
        value: selectedRequest.processedDate || '',
        onChange: () => { },
        component: (
          <Box>
            {selectedRequest.processedDate && (
              <Typography variant='body2'>
                <strong>Processed Date:</strong>{' '}
                {new Date(selectedRequest.processedDate).toLocaleDateString()}
              </Typography>
            )}
            {selectedRequest.processedByName && (
              <Typography variant='body2'>
                <strong>Processed By:</strong> {selectedRequest.processedByName}
              </Typography>
            )}
            {selectedRequest.assignedAssetName && (
              <Alert severity='success' sx={{ mt: 1 }}>
                <Typography variant='body2'>
                  <strong>Assigned Asset:</strong>{' '}
                  {selectedRequest.assignedAssetName}
                </Typography>
              </Alert>
            )}
            {selectedRequest.rejectionReason &&
              selectedRequest.rejectionReason.trim() !== '' && (
                <Alert severity='error' sx={{ mt: 1 }}>
                  <Typography
                    variant='body2'
                    sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  >
                    <strong>Rejection Reason:</strong>{' '}
                    {selectedRequest.rejectionReason}
                  </Typography>
                </Alert>
              )}
          </Box>
        ),
      },
    ];
  }, [selectedRequest]);

  const processModalFields = React.useMemo((): FormField[] => {
    return [
      {
        name: 'action',
        label: 'Action',
        value: '',
        onChange: () => { },
        component: (
          <Controller
            name='action'
            control={control}
            render={({ field }) => (
              <AppSelect
                label='Action'
                fullWidth
                error={!!errors.action}
                disabled={loading}
                {...field}
              >
                <MenuItem value='approve'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ApproveIcon color='success' />
                    Approve Request
                  </Box>
                </MenuItem>
                <MenuItem value='reject'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RejectIcon color='error' />
                    Reject Request
                  </Box>
                </MenuItem>
              </AppSelect>
            )}
          />
        ),
      },
      ...(selectedAction === 'approve' && availableAssets.length === 0
        ? [
            {
              name: 'assetNotAvailableMessage',
              label: '',
              value: '',
              onChange: () => { },
              component: (
                <Alert severity='warning' sx={{ mt: 1 }}>
                  Asset not available
                </Alert>
              ),
            },
          ]
        : []),
      {
        name: 'assignedAssetId',
        label: 'Assign Asset',
        value: '',
        onChange: () => { },
        component: (
          <Controller
            name='assignedAssetId'
            control={control}
            render={({ field }) => (
              <AppSelect
                label='Assign Asset'
                fullWidth
                error={!!errors.assignedAssetId}
                disabled={loading || availableAssets.length === 0}
                {...field}
              >
                {availableAssets.length === 0 ? (
                  <MenuItem disabled>No available assets found</MenuItem>
                ) : (
                  availableAssets.map(asset => (
                    <MenuItem key={asset.id} value={asset.id}>
                      <Box>
                        <Typography variant='body2' fontWeight={500}>
                          {asset.name}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {asset.category.name} - {asset.status}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </AppSelect>
            )}
          />
        ),
      },
      {
        name: 'rejectionReason',
        label: 'Rejection Reason (Optional)',
        value: '',
        onChange: () => { },
        component: (
          <Controller
            name='rejectionReason'
            control={control}
            render={({ field }) => (
              <AppTextarea
                {...field}
                label='Rejection Reason (Optional)'
                rows={3}
                placeholder='Optionally provide a reason for rejection...'
                error={!!errors.rejectionReason}
                helperText={errors.rejectionReason?.message}
                disabled={loading}
              />
            )}
          />
        ),
      },
      {
        name: 'remarksInfo',
        label: 'Employee Remarks',
        value: '',
        onChange: () => { },
        component: selectedRequest?.remarks ? (
          <Alert severity='info'>
            <Typography variant='body2'>
              <strong>Employee Remarks:</strong> {selectedRequest.remarks}
            </Typography>
          </Alert>
        ) : undefined,
      },
    ];
  }, [control, errors, loading, availableAssets, selectedRequest, selectedAction]);

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
          <CircularProgress sx={{ color: 'var(--primary-dark-color)' }} />
        </Stack>
      </Box>
    );
  }

  const renderRequestRow = (request: AssetRequest) => (
    <TableRow key={request.id} hover>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{ width: 32, height: 32, bgcolor: 'var(--primary-dark-color)' }}
          >
            {request.employeeName.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant='body2' fontWeight={500}>
              {request.employeeName}
            </Typography>
            <Box>
              <Typography variant='caption' color='text.secondary'>
                {request.category.name}
              </Typography>
              {(request.subcategoryName || request.category.requestedItem) && (
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ display: 'block', mt: 0.5 }}
                >
                  {request.subcategoryName || request.category.requestedItem}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <StatusChip status={request.status} type='request' />
      </TableCell>
      <TableCell>{formatDate(request.requestedDate)}</TableCell>
      <TableCell>
        {request.remarks && (
          <Tooltip title={request.remarks} arrow>
            <Typography
              variant='body2'
              sx={{
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {request.remarks}
            </Typography>
          </Tooltip>
        )}
      </TableCell>
      <TableCell data-truncate='true'>
        {request.rejectionReason &&
          request.rejectionReason !== null &&
          request.rejectionReason.trim() !== '' && (
            <Tooltip title={request.rejectionReason} arrow>
              <Typography variant='body2' color='text.primary'>
                {request.rejectionReason}
              </Typography>
            </Tooltip>
          )}
      </TableCell>
      {canViewManagerRemarks && (
        <TableCell align='center'>
          {(request.managerRemarks || requestComments[request.id]) && (
            <Tooltip
              title={request.managerRemarks || requestComments[request.id] || ''}
              arrow
            >
              <Typography variant='body2' color='text.primary'>
                {request.managerRemarks || requestComments[request.id]}
              </Typography>
            </Tooltip>
          )}
        </TableCell>
      )}
      <TableCell align='right'>
        <IconButton
          onClick={e => handleMenuClick(e, request.id)}
          size='small'
          sx={{ color: theme.palette.text.primary }}
          aria-label={`Actions menu for request ${request.id}`}
          aria-haspopup='true'
          aria-expanded={Boolean(anchorEl) && selectedRequestId === request.id}
        >
          <MoreVertIcon aria-hidden='true' />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl) && selectedRequestId === request.id}
          onClose={handleMenuClose}
          role='menu'
          aria-label='Request actions menu'
        >
          <MenuItem
            onClick={() => handleViewRequest(request)}
            role='menuitem'
            aria-label='View request details'
          >
            <ListItemIcon>
              <ViewIcon fontSize='small' aria-hidden='true' />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          {request.status === 'pending' && (
            <MenuItem
              onClick={() => handleProcessRequest(request)}
              role='menuitem'
              aria-label='Process request'
            >
              <ListItemIcon>
                <AssignmentIcon fontSize='small' aria-hidden='true' />
              </ListItemIcon>
              <ListItemText>Process Request</ListItemText>
            </MenuItem>
          )}
        </Menu>
      </TableCell>
    </TableRow >
  );

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography
          variant='h4'
          fontSize={{ xs: '32px', lg: '48px' }}
          fontWeight={600}
        >
          Asset Request Management
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <AppCard compact>
            <Typography color='textSecondary' gutterBottom>
              Total Requests
            </Typography>
            <Typography variant='h4' fontWeight={600}>
              {displayCounts.all}
            </Typography>
          </AppCard>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <AppCard compact>
            <Typography color='textSecondary' gutterBottom>
              Pending
            </Typography>
            <Typography variant='h4' fontWeight={600} color='warning.main'>
              {displayCounts.pending}
            </Typography>
          </AppCard>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <AppCard compact>
            <Typography color='textSecondary' gutterBottom>
              Approved
            </Typography>
            <Typography variant='h4' fontWeight={600} color='success.main'>
              {displayCounts.approved}
            </Typography>
          </AppCard>
        </Box>
        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
          <AppCard compact>
            <Typography color='textSecondary' gutterBottom>
              Rejected
            </Typography>
            <Typography variant='h4' fontWeight={600} color='error.main'>
              {displayCounts.rejected}
            </Typography>
          </AppCard>
        </Box>
      </Box>

      {/* Search */}
      <AppCard sx={{ mb: 3 }}>
        <AppSearch
          placeholder='Search requests by employee, category, or status...'
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchTerm(e.target.value)
          }
          sx={{ borderRadius: 2, width: '100%' }}
        />
      </AppCard>

      {/* Tabs */}
      <AppCard sx={{ padding: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: 'var(--primary-dark-color)',
              },
            }}
          >
            <Tab
              label='All Requests'
              sx={{ '&.Mui-selected': { color: 'var(--primary-dark-color)' } }}
            />
            <Tab
              label='Pending Approval'
              sx={{ '&.Mui-selected': { color: 'var(--primary-dark-color)' } }}
            />
            <Tab
              label='Approved'
              sx={{ '&.Mui-selected': { color: 'var(--primary-dark-color)' } }}
            />
            <Tab
              label='Rejected'
              sx={{ '&.Mui-selected': { color: 'var(--primary-dark-color)' } }}
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <AppTable>
            <TableHead>
              <TableRow>
                <TableCell>Employee & Asset</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested Date</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>Rejection Reason</TableCell>
                {canViewManagerRemarks && <TableCell align='center'>Manager Remarks</TableCell>}
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredRequestsByTab().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canViewManagerRemarks ? 7 : 6} align='center' sx={{ py: 4 }}>
                    <Typography variant='body2' color='text.secondary'>
                      No records found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                getFilteredRequestsByTab().map(renderRequestRow)
              )}
            </TableBody>
          </AppTable>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <AppTable>
            <TableHead>
              <TableRow>
                <TableCell>Employee & Asset</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested Date</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>Rejection Reason</TableCell>
                {canViewManagerRemarks && <TableCell align='center'>Manager Remarks</TableCell>}
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredRequestsByTab('pending').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canViewManagerRemarks ? 7 : 6} align='center' sx={{ py: 4 }}>
                    <Typography variant='body2' color='text.secondary'>
                      No records found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                getFilteredRequestsByTab('pending').map(renderRequestRow)
              )}
            </TableBody>
          </AppTable>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <AppTable>
            <TableHead>
              <TableRow>
                <TableCell>Employee & Asset</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested Date</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>Rejection Reason</TableCell>
                {canViewManagerRemarks && <TableCell align='center'>Manager Remarks</TableCell>}
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredRequestsByTab('approved').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canViewManagerRemarks ? 7 : 6} align='center' sx={{ py: 4 }}>
                    <Typography variant='body2' color='text.secondary'>
                      No records found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                getFilteredRequestsByTab('approved').map(renderRequestRow)
              )}
            </TableBody>
          </AppTable>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <AppTable>
            <TableHead>
              <TableRow>
                <TableCell>Employee & Asset</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested Date</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>Rejection Reason</TableCell>
                {canViewManagerRemarks && <TableCell align='center'>Manager Remarks</TableCell>}
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredRequestsByTab('rejected').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canViewManagerRemarks ? 7 : 6} align='center' sx={{ py: 4 }}>
                    <Typography variant='body2' color='text.secondary'>
                      No records found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                getFilteredRequestsByTab('rejected').map(renderRequestRow)
              )}
            </TableBody>
          </AppTable>
        </TabPanel>
      </AppCard>

      {/* Pagination Controls */}
      {pagination.total > pagination.limit && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mt: 3,
          }}
        >
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            color='primary'
            disabled={initialLoading}
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Pagination Info - when searching, show filtered count */}
      {requests.length > 0 && (
        <Box display='flex' justifyContent='center' mt={1}>
          <Typography variant='body2' color='textSecondary'>
            Showing page {pagination.page} of {pagination.totalPages} (
            {searchTerm ? filteredRequests.length : pagination.total} total
            records)
          </Typography>
        </Box>
      )}

      {/* Process Request Modal (shared) */}
      <AppFormModal
        open={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        onSubmit={() => void handleSubmit(handleProcessSubmit)()}
        title={
          selectedRequest?.status === 'approved'
            ? 'Assign Asset'
            : 'Process Asset Request'
        }
        fields={processModalFields}
        cancelLabel='Cancel'
        submitLabel={
          loading
            ? 'Processing...'
            : selectedRequest?.status === 'approved'
              ? 'Assign Asset'
              : selectedAction === 'approve'
                ? 'Approve'
                : 'Reject'
        }
        isSubmitting={loading}
        hasChanges={
          !(selectedAction === 'approve' && availableAssets.length === 0)
        }
        maxWidth='sm'
      />

      {/* View Details Modal (shared) */}
      <AppFormModal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        // onSubmit={() => setIsViewModalOpen(false)}
        title='Request Details'
        fields={viewModalFields}
        // cancelLabel='Close'
        // submitLabel='Close'
        // isSubmitting={false}
        // hasChanges={false}
        hideActions={true}
        maxWidth='md'
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

export default RequestManagement;
