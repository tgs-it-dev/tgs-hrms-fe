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
import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
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

interface SubItem {
  label: string;
  path: string;
}
interface MenuItem {
  label: string;
  icon: string | React.ReactNode;
  iconFill?: string | React.ReactNode;
  path?: string;
  subItems?: SubItem[];
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
    icon: Icons.dashboard,
    iconFill: Icons.dashboardFill,
    subItems: [{ label: 'Dashboard', path: '' }],
  },
  {
    label: 'Announcements',
    icon: <Campaign />,
    subItems: [{ label: 'Announcements', path: 'announcements' }],
  },
  {
    label: 'Projects',
    icon: <BusinessCenter />,
    subItems: [
      { label: 'Project List', path: 'project-list' },
      { label: 'Add Project', path: 'add-project' },
    ],
  },
  {
    label: 'Tenant',
    icon: <ConfirmationNumber />,
    subItems: [{ label: 'Add Tenant', path: 'tenant' }],
  },
  {
    label: 'Department',
    icon: Icons.department,
    iconFill: Icons.departmentFill,
    subItems: [
      { label: 'Department List', path: 'departments' },
      { label: 'Designation', path: 'designations' },
      { label: 'User List', path: 'user-list' },
      { label: 'Policies', path: 'policies' },
      { label: 'Holidays', path: 'holidays' },
    ],
  },
  {
    label: 'Employees',
    icon: Icons.employee,
    iconFill: Icons.employeeFill,
    subItems: [
      { label: 'Employee List', path: 'employee-manager' },
      { label: 'Tenant Employees', path: 'tenant-employees' },
    ],
  },
  {
    label: 'Teams',
    icon: Icons.teams,
    iconFill: Icons.teamsFill,
    subItems: [
      { label: 'Team Management', path: 'teams' },
      { label: 'Manager Tasks', path: 'manager-tasks' },
      { label: 'My Tasks', path: 'my-tasks' },
    ],
  },
  {
    label: 'Attendance',
    icon: Icons.attendance,
    iconFill: Icons.attendanceFill,
    subItems: [
      { label: 'Geofencing', path: 'geofencing' },
      { label: 'Attendance', path: 'attendance-check' },
      { label: 'Daily Attendance', path: 'attendance-table' },
      { label: 'Report', path: 'attendance-summary' },
      { label: 'Leave Request', path: 'leaves' },
    ],
  },
  {
    label: 'Leave Analytics',
    icon: Icons.leaveAnalytics,
    iconFill: Icons.leaveAnalyticsFill,
    subItems: [
      { label: 'Reports', path: 'reports' },
      { label: 'Cross Tenant Leaves', path: 'cross-tenant-leaves' },
    ],
  },
  {
    label: 'Performance',
    icon: <Insights />,
    subItems: [
      { label: 'Employee Performance', path: 'performance-dashboard' },
    ],
  },
  {
    label: 'Accounts',
    icon: <Receipt />,
    subItems: [
      { label: 'Invoice', path: 'invoice' },
      { label: 'Payments', path: 'payments' },
    ],
  },
  {
    label: 'Audit Logs',
    icon: <History />,
    subItems: [{ label: 'Audit Logs', path: 'audit-logs' }],
  },
  {
    label: 'App',
    icon: <Apps />,
    subItems: [
      { label: 'Chat', path: 'chat' },
      { label: 'Calendar', path: 'calendar' },
    ],
  },
  {
    label: 'Other Pages',
    icon: <Code />,
    subItems: [
      { label: 'Login', path: 'login' },
      { label: 'Register', path: 'register' },
      { label: 'Error', path: 'error' },
    ],
  },
  {
    label: 'UI Components',
    icon: <Widgets />,
    subItems: [
      { label: 'Buttons', path: 'buttons' },
      { label: 'Cards', path: 'cards' },
      { label: 'Modals', path: 'modals' },
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
            subItems: [{ label: 'My Tasks', path: 'my-tasks' }],
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
          icon: <Apps />,
          subItems: [
            { label: 'Feature Management', path: 'feature-management' },
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
                          : '#efefef'
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
                      primary={directLabel}
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
                            : '#efefef'
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
                      aria-label={`${item.label} menu`}
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
                        primary={item.label}
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
                              aria-label={`Navigate to ${sub.label}`}
                            >
                              <ListItemText
                                primary={sub.label}
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
            Dark Mode
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
                  : '#bdbdbd',
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
            primary='Log out'
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
