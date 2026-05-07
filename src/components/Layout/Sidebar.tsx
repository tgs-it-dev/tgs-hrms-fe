import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  useTheme as useMuiTheme,
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../theme/hooks';
import {
  isMenuVisibleForRole,
  isSubMenuVisibleForRole,
} from '../../utils/permissions';
import { clearAuthData } from '../../utils/authValidation';
import {
  getRoleName,
  isSystemAdmin as isSystemAdminRole,
} from '../../utils/roleUtils';
import { isUser as isEmployeeUser } from '../../utils/auth';
import { translations } from '../../utils/i18n';
import { Icons } from '../../assets/icons';
import {
  Apps,
  BusinessCenter,
  Campaign,
  Code,
  ConfirmationNumber,
  History,
  Insights,
  Receipt,
  Widgets,
} from '@mui/icons-material';
import {
  useFeatureToggles,
  type FeatureKey,
} from '../../context/FeatureToggleContext';

type SidebarKey = keyof typeof translations.sidebar;

interface SubItem {
  label: string;
  path: string;
  i18nKey?: SidebarKey;
}
interface MenuItem {
  label: string;
  icon: string | React.ReactNode;
  iconFill?: string | React.ReactNode;
  path?: string;
  subItems?: SubItem[];
  i18nKey?: SidebarKey;
}

type IconSize =
  | number
  | string
  | { xs?: number | string; lg?: number | string };

