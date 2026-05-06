import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';

import { useLanguage } from '../../hooks/useLanguage';
import { useUser } from '../../hooks/useUser';
import { useProfilePicture } from '../../context/ProfilePictureContext';
import { env } from '../../config/env';
import {
  getRoleDisplayName,
  getRoleName,
  isManager,
  isEmployee,
} from '../../utils/roleUtils';

import {
  Box,
  Toolbar,
  IconButton,
  Typography,
  InputBase,
  Badge,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Button,
  Paper,
  useMediaQuery,
  useTheme,
  ClickAwayListener,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import { useNotifications } from '../../context/NotificationContext';
import UserAvatar from '../common/UserAvatar';
import MenuIcon from '@mui/icons-material/Menu';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';

import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import { Icons } from '../../assets/icons';
import TeamMembersAvatar from '../Teams/TeamMembersAvatar';
import TeamMembersModal from '../Teams/TeamMembersModal';
import { teamApiService, type Team, type TeamMember } from '../../api/teamApi';
import { isDashboardPathAllowedForRole } from '../../utils/permissions';
import {
  useFeatureToggles,
  type FeatureKey,
} from '../../context/FeatureToggleContext';

const labels = {
  en: {
    search: 'Search',
    members: 'Members',
    settings: 'Settings',
    signout: 'Log out',
    adminProfile: 'Admin Profile',
    dylan: 'Dylan Hunter',
    email: 'Dylan.hunter@gmail.com',
  },
  ar: {
    search: 'بحث',
    members: 'الأعضاء',
    settings: 'الإعدادات',
    signout: 'تسجيل الخروج',
    adminProfile: 'ملف المشرف',
    dylan: 'ديلان هنتر',
    email: 'Dylan.hunter@gmail.com',
  },
};

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '16px',
  backgroundColor:
    theme.palette.mode === 'dark'
      ? theme.palette.action.hover
      : theme.palette.primary.light,
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: theme.spacing(1.5),
  paddingRight: theme.spacing(1),
  width: '100%',
  [theme.breakpoints.up('md')]: {
    width: '400px',
    flexGrow: 0,
    height: '44px',
  },
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  fontSize: 'var(--body-font-size)',
  flex: 1,
  '& .MuiInputBase-input': {
    padding: 0,
    '::placeholder': {
      color: theme.palette.text.secondary,
      opacity: 1,
    },
  },
}));

interface SearchResult {
  label: string;
  path: string;
  category: string;
  type:
    | 'route'
    | 'employee'
    | 'team'
    | 'department'
    | 'designation'
    | 'leave'
    | 'policy'
    | 'holiday'
    | 'tenant'
    | 'project'
    | 'attendance';
  id?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  metadata?: Record<string, unknown>;
}
const searchableRoutes: SearchResult[] = [
  {
    label: 'Dashboard',
    path: '',
    category: 'Main',
    type: 'route',
  },
  {
    label: 'Announcements',
    path: 'announcements',
    category: 'Main',
    type: 'route',
  },
  {
    label: 'Project List',
    path: 'project-list',
    category: 'Projects',
    type: 'route',
  },
  {
    label: 'Add Project',
    path: 'add-project',
    category: 'Projects',
    type: 'route',
  },
  { label: 'Add Tenant', path: 'tenant', category: 'Tenant', type: 'route' },
  {
    label: 'Department List',
    path: 'departments',
    category: 'Department',
    type: 'route',
  },
  {
    label: 'Designation',
    path: 'designations',
    category: 'Department',
    type: 'route',
  },
  {
    label: 'User List',
    path: 'user-list',
    category: 'Department',
    type: 'route',
  },
  {
    label: 'Policies',
    path: 'policies',
    category: 'Department',
    type: 'route',
  },
  {
    label: 'Holidays',
    path: 'holidays',
    category: 'Department',
    type: 'route',
  },
  {
    label: 'Employee List',
    path: 'employee-manager',
    category: 'Employees',
    type: 'route',
  },
  {
    label: 'Tenant Employees',
    path: 'tenant-employees',
    category: 'Employees',
    type: 'route',
  },
  {
    label: 'Team Management',
    path: 'teams',
    category: 'Teams',
    type: 'route',
  },
  {
    label: 'Attendance',
    path: 'attendance-check',
    category: 'Attendance',
    type: 'route',
  },
  {
    label: 'Daily Attendance',
    path: 'attendance-table',
    category: 'Attendance',
    type: 'route',
  },
  {
    label: 'Attendance Report',
    path: 'attendance-summary',
    category: 'Attendance',
    type: 'route',
  },
  {
    label: 'Leave Request',
    path: 'leaves',
    category: 'Attendance',
    type: 'route',
  },
  {
    label: 'Reports',
    path: 'reports',
    category: 'Leave Analytics',
    type: 'route',
  },
  {
    label: 'Cross Tenant Leaves',
    path: 'cross-tenant-leaves',
    category: 'Leave Analytics',
    type: 'route',
  },
  {
    label: 'Employee Performance',
    path: 'performance-dashboard',
    category: 'Performance',
    type: 'route',
  },
  { label: 'Invoice', path: 'invoice', category: 'Accounts', type: 'route' },
  { label: 'Payments', path: 'payments', category: 'Accounts', type: 'route' },
  { label: 'Audit Logs', path: 'audit-logs', category: 'Audit', type: 'route' },
  { label: 'Settings', path: 'settings', category: 'Settings', type: 'route' },
  {
    label: 'User Profile',
    path: 'UserProfile',
    category: 'Profile',
    type: 'route',
  },
  // App routes
  { label: 'Chat', path: 'chat', category: 'App', type: 'route' },
  { label: 'Calendar', path: 'calendar', category: 'App', type: 'route' },
  // Other Pages
  { label: 'Login', path: 'login', category: 'Other Pages', type: 'route' },
  {
    label: 'Register',
    path: 'register',
    category: 'Other Pages',
    type: 'route',
  },
  { label: 'Error', path: 'error', category: 'Other Pages', type: 'route' },
  // UI Components
  {
    label: 'Buttons',
    path: 'buttons',
    category: 'UI Components',
    type: 'route',
  },
  { label: 'Cards', path: 'cards', category: 'UI Components', type: 'route' },
  { label: 'Modals', path: 'modals', category: 'UI Components', type: 'route' },
];

