import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Tabs,
  Tab,
  InputAdornment,
  CircularProgress,
  Stack,
  Pagination,
  Button,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import AppTable from '../common/AppTable';
import AppButton from '../common/AppButton';
import Icon from '../common/Icon';
import AppDropdown from '../common/AppDropdown';
import AppFormModal from '../common/AppFormModal';
import AppTextarea from '../common/AppTextarea';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type { AssetRequest } from '../../types/asset';
import {
  assetApi,
  type AssetRequest as ApiAssetRequest,
} from '../../api/assetApi';
import StatusChip from './StatusChip';
// ConfirmationDialog, Snackbar and Alert not used in this component
// kept imports removed to satisfy linter
import { DeleteConfirmationDialog } from '../common/DeleteConfirmationDialog';
import { type AssetSubcategory } from '../../api/assetApi';
import { formatDate } from '../../utils/dateUtils';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import { PAGINATION } from '../../constants/appConstants';
import { isManager as roleIsManager } from '../../utils/auth';

// Extended interface for API asset request response that may include additional fields
interface ApiAssetRequestExtended extends ApiAssetRequest {
  category_id: string;
  subcategory_id?: string | null;
  subcategory_name?: string;
  category?:
    | string
    | {
        id?: string;
        name?: string;
        description?: string | null;
        icon?: string | null;
      };
  subcategory?:
    | string
    | {
        name?: string;
        title?: string;
        subcategory_name?: string;
        subcategoryName?: string;
        display_name?: string;
        label?: string;
      };
  subcategoryId?: string;
  subcategoryName?: string;
  rejection_reason?: string | null;
  // Legacy field for backward compatibility
  asset_category?: string;
}

const isSubcategoryCategoryObject = (
  category: AssetSubcategory['category']
): category is { id?: string; name?: string } =>
  typeof category === 'object' && category !== null;

// Get current user from localStorage or auth context
const getCurrentUserId = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.id || user.user_id || '1'; // Fallback to '1' if no ID found
    } catch {
      return '1'; // Fallback if parsing fails
    }
  }
  return '1'; // Default fallback
};