const MenuIcon: React.FC<{
  icon: string | React.ReactNode;
  iconFill?: string | React.ReactNode;
  isActive?: boolean;
  size?: IconSize;
  useOriginalColor?: boolean;
}> = ({
  icon,
  iconFill,
  isActive = false,
  size = 24,
  useOriginalColor = false,
}) => {
  const theme = useMuiTheme();
  // Normalize size to handle both number and responsive object
  const iconSize =
    typeof size === 'number'
      ? size
      : typeof size === 'object'
        ? size.xs || 20
        : 20;
  const iconSizeLg =
    typeof size === 'number'
      ? size
      : typeof size === 'object'
        ? size.lg || 24
        : 24;

  // If icon is a React component, render it directly
  if (React.isValidElement(icon)) {
    return (
      <Box
        sx={{
          width:
            typeof size === 'number' ? size : { xs: iconSize, lg: iconSizeLg },
          height:
            typeof size === 'number' ? size : { xs: iconSize, lg: iconSizeLg },
          minWidth:
            typeof size === 'number' ? size : { xs: iconSize, lg: iconSizeLg },
          minHeight:
            typeof size === 'number' ? size : { xs: iconSize, lg: iconSizeLg },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isActive
            ? theme.palette.mode === 'dark'
              ? 'var(--primary-light-color)'
              : theme.palette.primary.main
            : theme.palette.text.primary,
          transition: 'color 0.2s ease',
        }}
      >
        {React.cloneElement(icon, {
          sx: {
            fontSize:
              typeof size === 'number'
                ? size
                : { xs: iconSize, lg: iconSizeLg },
            color: 'inherit',
          },
        } as Record<string, unknown>)}
      </Box>
    );
  }

  // If icon is a string (image path), render as image
  // CSS filter to convert fill icon to primary color
  // Light mode: #3083dc (primary-dark-color)
  // Dark mode: #2462a5 (primary-light-color)
  const primaryColorFilterLight =
    'brightness(0) saturate(100%) invert(48%) sepia(95%) saturate(2476%) hue-rotate(195deg) brightness(98%) contrast(101%)';

  // CSS filter for #2462a5 (primary-light-color) - darker blue for dark mode
  const primaryColorFilterDark =
    'brightness(0) saturate(100%) invert(32%) sepia(98%) saturate(1495%) hue-rotate(190deg) brightness(92%) contrast(92%)';

  // CSS filter for inactive icons - theme-aware
  // Light mode: black (#000000)
  // Dark mode: light gray (#8f8f8f) - using brightness to convert to appropriate gray
  const inactiveFilter =
    theme.palette.mode === 'dark'
      ? 'brightness(0) saturate(100%) invert(56%)'
      : 'brightness(0) saturate(100%)';

  const iconSrc =
    isActive && iconFill && typeof iconFill === 'string'
      ? iconFill
      : (icon as string);

  const iconFilter = useOriginalColor
    ? 'none'
    : isActive && iconFill && typeof iconFill === 'string'
      ? theme.palette.mode === 'dark'
        ? primaryColorFilterDark
        : primaryColorFilterLight
      : inactiveFilter;

  return (
    <Box
      component='img'
      src={iconSrc}
      alt=''
      sx={{
        width:
          typeof size === 'number' ? size : { xs: iconSize, lg: iconSizeLg },
        height:
          typeof size === 'number' ? size : { xs: iconSize, lg: iconSizeLg },
        minWidth:
          typeof size === 'number' ? size : { xs: iconSize, lg: iconSizeLg },
        minHeight:
          typeof size === 'number' ? size : { xs: iconSize, lg: iconSizeLg },
        objectFit: 'contain',
        filter: iconFilter,
        transition: 'filter 0.2s ease',
      }}
    />
  );
};
interface SidebarProps {
  rtlMode: boolean;
  setRtlMode: React.Dispatch<React.SetStateAction<boolean>>;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  onMenuItemClick?: () => void;
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    i18nKey: 'dashboard',
    icon: Icons.dashboard,
    iconFill: Icons.dashboardFill,
    subItems: [{ label: 'Dashboard', i18nKey: 'dashboard', path: '' }],
  },
  {
    label: 'Announcements',
    i18nKey: 'announcements',
    icon: <Campaign />,
    subItems: [
      { label: 'Announcements', i18nKey: 'announcements', path: 'announcements' },
    ],
  },
  {
    label: 'Projects',
    i18nKey: 'projects',
    icon: <BusinessCenter />,
    subItems: [
      { label: 'Project List', i18nKey: 'projectList', path: 'project-list' },
      { label: 'Add Project', i18nKey: 'addProject', path: 'add-project' },
    ],
  },
  {
    label: 'Tenant',
    i18nKey: 'tenant',
    icon: <ConfirmationNumber />,
    subItems: [{ label: 'Add Tenant', i18nKey: 'addTenant', path: 'tenant' }],
  },
  {
    label: 'Department',
    i18nKey: 'department',
    icon: Icons.department,
    iconFill: Icons.departmentFill,
    subItems: [
      { label: 'Department List', i18nKey: 'departmentList', path: 'departments' },
      { label: 'Designation', i18nKey: 'designation', path: 'designations' },
      { label: 'User List', i18nKey: 'userList', path: 'user-list' },
      { label: 'Policies', i18nKey: 'policies', path: 'policies' },
      { label: 'Holidays', i18nKey: 'holidays', path: 'holidays' },
    ],
  },
  {
    label: 'Employees',
    i18nKey: 'employees',
    icon: Icons.employee,
    iconFill: Icons.employeeFill,
    subItems: [
      { label: 'Employee List', i18nKey: 'employeeList', path: 'employee-manager' },
      { label: 'Tenant Employees', i18nKey: 'tenantEmployees', path: 'tenant-employees' },
    ],
  },
  {
    label: 'Teams',
    i18nKey: 'teams',
    icon: Icons.teams,
    iconFill: Icons.teamsFill,
    subItems: [
      { label: 'Team Management', i18nKey: 'teamManagement', path: 'teams' },
      { label: 'Manager Tasks', i18nKey: 'managerTasks', path: 'manager-tasks' },
      { label: 'My Tasks', i18nKey: 'myTasks', path: 'my-tasks' },
    ],
  },
  {
    label: 'Attendance',
    i18nKey: 'attendance',
    icon: Icons.attendance,
    iconFill: Icons.attendanceFill,
    subItems: [
      { label: 'Geofencing', i18nKey: 'geofencing', path: 'geofencing' },
      { label: 'Attendance', i18nKey: 'attendance', path: 'attendance-check' },
      { label: 'Daily Attendance', i18nKey: 'dailyAttendance', path: 'attendance-table' },
      { label: 'Report', i18nKey: 'report', path: 'attendance-summary' },
      { label: 'Leave Request', i18nKey: 'leaveRequest', path: 'leaves' },
    ],
  },
  {
    label: 'Leave Analytics',
    i18nKey: 'leaveAnalytics',
    icon: Icons.leaveAnalytics,
    iconFill: Icons.leaveAnalyticsFill,
    subItems: [
      { label: 'Reports', i18nKey: 'reports', path: 'reports' },
      { label: 'Cross Tenant Leaves', i18nKey: 'crossTenantLeaves', path: 'cross-tenant-leaves' },
    ],
  },
  {
    label: 'Performance',
    i18nKey: 'performance',
    icon: <Insights />,
    subItems: [
      { label: 'Employee Performance', i18nKey: 'employeePerformance', path: 'performance-dashboard' },
    ],
  },
  {
    label: 'Accounts',
    i18nKey: 'accounts',
    icon: <Receipt />,
    subItems: [
      { label: 'Invoice', i18nKey: 'invoice', path: 'invoice' },
      { label: 'Payments', i18nKey: 'payments', path: 'payments' },
    ],
  },
  {
    label: 'Audit Logs',
    i18nKey: 'auditLogs',
    icon: <History />,
    subItems: [{ label: 'Audit Logs', i18nKey: 'auditLogs', path: 'audit-logs' }],
  },
  {
    label: 'App',
    i18nKey: 'app',
    icon: <Apps />,
    subItems: [
      { label: 'Chat', i18nKey: 'chat', path: 'chat' },
      { label: 'Calendar', i18nKey: 'calendar', path: 'calendar' },
    ],
  },
  {
    label: 'Other Pages',
    i18nKey: 'otherPages',
    icon: <Code />,
    subItems: [
      { label: 'Login', i18nKey: 'login', path: 'login' },
      { label: 'Register', i18nKey: 'register', path: 'register' },
      { label: 'Error', i18nKey: 'error', path: 'error' },
    ],
  },
  {
    label: 'UI Components',
    i18nKey: 'uiComponents',
    icon: <Widgets />,
    subItems: [
      { label: 'Buttons', i18nKey: 'buttons', path: 'buttons' },
      { label: 'Cards', i18nKey: 'cards', path: 'cards' },
      { label: 'Modals', i18nKey: 'modals', path: 'modals' },
    ],
  },
];