const categoryToFeature: Partial<Record<string, FeatureKey>> = {
  Attendance: 'attendance',
  Performance: 'performance',
  Recruitment: 'recruitment',
  'Leave Analytics': 'leaveAnalytics',
  Projects: 'projects',
  Announcements: 'announcements',
  Accounts: 'accounts',
  App: 'app',
};

interface NavbarProps {
  darkMode: boolean;
  onToggleSidebar: () => void;
  onOpenInviteModal: () => void;
}

/**
 * NotificationButton - small component to render notification bell with unread badge
 * and a Menu listing notifications from NotificationContext.
 */
const NotificationButton: React.FC = () => {
  const theme = useTheme();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  } = useNotifications();

  const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchor);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchor(e.currentTarget);
  const handleClose = () => setAnchor(null);

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{ padding: { xs: '6px', md: '8px' } }}
        aria-label='Notifications'
        aria-haspopup='true'
        aria-expanded={open ? 'true' : undefined}
      >
        <Badge
          badgeContent={unreadCount > 0 ? unreadCount : 0}
          color='error'
          overlap='circular'
          showZero={false}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.65rem',
              minWidth: 18,
              height: 18,
            },
          }}
        >
          <Box
            component='img'
            src={Icons.notification}
            alt='Notifications'
            sx={{
              width: { xs: 18, md: 24 },
              height: { xs: 18, md: 24 },
              filter:
                theme.palette.mode === 'dark'
                  ? 'brightness(0) saturate(100%) invert(56%)'
                  : 'brightness(0) saturate(100%)',
            }}
          />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchor}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: { xs: 300, sm: 360 },
            maxHeight: 420,
            bgcolor: theme.palette.background.paper,
          },
        }}
      >
        <Box
          sx={{ px: 1, py: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
            Notifications
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button
            size='small'
            onClick={() => {
              markAllAsRead();
            }}
          >
            Mark all read
          </Button>
          <Button
            size='small'
            onClick={() => {
              clearAllNotifications();
            }}
          >
            Clear
          </Button>
        </Box>
        <Divider />
        {(() => {
          const unreadList = notifications.filter(n => !n.read);
          return unreadList.length === 0 ? (
            <List sx={{ p: 2 }}>
              <ListItem>
                <ListItemText
                  primary='No notifications'
                  primaryTypographyProps={{ color: 'text.secondary' }}
                />
              </ListItem>
            </List>
          ) : (
            <List>
              {unreadList.map(n => (
                <ListItemButton
                  key={n.id}
                  onClick={() => {
                    markAsRead(n.id);
                  }}
                  sx={{
                    alignItems: 'flex-start',
                    bgcolor: n.read
                      ? 'transparent'
                      : theme.palette.action.selected,
                  }}
                >
                  <ListItemText
                    primary={n.title}
                    secondary={
                      <>
                        <Typography
                          component='span'
                          variant='body2'
                          color='text.secondary'
                        >
                          {n.text}
                        </Typography>
                        <Typography
                          component='div'
                          variant='caption'
                          color='text.secondary'
                          sx={{ mt: 0.5 }}
                        >
                          {new Date(n.timestamp).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation();
                      clearNotification(n.id);
                    }}
                  >
                    ×
                  </IconButton>
                </ListItemButton>
              ))}
            </List>
          );
        })()}
      </Menu>
    </>
  );
};