// Normalize status to ensure it matches expected values
const normalizeRequestStatus = (
  status: string
): 'pending' | 'approved' | 'rejected' | 'cancelled' => {
  const normalized = status.toLowerCase().trim();
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
  category: yup.string().required('Category is required'),
  subcategory: yup.string().required('Subcategory is required'),
  remarks: yup.string(),
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

const AssetRequests: React.FC = () => {
  const [viewMode, setViewMode] = useState<'my_requests' | 'team_requests'>(
    'my_requests'
  );
  const [requests, setRequests] = useState<AssetRequest[]>([]);
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
  const [rawApiRequests, setRawApiRequests] = useState<
    ApiAssetRequestExtended[]
  >([]); // Store raw API requests for re-transformation
  const [requestComments, setRequestComments] = useState<Record<string, string>>({});
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<AssetRequest | null>(
    null
  );
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedRequestForComment, setSelectedRequestForComment] = useState<AssetRequest | null>(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; description?: string }>
  >([]);
  const [subcategories, setSubcategories] = useState<AssetSubcategory[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const initialLoadRef = React.useRef(false); // Track if initial load has been done
  const fetchingRef = React.useRef(false); // Track if fetch is in progress to prevent duplicate calls
  const lastFetchedPageRef = React.useRef<{
    page: number;
    limit: number;
  } | null>(null); // Track last fetched page/limit
  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGINATION.DEFAULT_PAGE_SIZE, // Backend returns records per page
    total: 0,
    totalPages: 0,
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      category: '',
      subcategory: '',
      remarks: '',
    },
  });

  // Watch category changes to update subcategory options
  const watchedCategoryId = watch('category');

  React.useEffect(() => {
    if (watchedCategoryId) {
      setSelectedCategoryId(watchedCategoryId);
      // Reset subcategory when category changes
      setValue('subcategory', '');
    } else {
      setSelectedCategoryId('');
      setSubcategories([]);
    }
  }, [watchedCategoryId, setValue]);

  // Fetch categories from backend - load once on component mount for table display
  React.useEffect(() => {
    const fetchCategories = async () => {
      // If categories are already loaded, don't fetch again
      if (categories.length > 0) return;

      try {
        setLoadingData(true);
        const response = await assetApi.getAllAssetCategories();

        // Handle different response structures
        let categoriesData: Array<{
          id: string;
          name: string;
          description?: string;
        }> = [];
        if (Array.isArray(response)) {
          categoriesData = response;
        } else if (response.data && Array.isArray(response.data)) {
          categoriesData = response.data;
        } else if (response.items && Array.isArray(response.items)) {
          categoriesData = response.items;
        } else if (response.categories && Array.isArray(response.categories)) {
          categoriesData = response.categories;
        }

        setCategories(categoriesData);
      } catch (error) {
        showError(error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Load once on mount

  // Fetch subcategories when category is selected
  React.useEffect(() => {
    const fetchSubcategories = async () => {
      if (!selectedCategoryId) {
        setSubcategories([]);
        return;
      }

      try {
        setLoadingData(true);
        const response =
          await assetApi.getAssetSubcategoriesByCategoryId(selectedCategoryId);

        // Handle different response structures
        let subcategoriesData: AssetSubcategory[] = [];
        if (Array.isArray(response)) {
          subcategoriesData = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          subcategoriesData = response.data;
        } else if (
          response &&
          response.items &&
          Array.isArray(response.items)
        ) {
          subcategoriesData = response.items;
        } else if (
          response &&
          response.subcategories &&
          Array.isArray(response.subcategories)
        ) {
          subcategoriesData = response.subcategories;
        }

        const selectedCategory = categories.find(
          cat => cat.id === selectedCategoryId
        );
        const filteredSubcategories = subcategoriesData.filter(sub => {
          if (sub.category === selectedCategoryId) {
            return true;
          }
          if (selectedCategory && sub.category === selectedCategory.name) {
            return true;
          }
          if (isSubcategoryCategoryObject(sub.category)) {
            return sub.category.id === selectedCategoryId;
          }
          return false;
        });

        setSubcategories(filteredSubcategories);
      } catch (error) {
        showError(error);
        setSubcategories([]);
        showError(error);
      } finally {
        setLoadingData(false);
      }
    };

    if (selectedCategoryId) {
      fetchSubcategories();
    }
  }, [selectedCategoryId, categories, categories.length, showError]);

  const transformApiRequests = React.useCallback(
    (apiRequests: ApiAssetRequestExtended[]): AssetRequest[] => {
      return apiRequests.map((apiRequest: ApiAssetRequestExtended) => {
        const categoryId =
          apiRequest.category_id || apiRequest.asset_category || '';
        const subcategoryId = apiRequest.subcategory_id || undefined;

        let categoryName = '';
        if (
          apiRequest.category &&
          typeof apiRequest.category === 'object' &&
          apiRequest.category !== null
        ) {
          categoryName = apiRequest.category.name || '';
        }

        if (!categoryName) {
          const categoryObj = categories.find(cat => cat.id === categoryId);
          categoryName = categoryObj?.name || '';
        }

        if (!categoryName && categoryId) {
          categoryName = categoryId;
        }

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
        }

        if (!subcategoryName && subcategoryId) {
          const subcategoryObj = subcategories.find(
            sub => sub.id === subcategoryId
          );
          subcategoryName = subcategoryObj?.name || '';
        }

        if (!subcategoryName && apiRequest.subcategoryName) {
          subcategoryName = apiRequest.subcategoryName;
        }

        // Get latest manager comment (if any) from API comments array
        const latestManagerRemark =
          Array.isArray(apiRequest.comments) && apiRequest.comments.length > 0
            ? apiRequest.comments[apiRequest.comments.length - 1]?.comment
            : undefined;

        return {
          id: apiRequest.id,
          employeeId: apiRequest.requested_by,
          employeeName:
            apiRequest.requestedByName ||
            (apiRequest.requestedByUser
              ? apiRequest.requestedByUser.name ||
                // @ts-expect-error - handling backend response with first_name/last_name
                `${apiRequest.requestedByUser.first_name || ''} ${apiRequest.requestedByUser.last_name || ''}`.trim() ||
                apiRequest.requestedByUser.email
              : `User ${apiRequest.requested_by}`),
          category: {
            id: categoryId,
            name: categoryName,
            nameAr: categoryName,
            description: '',
            color: '#757575',
            requestedItem: subcategoryName || undefined,
          },
          subcategoryId: subcategoryId || undefined,
          subcategoryName: subcategoryName || undefined,
          remarks: apiRequest.remarks,
          managerRemarks: latestManagerRemark,
          status: normalizeRequestStatus(apiRequest.status),
          requestedDate: apiRequest.requested_date,
          processedDate: apiRequest.approved_date || undefined,
          processedBy: apiRequest.approved_by || undefined,
          processedByName:
            apiRequest.approvedByName ||
            (apiRequest.approvedByUser
              ? apiRequest.approvedByUser.name
              : apiRequest.approved_by
                ? `User ${apiRequest.approved_by}`
                : undefined),
          rejectionReason:
            apiRequest.rejection_reason && apiRequest.rejection_reason !== null
              ? apiRequest.rejection_reason
              : undefined,
          assignedAssetId: undefined,
          assignedAssetName: undefined,
        };
      });
    },
    [categories, subcategories]
  );

  // Get current user ID on component mount
  React.useEffect(() => {
    const userId = getCurrentUserId();
    setCurrentUserId(userId);
  }, []);



  // Fetch user's asset requests and available categories from API
  const fetchRequests = React.useCallback(
    async (
      page: number = 1,
      limit: number = PAGINATION.DEFAULT_PAGE_SIZE,
      isInitialLoad: boolean = false
    ) => {
      if (!currentUserId) return;

      // Prevent duplicate calls
      if (fetchingRef.current) {
        return;
      }

      try {
        fetchingRef.current = true;

        if (isInitialLoad && page === 1) {
          setInitialLoading(true);
        }

        let apiResponse;
        if (viewMode === 'team_requests') {
          apiResponse = await assetApi.getManagerTeamAssetRequests({
            page,
            limit,
          });
        } else {
          apiResponse = await assetApi.getAssetRequestById(currentUserId, {
            page,
            limit,
          });
        }

        // Store raw API requests for re-transformation when categories are loaded
        let apiRequests = apiResponse.items || [];

        // Filter out manager's own requests if in team mode
        if (viewMode === 'team_requests' && currentUserId) {
          apiRequests = apiRequests.filter(
            (req: ApiAssetRequestExtended) => req.requested_by !== currentUserId
          );
        }

        setRawApiRequests(apiRequests);

        // Transform API requests to component format
        const transformedRequests = transformApiRequests(apiRequests);
        setRequests(transformedRequests);

        // Recalculate pagination and counts based on filtered requests for Team View
        // (Since backend counts include the manager, we must adjust generic counts client-side)
        if (viewMode === 'team_requests') {
          const filteredTotal = apiRequests.length; // This is valid if total items < limit, or we accept page-level counts for now

          // If we loaded everything (total <= limit), use exact counts. 
          // If paginated, this is a best-effort approximation logic or we'd need to fetch all pages.
          // Given the requirement "only team ... data show in cards", we strictly use filtered data stats.

          const newCounts = {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            cancelled: 0,
          };

          apiRequests.forEach((req: ApiAssetRequestExtended) => {
            newCounts.total++;
            const status = req.status ? req.status.toLowerCase() : '';
            if (status === 'approved') newCounts.approved++;
            else if (status === 'rejected') newCounts.rejected++;
            else if (status === 'pending') newCounts.pending++;
            else if (status === 'cancelled') newCounts.cancelled++;
          });

          setStatusCounts(newCounts);

          // Update pagination to reflect filtered count
          if (apiResponse.total && apiResponse.total <= limit) {
            // If all data was in one page, the filtered length is the true total
            setPagination(prev => ({
              ...prev,
              total: filteredTotal,
              totalPages: 1,
            }));
          } else {
            // If server had more pages, we just subtract the removed items from this page from the server total?
            // No, that's unsafe. For now, rely on server pagination structure but we know counts are imperfect if paged.
            // However, for the cards to match the table, we use the client counts.

            setPagination(prev => ({
              ...prev,
              total: apiResponse.total || 0, // Keep server total if multi-page (imperfect but safer)
              totalPages: apiResponse.totalPages || 1,
            }));
          }

        } else {
          // My Requests - use server provided counts and pagination
          if (apiResponse.total && apiResponse.total) {
            setPagination(prev => ({
              ...prev,
              total: apiResponse.total || 0,
              totalPages: apiResponse.totalPages || 1,
            }));
          } else {
            // Fallback pagination logic
            const hasMorePages = (apiResponse.items || []).length === limit;
            const estimatedTotal = hasMorePages
              ? page * limit
              : (page - 1) * limit + (apiResponse.items || []).length;
            const estimatedTotalPages = hasMorePages ? page + 1 : page;

            setPagination(prev => ({
              ...prev,
              total: estimatedTotal,
              totalPages: estimatedTotalPages,
            }));
          }

          if (apiResponse.counts) {
            setStatusCounts({
              total: apiResponse.counts.total || 0,
              pending: apiResponse.counts.pending || 0,
              approved: apiResponse.counts.approved || 0,
              rejected: apiResponse.counts.rejected || 0,
              cancelled: apiResponse.counts.cancelled || 0,
            });
          } else {
            setStatusCounts({
              total: 0,
              pending: 0,
              approved: 0,
              rejected: 0,
              cancelled: 0
            });
          }
        }
      } catch (error) {
        showError(error);
      } finally {
        fetchingRef.current = false;
        // Only set initial loading to false on very first load
        if (isInitialLoad && page === 1) {
          setInitialLoading(false);
        }
      }
    },
    [currentUserId, transformApiRequests, showError, viewMode]
  );

  // Re-transform requests when categories are loaded to update category names
  React.useEffect(() => {
    if (categories.length > 0 && rawApiRequests.length > 0) {
      // Re-transform raw API requests with updated categories
      const transformedRequests = transformApiRequests(rawApiRequests);
      setRequests(transformedRequests);
    }
  }, [categories, rawApiRequests, transformApiRequests]);

  // Handle view mode changes and initial load
  React.useEffect(() => {
    if (!currentUserId) return; // Don't fetch until we have user ID

    // Reset data when switching views to prevent merging logic
    setRequests([]);
    setStatusCounts({
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    });

    initialLoadRef.current = true;

    // Mark this page/limit as fetched
    lastFetchedPageRef.current = {
      page: pagination.page,
      limit: pagination.limit,
    };

    // Fetch paginated requests
    fetchRequests(pagination.page, pagination.limit, true);
    // We intentionally omit fetchingRef check here to ensure view switch always loads new data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, viewMode]); // Run when user ID or view mode changes



  // Handle page changes: fetch paginated requests (counts come from API response)
  React.useEffect(() => {
    if (!currentUserId || !initialLoadRef.current) return; // Don't fetch if initial load hasn't happened
    if (fetchingRef.current) return; // Don't fetch if already fetching

    // Check if page/limit actually changed
    const lastFetched = lastFetchedPageRef.current;
    if (
      lastFetched &&
      lastFetched.page === pagination.page &&
      lastFetched.limit === pagination.limit
    ) {
      return; // Already fetched this page/limit combination
    }

    // Fetch paginated requests when page or limit changes (but not on initial load)
    if (pagination.page > 0) {
      lastFetchedPageRef.current = {
        page: pagination.page,
        limit: pagination.limit,
      };
      fetchRequests(pagination.page, pagination.limit, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]); // Removed fetchRequests and currentUserId from deps to prevent re-triggers

  // Since we're now fetching only current user's requests, we can use requests directly
  const userRequests = useMemo(() => {
    return requests; // All requests are already filtered for current user
  }, [requests]);

  // Filter by search term
  const filteredRequests = useMemo(() => {
    if (!searchTerm) return userRequests;

    return userRequests.filter(
      request =>
        request.category.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        request.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [userRequests, searchTerm]);

  // Filter by tab
  const getFilteredRequestsByTab = (statusFilter?: string) => {
    // If we are in team mode, the data is already filtered server-side (except for 'all' tab which might need client check if API returned mixed data)
    // However, if we fetched with specific status, 'filteredRequests' will only contain that status.
    // So simple equality check naturally works, or we can skip filter if we trust the API.
    // For safety and MyRequests mode, we keep client side filtering.
    if (!statusFilter) return filteredRequests;
    return filteredRequests.filter(request => request.status === statusFilter);
  };

  const handleSubmitRequest = async (data: {
    category: string;
    subcategory?: string;
    remarks?: string;
  }) => {
    setLoading(true);
    try {
      // Get category ID and subcategory ID
      const categoryId = data.category; // This is already the category ID from dropdown
      const subcategoryId =
        data.subcategory && data.subcategory.trim() !== ''
          ? data.subcategory
          : undefined;

      const requestData = {
        categoryId: categoryId,
        subcategoryId: subcategoryId,
        remarks: data.remarks || '',
      };

      const newApiRequest = await assetApi.createAssetRequest(requestData);

      // Find category and subcategory names
      const categoryObj = categories.find(cat => cat.id === categoryId);
      const categoryName = categoryObj?.name || categoryId;
      const subcategoryObj = subcategories.find(
        sub => sub.id === subcategoryId
      );
      const subcategoryName = subcategoryObj?.name || '';

      // Transform and add to local state
      const newRequest: AssetRequest = {
        id: newApiRequest.id,
        employeeId: newApiRequest.requested_by,
        employeeName: `Employee ${newApiRequest.requested_by}`,
        category: {
          id: categoryId,
          name: categoryName,
          nameAr: categoryName,
          description: '',
          color: '#757575',
          requestedItem: subcategoryName || undefined,
        },
        subcategoryId: subcategoryId || undefined,
        remarks: newApiRequest.remarks,
        status: newApiRequest.status,
        requestedDate: newApiRequest.requested_date,
        processedDate: newApiRequest.approved_date,
        processedBy: newApiRequest.approved_by,
        processedByName: newApiRequest.approved_by
          ? `Admin ${newApiRequest.approved_by}`
          : undefined,
        rejectionReason: undefined,
        assignedAssetId: undefined,
        assignedAssetName: undefined,
      };

      setRequests(prev => [newRequest, ...prev]);

      // Refresh paginated requests to update counts
      fetchRequests(pagination.page, pagination.limit, false);

      // Show success snackbar
      showSuccess(
        `Asset request for "${categoryName}" has been submitted successfully`
      );

      setIsRequestModalOpen(false);
      setSelectedCategoryId('');
      reset();
    } catch (error) {
      // Show error snackbar
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = (request: AssetRequest) => {
    setRequestToCancel(request);
    setIsCancelDialogOpen(true);
  };

  const handleOpenRequestModal = () => {
    setSelectedCategoryId('');
    setIsRequestModalOpen(true);
  };

  // Removed unused handleRefreshData function - keeping for future use

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    // Page change is not initial load, so pass false
    setPagination(prev => ({ ...prev, page }));
  };

  const handleConfirmCancel = async () => {
    if (!requestToCancel) return;

    setLoading(true);
    try {
      // Delete the request using DELETE API
      await assetApi.deleteAssetRequest(requestToCancel.id);

      // Remove from local state
      const updatedRequests = requests.filter(
        request => request.id !== requestToCancel.id
      );
      setRequests(updatedRequests);

      // Refresh the current page to update counts (not initial load)
      fetchRequests(pagination.page, pagination.limit, false);

      // Show success in same red alert style as other deletes
      showError(
        new Error(
          `Asset request for "${requestToCancel.category.name}" has been deleted successfully`
        )
      );

      setIsCancelDialogOpen(false);
      setRequestToCancel(null);
    } catch (error) {
      // Show error snackbar
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCommentModal = (request: AssetRequest) => {
    setSelectedRequestForComment(request);
    setCommentText('');
    setIsCommentModalOpen(true);
  };

  const handleSubmitComment = async () => {
    if (!selectedRequestForComment || !commentText.trim()) return;

    setLoading(true);
    try {
      await assetApi.addAssetRequestComment(
        selectedRequestForComment.id,
        commentText
      );

      showSuccess('Comment added successfully');
      setIsCommentModalOpen(false);
      setCommentText('');
      setSelectedRequestForComment(null);

      // Refresh requests to ensure fresh data
      await fetchRequests(pagination.page, pagination.limit, false);

      // Update local comment state immediately for better UX
      setRequestComments(prev => ({
        ...prev,
        [selectedRequestForComment.id]: commentText
      }));

    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  // Use counts from API response
  const displayCounts = useMemo(() => {
    // Use counts from API response if available
    if (
      statusCounts.total > 0 ||
      statusCounts.pending > 0 ||
      statusCounts.approved > 0 ||
      statusCounts.rejected > 0
    ) {
      return {
        all: statusCounts.total,
        pending: statusCounts.pending,
        approved: statusCounts.approved,
        rejected: statusCounts.rejected,
      };
    }

    // Fallback: Use total from pagination, show 0 for status counts until API provides them
    return {
      all: pagination.total || 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };
  }, [statusCounts, pagination.total]);

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

  const renderRequestRow = (request: AssetRequest) => {
    const managerRemark =
      request.managerRemarks || requestComments[request.id] || '';

    return (
      <TableRow key={request.id} hover>
      {viewMode === 'team_requests' && (
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box>
              <Typography variant='body2' fontWeight={500}>
                {request.employeeName}
              </Typography>
            </Box>
          </Box>
        </TableCell>
      )}
      <TableCell>
        <Box>
          <Box>
            <Typography variant='body2' fontWeight={500}>
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
      </TableCell>
      <TableCell data-truncate='true'>
        {request.remarks && (
          <Tooltip title={request.remarks} arrow>
            <Typography variant='body2' color='text.secondary'>
              {request.remarks}
            </Typography>
          </Tooltip>
        )}
      </TableCell>
      <TableCell>
        <StatusChip status={request.status} type='request' />
      </TableCell>
      <TableCell>{formatDate(request.requestedDate)}</TableCell>
      <TableCell>
        {request.processedDate && formatDate(request.processedDate)}
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
      {viewMode === 'team_requests' && roleIsManager() && (
        <TableCell align='center'>
          {managerRemark && (
            <Tooltip title={managerRemark} arrow>
              <Typography variant='body2' color='text.primary'>
                {managerRemark}
              </Typography>
            </Tooltip>
          )}
        </TableCell>
      )}
      <TableCell align='right'>
        {viewMode === 'team_requests' &&
          roleIsManager() &&
          request.status === 'pending' &&
          !managerRemark && (
            <Button
              onClick={() => handleOpenCommentModal(request)}
              size='small'
              variant='text'
              color='primary'
              sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
            >
              Add Remark
            </Button>
          )}
        {request.status === 'pending' &&
          request.employeeId === currentUserId && (
            <IconButton
              onClick={() => handleCancelRequest(request)}
              size='small'
              color='error'
              aria-label={`Cancel request for ${request.category?.name || 'asset'}`}
            >
              {roleIsManager() ? (
                <Icon name='delete' size={18} />
              ) : (
                <DeleteIcon aria-hidden='true' />
              )}
            </IconButton>
          )}
        {request.status === 'approved' && request.assignedAssetName && (
          <IconButton
            size='small'
            color='success'
            aria-label='Request approved'
            disabled
          >
            <CheckCircleIcon aria-hidden='true' />
          </IconButton>
        )}
      </TableCell>
      </TableRow>
    );
  };

  const theme = useTheme();

  return (
    <Box>
      {/* Back arrow when on Team Asset Requests (manager only) - like Timesheet */}
      {roleIsManager() && viewMode === 'team_requests' && (
        <IconButton
          sx={{ p: 0, mb: 2, color: theme.palette.text.primary }}
          onClick={() => {
            setViewMode('my_requests');
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          aria-label='Back to my requests'
        >
          <ArrowBackIcon />
        </IconButton>
      )}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 2,
          gap: 2,
        }}
      >
        <Typography
          variant='h4'
          fontWeight={600}
          fontSize={{ xs: '32px', lg: '48px' }}
        >
          Asset Requests
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            width: { xs: '100%', sm: 'auto' },
            flexWrap: 'wrap',
          }}
        >
          {(!roleIsManager() || viewMode === 'my_requests') && (
            <AppButton
              variant='contained'
              variantType='primary'
              startIcon={
                roleIsManager() ? <Icon name='add' size={18} /> : <AddIcon />
              }
              onClick={handleOpenRequestModal}
              text='Request Asset'
              sx={{
                width: { xs: '100%', sm: 'auto' },
              }}
            />
          )}
          {roleIsManager() && (
            <AppButton
              variant={viewMode === 'team_requests' ? 'contained' : 'outlined'}
              variantType='primary'
              onClick={() => {
                setViewMode('team_requests');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              text='Team Asset Requests'
              sx={{
                width: { xs: '100%', sm: 'auto' },
              }}
            />
          )}
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Box flex={1} sx={{ minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Total Requests
              </Typography>
              <Typography variant='h4' fontWeight={600}>
                {displayCounts.all}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box flex={1} sx={{ minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Pending
              </Typography>
              <Typography variant='h4' fontWeight={600} color='warning.main'>
                {displayCounts.pending}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box flex={1} sx={{ minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Approved
              </Typography>
              <Typography variant='h4' fontWeight={600} color='success.main'>
                {displayCounts.approved}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box flex={1} sx={{ minWidth: '150px' }}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Rejected
              </Typography>
              <Typography variant='h4' fontWeight={600} color='error.main'>
                {displayCounts.rejected}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder='Search requests...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => {
              setTabValue(newValue);
              // If in team mode, we might want to reset page to 1 immediately here (also handled in useEffect)
            }}
          >
            <Tab label='All Requests' />
            <Tab label='Pending' />
            <Tab label='Approved' />
            <Tab label='Rejected' />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <AppTable>
            <TableHead>
              <TableRow>
                {viewMode === 'team_requests' && (
                  <TableCell>Employee</TableCell>
                )}
                <TableCell>Asset Category</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested Date</TableCell>
                <TableCell>Processed Date</TableCell>
                <TableCell>Rejection Reason</TableCell>
                {viewMode === 'team_requests' && roleIsManager() && (
                  <TableCell align='center'>Manager Remarks</TableCell>
                )}
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredRequestsByTab().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align='center' sx={{ py: 4 }}>
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
                {viewMode === 'team_requests' && (
                  <TableCell>Employee</TableCell>
                )}
                <TableCell>Asset Category</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested Date</TableCell>
                <TableCell>Processed Date</TableCell>
                <TableCell>Rejection Reason</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredRequestsByTab('pending').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align='center' sx={{ py: 4 }}>
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
                {viewMode === 'team_requests' && (
                  <TableCell>Employee</TableCell>
                )}
                <TableCell>Asset Category</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested Date</TableCell>
                <TableCell>Processed Date</TableCell>
                <TableCell>Rejection Reason</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredRequestsByTab('approved').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align='center' sx={{ py: 4 }}>
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
                {viewMode === 'team_requests' && (
                  <TableCell>Employee</TableCell>
                )}
                <TableCell>Asset Category</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested Date</TableCell>
                <TableCell>Processed Date</TableCell>
                <TableCell>Rejection Reason</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredRequestsByTab('rejected').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align='center' sx={{ py: 4 }}>
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
      </Card>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
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

      {/* Pagination Info - when search is active, show count of rows actually in table */}
      {requests.length > 0 && (
        <Box display='flex' justifyContent='center' mt={1}>
          <Typography variant='body2' color='textSecondary'>
            Showing page{' '}
            {searchTerm ? 1 : pagination.page} of{' '}
            {searchTerm ? 1 : pagination.totalPages} (
            {searchTerm
              ? getFilteredRequestsByTab().length
              : tabValue === 0
                ? displayCounts.all
                : tabValue === 1
                  ? displayCounts.pending
                  : tabValue === 2
                    ? displayCounts.approved
                    : displayCounts.rejected}{' '}
            total records)
          </Typography>
        </Box>
      )}

      {/* Request Asset Modal (using shared AppFormModal) */}
      <AppFormModal
        open={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title='Request New Asset'
        wrapInForm
        onSubmit={() => void handleSubmit(handleSubmitRequest)()}
        submitLabel={loading ? 'Submitting...' : 'Submit Request'}
        cancelLabel='Cancel'
        isSubmitting={loading}
        maxWidth='sm'
      >
        <Box sx={{ pt: 1 }}>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              flexDirection: 'column',
            }}
          >
            <Box>
              <Controller
                name='category'
                control={control}
                render={({ field }) => (
                  <Box>
                    <AppDropdown
                      {...field}
                      label='Asset Category'
                      align='left'
                      placeholder='Asset Category'
                      value={field.value || ''}
                      onChange={e => {
                        field.onChange(e);
                        setValue('subcategory', ''); // Reset subcategory when category changes
                      }}
                      options={categories.map(category => ({
                        value: category.id,
                        label: category.name,
                      }))}
                      disabled={loading || loadingData}
                      error={!!errors.category}
                    />
                    {errors.category ? (
                      <Typography
                        variant='caption'
                        color='error'
                        sx={{ mt: 0.5, ml: 1.75 }}
                      >
                        {errors.category.message}
                      </Typography>
                    ) : (
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        sx={{ mt: 0.5, ml: 1.75 }}
                      >
                        Select the asset category you need
                      </Typography>
                    )}
                  </Box>
                )}
              />
            </Box>

            {selectedCategoryId && subcategories.length > 0 && (
              <Box>
                <Controller
                  name='subcategory'
                  control={control}
                  render={({ field }) => (
                    <AppDropdown
                      {...field}
                      label='Subcategory'
                      align='left'
                      placeholder='Subcategory'
                      value={field.value || ''}
                      onChange={field.onChange}
                      options={subcategories.map(subcategory => ({
                        value: subcategory.id,
                        label: subcategory.name,
                      }))}
                      disabled={loading || loadingData || !selectedCategoryId}
                    />
                  )}
                />
              </Box>
            )}

            <Box>
              <Controller
                name='remarks'
                control={control}
                render={({ field }) => (
                  <AppTextarea
                    {...field}
                    label='Remarks (Optional)'
                    rows={3}
                    placeholder='Please provide details about why you need this asset...'
                    disabled={loading}
                  />
                )}
              />
            </Box>
          </Box>
        </Box>
      </AppFormModal>

      {/* Add Comment Modal */}
      <AppFormModal
        open={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        title='Add Manager Remarks'
        onSubmit={handleSubmitComment}
        submitLabel={loading ? 'Adding...' : 'Add Comment'}
        cancelLabel='Cancel'
        isSubmitting={loading}
        maxWidth='sm'
      >
        <Box sx={{ pt: 2, pb: 1 }}>
          <Typography variant='body2' color='text.secondary' paragraph>
            Add remarks or comments for this request before taking action.
          </Typography>
          <TextField
            fullWidth
            label='Manager Remarks'
            multiline
            rows={4}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder='Enter your comments here...'
            autoFocus
            disabled={loading}
          />
        </Box>
      </AppFormModal>

      {/* Delete Request Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isCancelDialogOpen}
        title='Delete Request'
        message={`Are you sure you want to delete your request for "${requestToCancel?.category.name}"? This action cannot be undone.`}
        confirmText='Delete Request'
        cancelText='Cancel'
        onConfirm={handleConfirmCancel}
        onClose={() => setIsCancelDialogOpen(false)}
        itemName={requestToCancel?.category.name}
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

export default AssetRequests;