const menuLabelToFeature: Partial<Record<string, FeatureKey>> = {
  Attendance: 'attendance',
  'Leave Analytics': 'leaveAnalytics',
  Performance: 'performance',
  Recruitment: 'recruitment',
  Announcements: 'announcements',
  Projects: 'projects',
  Accounts: 'accounts',
  App: 'app',
};

export default function Sidebar({
  darkMode,
  onMenuItemClick,
  rtlMode: _rtlMode,
  setRtlMode: _setRtlMode,
}: SidebarProps) {
  // rtlMode and setRtlMode are reserved for future use
  void _rtlMode;
  void _setRtlMode;
  const { toggleTheme } = useTheme();
  const { isFeatureEnabled } = useFeatureToggles();
  const theme = useMuiTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  const translateLabel = useCallback(
    (key: SidebarKey | undefined, fallback = ''): string => {
      if (!key) return fallback;
      return translations.sidebar[key][isRtl ? 'ar' : 'en'];
    },
    [isRtl]
  );
  const role = user?.role;
  const userRoleName = getRoleName(role).toLowerCase();
  const isEmployee =
    userRoleName === 'user' || userRoleName === 'employee' || isEmployeeUser();

  const handleLogout = () => {
    clearAuthData();
    navigate('/');
  };

  const [openItem, setOpenItem] = useState<string>('');
  const [activeSubItem, setActiveSubItem] = useState<string>('');

  const filteredMenuItems = useMemo(() => {
    const userRole = getRoleName(role);

    const isSystemAdmin = isSystemAdminRole(role);

    const filtered = menuItems
      .filter(item => {
        const isVisible = isMenuVisibleForRole(item.label, userRole);
        if (!isVisible) return false;

        const featureKey = menuLabelToFeature[item.label];
        if (featureKey && !isFeatureEnabled(featureKey)) {
          return false;
        }

        return true;
      })
      .map(item => ({
        ...item,
        subItems: (item.subItems || []).filter(sub => {
          const isSubVisible = isSubMenuVisibleForRole(
            item.label,
            sub.label,
            userRole
          );

          return isSubVisible;
        }),
      }));
    // If the signed-in user is a plain employee, show a simplified Teams menu
    // labeled as "My Tasks" (this places quick access to their tasks)
    if (isEmployee) {
      return filtered.map(item => {
        if (item.label === 'Teams') {
          return {
            ...item,
            label: 'My Tasks',
            i18nKey: 'myTasks' as SidebarKey,
            subItems: [{ label: 'My Tasks', i18nKey: 'myTasks' as SidebarKey, path: 'my-tasks' }],
          } as MenuItem;
        }
        return item;
      });
    }

    // For system admins, keep the menu structure but hide the visible label
    // for the Manager Tasks subitem (show icon/navigation only).
    if (isSystemAdmin) {
      const withFeatureManagement: MenuItem[] = [
        ...filtered,
        {
          label: 'Feature Management',
          i18nKey: 'featureManagement' as SidebarKey,
          icon: <Apps />,
          subItems: [
            { label: 'Feature Management', i18nKey: 'featureManagement' as SidebarKey, path: 'feature-management' },
          ],
        },
      ];

      return withFeatureManagement.map(item => {
        if (item.label === 'Teams') {
          return {
            ...item,
            subItems: (item.subItems || []).map(sub =>
              sub.path === 'manager-tasks' ? { ...sub, label: '' } : sub
            ),
          } as MenuItem;
        }
        return item;
      });
    }

    return filtered;
  }, [role, isEmployee, isFeatureEnabled]);

  useEffect(() => {
    let currentPath = location.pathname.replace('/dashboard/', '');
    if (location.pathname === '/dashboard') currentPath = '';

    let matched = false;
    for (const item of filteredMenuItems) {
      const matchedSub = item.subItems?.find(sub => sub.path === currentPath);
      if (matchedSub) {
        setOpenItem(item.label);
        setActiveSubItem(matchedSub.label);
        matched = true;
        break;
      }
      if (item.path === currentPath) {
        setOpenItem(item.label);
        setActiveSubItem('');
        matched = true;
        break;
      }
    }
    if (!matched) {
      setOpenItem('');
      setActiveSubItem('');
    }
  }, [location.pathname, filteredMenuItems]);

  const handleSubItemClick = (parent: string, subLabel: string) => {
    setOpenItem(parent);
    setActiveSubItem(subLabel);
    onMenuItemClick?.();
  };

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderRadius: {
          xs: 0,
          lg: '20px',
        },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'SF Pro Rounded, sans-serif',
        height: '100%',
        overflow: 'hidden',
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 1px 3px rgba(0,0,0,0.3)'
            : '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          px: { xs: 2, lg: 3 },
          py: { xs: 3, lg: 5 },
          mb: 1,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: { xs: '24px', lg: '40px' },
            bottom: { xs: '24px', lg: '40px' },
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            component='img'
            src={Icons.logoSidebar}
            alt='Logo'
            sx={{
              height: 'auto',
              width: { xs: '120px', lg: 'auto' },
              maxWidth: { xs: '120px', lg: 'none' },
              filter:
                theme.palette.mode === 'dark'
                  ? 'brightness(0) saturate(100%) invert(56%)'
                  : 'none',
              transition: 'filter 0.2s ease',
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          px: 1,
        }}
      >
        <List>
          {filteredMenuItems.map(item => {
            const visibleSubItems = (item.subItems || []).filter(
              sub => !!(sub.label && String(sub.label).trim())
            );
            const hasSubMenu = visibleSubItems.length > 1;
            const isSingleSubItem = visibleSubItems.length === 1;
            const isParentActive = openItem === item.label;
            const isDirectLink =
              (!item.subItems?.length && item.path) || isSingleSubItem;
            const directPath = isSingleSubItem
              ? visibleSubItems[0].path
              : item.path;
            const directLabel = isSingleSubItem
              ? visibleSubItems[0].label
              : item.label;
            const directI18nKey = isSingleSubItem
              ? visibleSubItems[0].i18nKey
              : item.i18nKey;

            // Match current route for highlight (same logic as useEffect)
            const currentPath =
              location.pathname === '/dashboard'
                ? ''
                : location.pathname.replace('/dashboard/', '');
            const isDirectLinkActive = Boolean(
              isDirectLink && directPath === currentPath
            );

            return (
              <Box key={item.label}>
                {isDirectLink ? (
                  <ListItemButton
                    component={NavLink}
                    to={`/dashboard/${directPath}`}
                    onClick={() => {
                      setOpenItem(item.label);
                      setActiveSubItem(isSingleSubItem ? directLabel : '');
                      onMenuItemClick?.();
                    }}
                    sx={{
                      color: isDirectLinkActive
                        ? theme.palette.mode === 'dark'
                          ? 'var(--primary-light-color)'
                          : theme.palette.primary.main
                        : theme.palette.text.primary,
                      pl: 2,
                      py: 1.5,
                      mx: 1.5,
                      mb: 0.5,
                      backgroundColor: isDirectLinkActive
                        ? theme.palette.mode === 'dark'
                          ? theme.palette.action.selected
                          : theme.palette.background.default
                        : 'transparent',
                      borderRadius: isDirectLinkActive
                        ? 'var(--border-radius-lg)'
                        : 0,
                      // '&:hover': {
                      //   backgroundColor: isDirectLinkActive
                      //     ? 'var(--light-grey-200-color)'
                      //     : 'var(--white-100-color)',
                      //   borderRadius: 'var(--border-radius-lg)',
                      // },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: { xs: '32px', lg: '36px' },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MenuIcon
                        icon={item.icon}
                        iconFill={item.iconFill}
                        isActive={isDirectLinkActive}
                        size={{ xs: '18px', lg: '18px' }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={translateLabel(directI18nKey, directLabel)}
                      primaryTypographyProps={{
                        fontSize: { xs: '14px', lg: 'var(--body-font-size)' },
                        fontWeight: isDirectLinkActive ? 600 : 400,
                        color: isDirectLinkActive
                          ? theme.palette.mode === 'dark'
                            ? 'var(--primary-light-color)'
                            : theme.palette.primary.main
                          : theme.palette.text.primary,
                      }}
                    />
                  </ListItemButton>
                ) : (
                  <>
                    <ListItemButton
                      onClick={() =>
                        setOpenItem(isParentActive ? '' : item.label)
                      }
                      sx={{
                        color: isParentActive
                          ? theme.palette.mode === 'dark'
                            ? 'var(--primary-light-color)'
                            : theme.palette.primary.main
                          : theme.palette.text.primary,
                        pl: 2,
                        py: 1.5,
                        mx: 1.5,
                        mb: 0.5,
                        backgroundColor: isParentActive
                          ? theme.palette.mode === 'dark'
                            ? theme.palette.action.selected
                            : theme.palette.background.default
                          : 'transparent',
                        borderRadius: isParentActive
                          ? 'var(--border-radius-lg)'
                          : 0,
                        // '&:hover': {
                        //   backgroundColor: isParentActive
                        //     ? 'var(--light-grey-200-color)'
                        //     : 'var(--white-100-color)',
                        //   borderRadius: 'var(--border-radius-lg)',
                        // },
                      }}
                      aria-label={`${translateLabel(item.i18nKey, item.label)} menu`}
                      aria-expanded={isParentActive}
                      aria-controls={`${item.label}-submenu`}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: { xs: '32px', lg: '36px' },
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        aria-hidden='true'
                      >
                        <MenuIcon
                          icon={item.icon}
                          iconFill={item.iconFill}
                          isActive={isParentActive}
                          size={{ xs: '18px', lg: '18px' }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={translateLabel(item.i18nKey, item.label)}
                        primaryTypographyProps={{
                          fontSize: { xs: '14px', lg: 'var(--body-font-size)' },
                          fontWeight: isParentActive ? 600 : 400,
                          color: isParentActive
                            ? theme.palette.mode === 'dark'
                              ? 'var(--primary-light-color)'
                              : theme.palette.primary.main
                            : theme.palette.text.primary,
                        }}
                      />
                      {hasSubMenu && (
                        <Box
                          component='img'
                          src={Icons.arrowUp}
                          alt=''
                          sx={{
                            width: 16,
                            height: 16,
                            transform: isParentActive
                              ? 'rotate(180deg)'
                              : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                            filter:
                              theme.palette.mode === 'dark'
                                ? 'brightness(0) saturate(100%) invert(56%)'
                                : 'brightness(0) saturate(100%)',
                          }}
                        />
                      )}
                    </ListItemButton>

                    <Collapse
                      in={isParentActive}
                      timeout='auto'
                      unmountOnExit
                      id={`${item.label}-submenu`}
                    >
                      <List component='div' disablePadding role='menu'>
                        {item.subItems
                          ?.filter(
                            sub => !!(sub.label && String(sub.label).trim())
                          )
                          .map(sub => (
                            <ListItemButton
                              key={sub.path}
                              component={NavLink}
                              to={`/dashboard/${sub.path}`}
                              onClick={() =>
                                handleSubItemClick(item.label, sub.label)
                              }
                              sx={{
                                pl: { xs: 7.5, lg: 8 },
                                py: 1,
                                fontSize: {
                                  xs: '14px',
                                  lg: 'var(--body-font-size)',
                                },
                                color:
                                  activeSubItem === sub.label
                                    ? theme.palette.mode === 'dark'
                                      ? 'var(--primary-light-color)'
                                      : theme.palette.primary.main
                                    : theme.palette.text.primary,
                                // '&:hover': {
                                //   backgroundColor: 'var(--white-100-color)',
                                //   borderRadius: 'var(--border-radius-lg)',
                                // },
                              }}
                              role='menuitem'
                              aria-label={`Navigate to ${translateLabel(sub.i18nKey, sub.label)}`}
                            >
                              <ListItemText
                                primary={translateLabel(sub.i18nKey, sub.label)}
                                primaryTypographyProps={{
                                  fontSize: {
                                    xs: '14px',
                                    lg: 'var(--body-font-size)',
                                  },
                                  fontWeight:
                                    activeSubItem === sub.label ? 600 : 400,
                                  color:
                                    activeSubItem === sub.label
                                      ? theme.palette.mode === 'dark'
                                        ? 'var(--primary-light-color)'
                                        : theme.palette.primary.main
                                      : theme.palette.text.primary,
                                }}
                              />
                            </ListItemButton>
                          ))}
                      </List>
                    </Collapse>
                  </>
                )}
              </Box>
            );
          })}
        </List>
      </Box>

      <Box sx={{ px: 3, pb: 3, pt: 2, mt: 'auto', flexShrink: 0 }}>
        <Box
          display='flex'
          alignItems='center'
          justifyContent='space-between'
          mb={2}
        >
          <Typography
            variant='body2'
            component='label'
            htmlFor='dark-mode-switch'
            sx={{
              color: theme.palette.text.primary,
              fontSize: { xs: '14px', lg: 'var(--body-font-size)' },
              fontWeight: 400,
              cursor: 'pointer',
            }}
          >
            {translateLabel('darkMode')}
          </Typography>
          <Box
            component='button'
            id='dark-mode-switch'
            onClick={toggleTheme}
            aria-label='Toggle dark mode'
            role='switch'
            aria-checked={darkMode}
            sx={{
              position: 'relative',
              width: 50,
              height: 20,
              padding: 0,
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              outline: 'none',
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: '2px',
                borderRadius: '12px',
              },
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '12px',
                backgroundColor: darkMode
                  ? 'var(--primary-dark-color)'
                  : 'grey.400',
                transition: 'background-color 300ms ease',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: '2px',
                left: darkMode ? '22px' : '2px',
                width: 25,
                height: 16,
                borderRadius: '40%',
                backgroundColor: theme.palette.background.paper,
                // boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                transition: 'left 300ms ease',
              }}
            />
          </Box>
        </Box>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            color: 'var(--secondary-color)',
            pl: 0.25,
            py: 1.5,
            borderRadius: 'var(--border-radius-lg)',
            // '&:hover': {
            //   backgroundColor: theme.palette.error.main + '1A',
            //   borderRadius: 'var(--border-radius-lg)',
            // },
          }}
        >
          <ListItemIcon
            sx={{
              color: 'var(--secondary-color)',
              minWidth: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1,
            }}
          >
            <Box
              component='img'
              src={Icons.logout}
              alt=''
              sx={{
                width: { xs: 20, lg: 24 },
                height: { xs: 20, lg: 24 },
                filter:
                  theme.palette.mode === 'dark'
                    ? 'brightness(0) saturate(100%) invert(20%) sepia(95%) saturate(5000%) hue-rotate(320deg) brightness(90%) contrast(90%)'
                    : 'brightness(0) saturate(100%) invert(20%) sepia(95%) saturate(5000%) hue-rotate(320deg) brightness(90%) contrast(90%)',
              }}
            />
          </ListItemIcon>
          <ListItemText
            primary={translateLabel('logout')}
            primaryTypographyProps={{
              fontSize: { xs: '14px', lg: 'var(--body-font-size)' },
              fontWeight: 500,
              color: 'var(--secondary-color)',
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
}