const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleSidebar,
  onOpenInviteModal,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [teamMembersModalOpen, setTeamMembersModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = React.useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = React.useState(-1);
  const [isSearching, setIsSearching] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const { updateProfilePicture, clearProfilePicture } = useProfilePicture();

  // Cache for API responses to avoid redundant calls
  const dataCacheRef = React.useRef<{
    employees: unknown[] | null;
    teams: Team[] | null;
    departments: unknown[] | null;
    designations: unknown[] | null;
    leaves: unknown[] | null;
    policies: unknown[] | null;
    tenants: unknown[] | null;
    cacheTime: number;
  }>({
    employees: null,
    teams: null,
    departments: null,
    designations: null,
    leaves: null,
    policies: null,
    tenants: null,
    cacheTime: 0,
  });

  const managerTeamMembersRef = React.useRef<TeamMember[]>([]);

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const lang = labels[language];
  const { user, clearUser } = useUser();
  const { isFeatureEnabled } = useFeatureToggles();
  const currentUserRole = React.useMemo(() => {
    if (!user) return '';

    // Try to get role from user object
    const typedUser = user as { role?: string; role_name?: string };
    const role = typedUser.role || typedUser.role_name;

    if (!role) return '';

    // Use getRoleName utility to properly extract role name
    return getRoleName(role);
  }, [user]);

  // Helper function to check if a route is allowed for current user
  const isRouteAllowed = React.useCallback(
    (route: SearchResult): boolean => {
      // If no role, deny access (user not logged in)
      if (
        !currentUserRole ||
        currentUserRole.trim() === '' ||
        currentUserRole === 'Unknown'
      ) {
        return false;
      }

      if (!route.path) {
        // Dashboard route - check if allowed
        return isDashboardPathAllowedForRole('', currentUserRole);
      }

      // Check if path is allowed for current role
      return isDashboardPathAllowedForRole(route.path, currentUserRole);
    },
    [currentUserRole]
  );

  // Initialize profile picture state when user data loads
  React.useEffect(() => {
    if (user?.profile_pic) {
      // 1. If user exists and has a pic, set it
      const profilePicUrl = user.profile_pic.startsWith('http')
        ? user.profile_pic
        : `${env.apiBaseUrl}/users/${user.id}/profile-picture`;
      updateProfilePicture(profilePicUrl);
    } else if (!user) {
      // 2. If user is null (logged out), clear the picture state immediately
      clearProfilePicture();
    }
  }, [user, updateProfilePicture, clearProfilePicture]);

  // Fetch manager's team members when user is manager
  React.useEffect(() => {
    const fetchManagerTeam = async () => {
      if (!isManager(currentUserRole)) return;

      try {
        const response = await teamApiService.getMyTeamMembers(1, 1000);
        if (response && response.items) {
          managerTeamMembersRef.current = response.items;
        }
      } catch (error) {
        console.error('Error fetching manager team members:', error);
      }
    };

    if (user && isManager(currentUserRole)) {
      fetchManagerTeam();
    }
  }, [user, currentUserRole]);

  // Language dropdown state
  const [langAnchorEl, setLangAnchorEl] = React.useState<null | HTMLElement>(
    null
  );
  const langMenuOpen = Boolean(langAnchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // Clear all authentication and signup data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    localStorage.removeItem('rememberedLogin');
    localStorage.removeItem('companyDetails');
    localStorage.removeItem('signupSessionId');

    clearUser();
    clearProfilePicture();

    // Navigate to login page
    navigate('/', { replace: true });
  };

  const handleCloseTeamMembersModal = () => {
    setTeamMembersModalOpen(false);
  };

  // (removed unused `normalizeText` helper)

  const searchRoutes = React.useCallback(
    (query: string): SearchResult[] => {
      const queryWords = query.toLowerCase().trim().split(/\s+/);
      if (queryWords.length === 0) return [];

      const exactQuery = query.toLowerCase().trim();
      const normalizedQuery = queryWords.join(' '); // Normalized query phrase

      return searchableRoutes
        .filter(route => isRouteAllowed(route)) // Filter by permissions first
        .filter(route => {
          const featureKey = categoryToFeature[route.category];
          if (!featureKey) return true;
          return isFeatureEnabled(featureKey);
        })
        .map(route => {
          // Collect all searchable text from the route
          const label = (route.label || '').toLowerCase();
          const category = (route.category || '').toLowerCase();
          const path = (route.path || '').toLowerCase();
          const subtitle = (route.subtitle || '').toLowerCase();

          // Priority fields (label gets highest priority)
          const priorityText = label;
          const secondaryText = `${category} ${path} ${subtitle}`.trim();
          const combinedText = `${priorityText} ${secondaryText}`.toLowerCase();

          if (!combinedText) return { route, score: 0, matches: false };

          // Calculate relevance score
          let score = 0;
          let allWordsMatch = true;

          // Check for exact phrase match first (highest priority)
          if (label.includes(normalizedQuery)) {
            score += 30; // Very high score for phrase match in label
          } else if (combinedText.includes(normalizedQuery)) {
            score += 20; // High score for phrase match anywhere
          }

          // Check each word individually
          for (const queryWord of queryWords) {
            const wordRegex = new RegExp(
              `\\b${queryWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
              'i'
            );

            // Check priority field (label) first
            if (wordRegex.test(label)) {
              score += 15; // High score for label match
            } else if (wordRegex.test(category)) {
              score += 10; // Medium score for category match
            } else if (wordRegex.test(path)) {
              score += 8; // Lower score for path match
            } else if (wordRegex.test(subtitle)) {
              score += 5; // Lower score for subtitle match
            } else if (combinedText.includes(queryWord)) {
              score += 2; // Lowest score for substring match
            } else {
              allWordsMatch = false;
            }
          }

          // Bonus for exact match in label
          if (label === exactQuery) {
            score += 40; // Maximum bonus for exact label match
          } else if (label.includes(exactQuery)) {
            score += 25; // Big bonus for exact label match
          } else if (label.startsWith(exactQuery)) {
            score += 20;
          }

          if (queryWords.length > 1) {
            const labelWords = label.split(/\s+/);
            let consecutiveMatches = 0;
            let queryIndex = 0;
            for (
              let i = 0;
              i < labelWords.length && queryIndex < queryWords.length;
              i++
            ) {
              if (
                labelWords[i].includes(queryWords[queryIndex]) ||
                queryWords[queryIndex].includes(labelWords[i])
              ) {
                consecutiveMatches++;
                queryIndex++;
              }
            }
            if (consecutiveMatches === queryWords.length) {
              score += 15; // Bonus for all words matching in order
            }
          }
          if (label === 'dashboard') {
            const isDashboardQuery =
              exactQuery === 'dashboard' ||
              exactQuery === 'dash' ||
              exactQuery.length <= 2;
            if (!isDashboardQuery && score < 15) {
              score = 0; // Don't show Dashboard if query doesn't match well
              allWordsMatch = false;
            }
          }

          return { route, score, matches: allWordsMatch };
        })
        .filter(({ matches }) => matches)
        .sort((a, b) => b.score - a.score) // Sort by relevance (highest first)
        .slice(0, 5)
        .map(({ route }) => route);
    },
    [isRouteAllowed, isFeatureEnabled]
  );

  React.useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      setSelectedResultIndex(-1);
      setIsSearching(false);
      return;
    }

    const query = searchQuery.trim();

    if (query.length < 2) {
      const routeResults = searchRoutes(query.toLowerCase());
      setSearchResults(routeResults.slice(0, 15));
      setShowSearchResults(routeResults.length > 0);
      setSelectedResultIndex(-1);
      setIsSearching(false);
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    searchTimeoutRef.current = setTimeout(() => {
      if (abortController.signal.aborted) return;

      setIsSearching(true);
      const MAX_RESULTS = 15;

      try {
        // Search only navbar/menu routes (no backend API)
        const routeResults = searchRoutes(query.toLowerCase());
        const results = routeResults.slice(0, MAX_RESULTS);

        if (!abortController.signal.aborted) {
          setSearchResults(results);
          setShowSearchResults(results.length > 0);
          setSelectedResultIndex(-1);
        }
      } catch {
        if (!abortController.signal.aborted) {
          setSearchResults([]);
          setShowSearchResults(false);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 400); // Debounce: 400ms

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchQuery, searchRoutes]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setShowSearchResults(true);
  };
  const handleSearchResultClick = (result: SearchResult) => {
    setSearchQuery('');
    setShowSearchResults(false);
    setSelectedResultIndex(-1);
    if (!result) return;
    if (result.type === 'employee' && result.id) {
      navigate(`/dashboard/employee-profile-view/${result.id}`, {
        state: {
          fromSearch: true,
          userId: result.metadata?.userId,
        },
        replace: false,
      });
    } else if (result.type === 'team' && result.id) {
      navigate('/dashboard/teams', {
        state: {
          teamId: result.id,
          viewTeam: true,
          fromSearch: true,
        },
        replace: false,
      });
    } else if (result.type === 'department' && result.id) {
      navigate('/dashboard/departments', {
        state: {
          departmentId: result.id,
          fromSearch: true,
        },
        replace: false,
      });
    } else if (result.type === 'designation' && result.id) {
      navigate('/dashboard/designations', {
        state: {
          designationId: result.id,
          fromSearch: true,
        },
        replace: false,
      });
    } else if (result.type === 'leave' && result.id) {
      navigate('/dashboard/leaves', {
        state: {
          leaveId: result.id,
          fromSearch: true,
        },
        replace: false,
      });
    } else if (result.type === 'policy' && result.id) {
      navigate('/dashboard/policies', {
        state: {
          policyId: result.id,
          fromSearch: true,
        },
        replace: false,
      });
    } else if (result.type === 'tenant' && result.id) {
      navigate('/dashboard/tenant', {
        state: {
          tenantId: result.id,
          fromSearch: true,
        },
        replace: false,
      });
    } else if (result.type === 'attendance' && result.id) {
      navigate('/dashboard/attendance-check', {
        state: {
          attendanceId: result.id,
          fromSearch: true,
        },
        replace: false,
      });
    } else {
      let path = '/dashboard';
      if (result.path && result.path.trim() !== '') {
        path = `/dashboard/${result.path}`;
      }
      navigate(path, {
        state: { fromSearch: true },
        replace: false,
      });
    }
  };
  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (selectedResultIndex >= 0 && searchResults[selectedResultIndex]) {
        handleSearchResultClick(searchResults[selectedResultIndex]);
      } else if (searchResults.length === 1) {
        handleSearchResultClick(searchResults[0]);
      } else if (searchResults.length > 1) {
        setShowSearchResults(true);
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedResultIndex(prev =>
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedResultIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (event.key === 'Escape') {
      setShowSearchResults(false);
      setSearchQuery('');
      searchInputRef.current?.blur();
    }
  };
  const handleClickAway = (event: MouseEvent | TouchEvent) => {
    if (
      searchContainerRef.current &&
      event.target instanceof Node &&
      searchContainerRef.current.contains(event.target)
    ) {
      return;
    }
    setShowSearchResults(false);
  };
  React.useEffect(() => {
    setShowSearchResults(false);
    setSearchQuery('');
  }, [location.pathname]);
  React.useEffect(() => {
    const cacheRef = dataCacheRef.current;
    const cacheCleanupInterval = setInterval(() => {
      const now = Date.now();
      if (now - cacheRef.cacheTime > CACHE_DURATION) {
        cacheRef.employees = null;
        cacheRef.teams = null;
        cacheRef.departments = null;
        cacheRef.designations = null;
        cacheRef.leaves = null;
        cacheRef.policies = null;
        cacheRef.tenants = null;
      }
    }, CACHE_DURATION);

    return () => {
      clearInterval(cacheCleanupInterval);
      // Clear cache on unmount
      cacheRef.employees = null;
      cacheRef.teams = null;
      cacheRef.departments = null;
      cacheRef.designations = null;
      cacheRef.leaves = null;
      cacheRef.policies = null;
      cacheRef.tenants = null;
    };
  }, [CACHE_DURATION]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        backgroundColor: theme.palette.background.default,
        py: { xs: 0, md: 2 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          backgroundColor: {
            xs: 'transparent',
            md: theme.palette.background.paper,
          },
          borderRadius: { xs: 0, md: '20px' },
          boxShadow: {
            xs: 'none',
            md:
              theme.palette.mode === 'dark'
                ? '0 1px 3px rgba(0,0,0,0.3)'
                : '0 1px 3px rgba(0,0,0,0.1)',
          },
          px: { xs: 1.5, md: 3 },
          py: { xs: 0.75, md: 1.5 },
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: { xs: 1, md: 2 },
            minHeight: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={onToggleSidebar}
              sx={{
                display: { xs: 'flex', lg: 'none' },
                color: theme.palette.text.primary,
                padding: { xs: '6px', md: '8px' },
              }}
              aria-label='Toggle sidebar menu'
              aria-expanded='false'
            >
              <MenuIcon
                sx={{
                  fontSize: { xs: '20px', md: '24px' },
                  color: theme.palette.text.primary,
                }}
                aria-hidden='true'
              />
            </IconButton>

            {/* Desktop Search */}
            <ClickAwayListener onClickAway={handleClickAway}>
              <Box
                ref={searchContainerRef}
                sx={{
                  display: { xs: 'none', sm: 'none', md: 'flex' },
                  alignItems: 'center',
                  gap: 1,
                  flex: 1,
                  maxWidth: { md: '350px', lg: '400px', xl: '450px' },
                  position: 'relative',
                }}
              >
                <Search>
                  <StyledInputBase
                    ref={searchInputRef}
                    placeholder={lang.search}
                    inputProps={{ 'aria-label': 'search' }}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    onFocus={() => {
                      if (searchResults.length > 0) {
                        setShowSearchResults(true);
                      }
                    }}
                    sx={{
                      color: theme.palette.text.primary,
                      '& input': {
                        backgroundColor: 'transparent',
                      },
                    }}
                  />
                  {isSearching && (
                    <CircularProgress
                      size={16}
                      sx={{
                        position: 'absolute',
                        right: '50px',
                        color: theme.palette.text.primary,
                      }}
                    />
                  )}
                </Search>
                <IconButton
                  onClick={() => {
                    if (searchResults.length === 1) {
                      handleSearchResultClick(searchResults[0]);
                    } else if (searchResults.length > 1) {
                      setShowSearchResults(true);
                    }
                  }}
                  sx={{
                    backgroundColor: 'var(--primary-dark-color)',
                    color: 'common.white',
                    borderRadius: '16px',
                    width: { xs: '36px', md: '44px' },
                    height: { xs: '36px', md: '44px' },
                    minWidth: { xs: '36px', md: '44px' },
                    '&:hover': {
                      backgroundColor: 'var(--primary-dark-color)',
                      opacity: 0.9,
                    },
                  }}
                  aria-label='Search'
                >
                  <Box
                    component='img'
                    src={Icons.search}
                    alt='Search'
                    sx={{
                      width: { xs: 16, md: 20 },
                      height: { xs: 16, md: 20 },
                      filter: 'brightness(0) saturate(100%) invert(1)',
                    }}
                  />
                </IconButton>
                {showSearchResults && searchResults.length > 0 && (
                  <Paper
                    elevation={4}
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      mt: 1,
                      maxHeight: { md: '350px', lg: '400px', xl: '450px' },
                      overflow: 'auto',
                      zIndex: 1300,
                      borderRadius: '12px',
                      backgroundColor: theme.palette.background.paper,
                      boxShadow:
                        theme.palette.mode === 'dark'
                          ? '0 4px 20px rgba(0,0,0,0.5)'
                          : '0 4px 20px rgba(0,0,0,0.15)',
                    }}
                  >
                    <List sx={{ p: 0 }}>
                      {searchResults.map((result, index) => (
                        <ListItem
                          key={`${result.type}-${result.id || result.path}-${index}`}
                          disablePadding
                        >
                          <ListItemButton
                            selected={selectedResultIndex === index}
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSearchResultClick(result);
                            }}
                            onMouseDown={e => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onTouchEnd={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSearchResultClick(result);
                            }}
                            onTouchStart={e => {
                              e.stopPropagation();
                            }}
                            sx={{
                              px: 2,
                              py: 1.5,
                              cursor: 'pointer',
                              touchAction: 'manipulation',
                              WebkitTapHighlightColor: 'transparent',

                              '&:active': {
                                backgroundColor: 'var(--primary-dark-color)',
                              },
                              '&.Mui-selected': {
                                backgroundColor: 'var(--primary-dark-color)',
                                color: 'common.white',
                              },
                            }}
                          >
                            {result.icon && (
                              <Box
                                sx={{
                                  mr: 1.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                {result.icon}
                              </Box>
                            )}
                            <ListItemText
                              primary={result.label}
                              secondary={result.subtitle || result.category}
                              primaryTypographyProps={{
                                fontSize: 'var(--body-font-size)',
                                fontWeight: 500,
                              }}
                              secondaryTypographyProps={{
                                fontSize: 'var(--label-font-size)',
                                color:
                                  selectedResultIndex === index
                                    ? 'rgba(255,255,255,0.7)'
                                    : theme.palette.text.secondary,
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
                {showSearchResults &&
                  searchQuery.trim() &&
                  searchResults.length === 0 &&
                  !isSearching && (
                    <Paper
                      elevation={4}
                      sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        mt: 1,
                        zIndex: 1300,
                        borderRadius: '12px',
                        backgroundColor: theme.palette.background.paper,
                        p: 2,
                        textAlign: 'center',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 'var(--body-font-size)',
                          color: theme.palette.text.secondary,
                        }}
                      >
                        No results found
                      </Typography>
                    </Paper>
                  )}
              </Box>
            </ClickAwayListener>
          </Box>

          {/* Right Side */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.5, lg: 1 },
            }}
          >
            <Button
              variant='text'
              size='small'
              onClick={e => setLangAnchorEl(e.currentTarget)}
              sx={{
                minWidth: 0,
                px: { xs: 1, md: 1.5 },
                py: { xs: 0.5, md: 1 },
                color: theme.palette.text.primary,
                fontWeight: 600,
                fontSize: { xs: '12px', md: 'var(--body-font-size)' },
              }}
              aria-label={`Current language: ${language === 'en' ? 'English' : 'Arabic'}. Click to change language`}
              aria-haspopup='true'
              aria-expanded={langMenuOpen}
            >
              {language === 'en' ? 'EN' : 'عربي'}
            </Button>

            {/* Team Members Avatar - same on mobile and desktop */}
            <Box>
              <TeamMembersAvatar maxAvatars={2} darkMode={darkMode} />
            </Box>

            <Paper
              elevation={0}
              sx={{
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.action.hover
                    : theme.palette.background.default,
                borderRadius: '16px',
                p: { xs: 0.25, md: 0.5 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/** Notifications: use NotificationContext to show unread count and list */}
              <NotificationButton />
            </Paper>

            <Divider
              orientation='vertical'
              flexItem
              sx={{
                height: { xs: '32px', md: '40px' },
                alignSelf: 'center',
                borderColor: theme.palette.divider,
                display: { xs: 'flex', md: 'flex' },
              }}
            />

            {/* User Profile */}
            <Paper
              elevation={0}
              sx={{
                backgroundColor: {
                  xs: 'transparent',
                  md: theme.palette.background.paper,
                },
                borderRadius: 'var(--border-radius-lg)',
                px: { xs: 0, md: 2 },
                py: { xs: 0, md: 1 },
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.75, md: 1.5 },
              }}
            >
              <IconButton
                onClick={handleMenuOpen}
                sx={{ p: 0 }}
                aria-label={`User menu for ${user ? `${user.first_name} ${user.last_name}` : 'user'}`}
                aria-haspopup='true'
                aria-expanded={open}
              >
                {user ? (
                  <UserAvatar
                    user={user}
                    size={isMobile ? 32 : 40}
                    clickable={false}
                  />
                ) : (
                  <img
                    src='./avatar.png'
                    alt=''
                    aria-hidden='true'
                    style={{
                      width: isMobile ? 32 : 40,
                      height: isMobile ? 32 : 40,
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                )}
              </IconButton>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: {
                      xs: '11px',
                      sm: '12px',
                      md: 'var(--body-font-size)',
                    },
                    color: theme.palette.text.primary,
                    lineHeight: 1.2,
                  }}
                >
                  {user ? `${user.first_name} ${user.last_name}` : 'User'}
                </Typography>
                <Typography
                  sx={{
                    fontSize: {
                      xs: '9px',
                      sm: '10px',
                      md: 'var(--label-font-size)',
                    },
                    color: theme.palette.text.secondary,
                    lineHeight: 1.2,
                    fontWeight: 400,
                  }}
                >
                  {getRoleDisplayName(user?.role)}
                </Typography>
              </Box>
            </Paper>
          </Box>

          {/* Language Menu */}
          <Menu
            anchorEl={langAnchorEl}
            open={langMenuOpen}
            onClose={() => setLangAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              elevation: 4,
              sx: {
                borderRadius: 'var(--border-radius-lg)',
                minWidth: 80,
                p: 0,
              },
            }}
          >
            {language === 'en' ? (
              <MenuItem
                onClick={() => {
                  setLanguage('ar');
                  setLangAnchorEl(null);
                }}
              >
                عربي
              </MenuItem>
            ) : (
              <MenuItem
                onClick={() => {
                  setLanguage('en');
                  setLangAnchorEl(null);
                }}
              >
                EN
              </MenuItem>
            )}
          </Menu>
        </Toolbar>

        {/* Mobile Search Bar - Below Navbar */}
        <ClickAwayListener onClickAway={handleClickAway}>
          <Box
            ref={searchContainerRef}
            sx={{
              display: { xs: 'flex', sm: 'flex', md: 'none' },
              alignItems: 'center',
              mt: 1.5,
              position: 'relative',
              pr: { xs: 1.5, md: 0 },
            }}
          >
            <Search
              sx={{
                display: { xs: 'flex', sm: 'flex', md: 'none' },
                alignItems: 'center',
                position: 'relative',
              }}
            >
              <StyledInputBase
                ref={searchInputRef}
                placeholder={lang.search}
                inputProps={{ 'aria-label': 'search' }}
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowSearchResults(true);
                  }
                }}
                sx={{
                  color: theme.palette.text.primary,
                  fontSize: { xs: '12px', md: 'var(--body-font-size)' },
                  pr: { xs: '16px', md: '16px' },
                  '& input': {
                    backgroundColor: 'transparent',
                  },
                }}
              />
              {isSearching && (
                <CircularProgress
                  size={14}
                  sx={{
                    position: 'absolute',
                    right: { xs: '48px', md: '40px' },
                    color: theme.palette.text.primary,
                  }}
                />
              )}
              <IconButton
                onClick={() => {
                  // Only navigate if there's exactly one result
                  // Otherwise, just show the results dropdown
                  if (searchResults.length === 1) {
                    handleSearchResultClick(searchResults[0]);
                  } else if (searchResults.length > 1) {
                    // Show results dropdown if multiple results
                    setShowSearchResults(true);
                  }
                  // If no results, do nothing (don't navigate)
                }}
                sx={{
                  position: 'absolute',
                  right: { xs: '12px', md: '4px' },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'var(--primary-dark-color)',
                  color: 'common.white',
                  borderRadius: { xs: '8px', md: '12px' },
                  width: { xs: '28px', md: '36px' },
                  height: { xs: '28px', md: '36px' },
                  minWidth: { xs: '28px', md: '36px' },
                  padding: 0,
                  // '&:hover': {
                  //   backgroundColor: 'var(--primary-dark-color)',
                  //   opacity: 0.9,
                  // },
                }}
                aria-label='Search'
              >
                <Box
                  component='img'
                  src={Icons.search}
                  alt='Search'
                  sx={{
                    width: { xs: 14, md: 18 },
                    height: { xs: 14, md: 18 },
                    filter: 'brightness(0) saturate(100%) invert(1)',
                  }}
                />
              </IconButton>
            </Search>
            {/* Mobile Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <Paper
                elevation={4}
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  mt: 1,
                  maxHeight: { xs: '250px', sm: '300px' },
                  overflow: 'auto',
                  zIndex: 1300,
                  borderRadius: '12px',
                  backgroundColor: theme.palette.background.paper,
                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? '0 4px 20px rgba(0,0,0,0.5)'
                      : '0 4px 20px rgba(0,0,0,0.15)',
                }}
              >
                <List sx={{ p: 0 }}>
                  {searchResults.map((result, index) => (
                    <ListItem
                      key={`${result.type}-${result.id || result.path}-${index}`}
                      disablePadding
                    >
                      <ListItemButton
                        selected={selectedResultIndex === index}
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSearchResultClick(result);
                        }}
                        onMouseDown={e => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onTouchEnd={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSearchResultClick(result);
                        }}
                        onTouchStart={e => {
                          e.stopPropagation();
                        }}
                        sx={{
                          px: 2,
                          py: 1.5,
                          // '&:hover': {
                          //   backgroundColor: theme.palette.action.hover,
                          // },
                          '&.Mui-selected': {
                            backgroundColor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            // '&:hover': {
                            //   backgroundColor: theme.palette.primary.dark,
                            // },
                          },
                        }}
                      >
                        {result.icon && (
                          <Box
                            sx={{
                              mr: 1.5,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {result.icon}
                          </Box>
                        )}
                        <ListItemText
                          primary={result.label}
                          secondary={result.subtitle || result.category}
                          primaryTypographyProps={{
                            fontSize: '12px',
                            fontWeight: 500,
                          }}
                          secondaryTypographyProps={{
                            fontSize: '10px',
                            color:
                              selectedResultIndex === index
                                ? 'rgba(255,255,255,0.7)'
                                : theme.palette.text.secondary,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
            {showSearchResults &&
              searchQuery.trim() &&
              searchResults.length === 0 &&
              !isSearching && (
                <Paper
                  elevation={4}
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    mt: 1,
                    zIndex: 1300,
                    borderRadius: '12px',
                    backgroundColor: theme.palette.background.paper,
                    p: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '12px',
                      color: theme.palette.text.secondary,
                    }}
                  >
                    No results found
                  </Typography>
                </Paper>
              )}
          </Box>
        </ClickAwayListener>
      </Paper>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: isMobile ? 'left' : 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: isMobile ? 'left' : 'right',
        }}
        MenuListProps={{
          dense: isMobile,
          sx: {
            py: 0,
            px: 0,
          },
        }}
        PaperProps={{
          elevation: 4,
          sx: {
            borderRadius: { xs: '12px', sm: '10px' },
            // Smaller mobile menu, aligned to the opening icon's "start" edge
            width: { xs: 'min(220px, 92vw)', sm: 280 },
            maxWidth: { xs: 220, sm: 280 },
            maxHeight: { xs: '70vh', sm: '80vh' },
            overflowY: 'auto',
            // keep scrolling but hide scrollbar visuals
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            p: { xs: 1.25, sm: 2 },
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1.25, sm: 2 },
            mb: { xs: 0.75, sm: 1 },
          }}
        >
          {user && (
            <UserAvatar
              user={user}
              size={isMobile ? 34 : 40}
              clickable={false}
            />
          )}
          <Box>
            <Typography
              fontWeight={600}
              color={theme.palette.text.primary}
              sx={{ fontSize: { xs: '13px', sm: '14px' }, lineHeight: 1.2 }}
            >
              {user ? `${user.first_name} ${user.last_name}` : 'User'}
            </Typography>
            <Typography
              variant='body2'
              color={theme.palette.text.secondary}
              sx={{ fontSize: { xs: '11px', sm: '12px' }, lineHeight: 1.2 }}
            >
              {user?.email || ''}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: { xs: 0.5, sm: 1 } }} />

        {!isManager(user?.role) && !isEmployee(user?.role) && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              navigate('/dashboard/employee-manager');
            }}
            aria-label='Navigate to employee manager'
            sx={{
              px: { xs: 1, sm: 1.25 },
              py: { xs: 0.75, sm: 1 },
              borderRadius: 1.5,
              minHeight: { xs: 40, sm: 44 },
            }}
          >
            <ListItemIcon sx={{ minWidth: { xs: 34, sm: 36 } }}>
              <GroupOutlinedIcon
                fontSize='small'
                sx={{ color: theme.palette.text.primary }}
                aria-hidden='true'
              />
            </ListItemIcon>
            <Typography
              color={theme.palette.text.primary}
              sx={{ fontSize: { xs: '12px', sm: '14px' } }}
            >
              {lang.members}
            </Typography>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate('/dashboard/user-profile');
          }}
          aria-label='Navigate to user profile'
          sx={{
            px: { xs: 1, sm: 1.25 },
            py: { xs: 0.75, sm: 1 },
            borderRadius: 1.5,
            minHeight: { xs: 40, sm: 44 },
          }}
        >
          <ListItemIcon sx={{ minWidth: { xs: 34, sm: 36 } }}>
            <AdminPanelSettings
              fontSize='small'
              sx={{ color: theme.palette.text.primary }}
              aria-hidden='true'
            />
          </ListItemIcon>
          <Typography
            color={theme.palette.text.primary}
            sx={{ fontSize: { xs: '12px', sm: '14px' } }}
          >
            Profile
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate('/dashboard/settings');
          }}
          aria-label='Navigate to settings'
          sx={{
            px: { xs: 1, sm: 1.25 },
            py: { xs: 0.75, sm: 1 },
            borderRadius: 1.5,
            minHeight: { xs: 40, sm: 44 },
          }}
        >
          <ListItemIcon sx={{ minWidth: { xs: 34, sm: 36 } }}>
            <SettingsIcon
              fontSize='small'
              sx={{ color: theme.palette.text.primary }}
              aria-hidden='true'
            />
          </ListItemIcon>
          <Typography
            color={theme.palette.text.primary}
            sx={{ fontSize: { xs: '12px', sm: '14px' } }}
          >
            {lang.settings}
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={handleLogout}
          aria-label='Log out'
          sx={{
            px: { xs: 1, sm: 1.25 },
            py: { xs: 0.75, sm: 1 },
            borderRadius: 1.5,
            minHeight: { xs: 40, sm: 44 },
          }}
        >
          <ListItemIcon sx={{ minWidth: { xs: 34, sm: 36 } }}>
            <LogoutIcon
              fontSize='small'
              sx={{ color: 'var(--secondary-color)' }}
              aria-hidden='true'
            />
          </ListItemIcon>
          <Typography
            color={'var(--secondary-color)'}
            sx={{ fontSize: { xs: '12px', sm: '14px' } }}
          >
            {lang.signout}
          </Typography>
        </MenuItem>
        {/* <Divider sx={{ my: 1 }} /> */}
      </Menu>

      {/* Team Members Modal for Mobile */}
      <TeamMembersModal
        open={teamMembersModalOpen}
        onClose={handleCloseTeamMembersModal}
        onOpenInviteModal={onOpenInviteModal}
        darkMode={darkMode}
      />
    </Box>
  );
};

export default Navbar;
