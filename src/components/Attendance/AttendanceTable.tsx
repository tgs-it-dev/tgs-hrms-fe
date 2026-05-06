import { useEffect, useState, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
  Pagination,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DatePicker from 'react-multi-date-picker';
import 'react-multi-date-picker/styles/layouts/mobile.css';
import 'react-multi-date-picker/styles/colors/teal.css';
import './AttendanceTable.css';
import attendanceApi, {
  type SystemAllAttendanceResponse,
} from '../../api/attendanceApi';
import { exportCSV } from '../../api/exportApi';
import type {
  AttendanceEvent,
  AttendanceResponse,
  UserShort,
  TeamAttendanceEntry,
} from '../../api/attendanceApi';
import {
  isManager as checkIsManager,
  isAdmin,
  isSystemAdmin,
  isNetworkAdmin,
  isHRAdmin,
} from '../../utils/roleUtils';
import DateNavigation from './DateNavigation';
import { useTheme } from '../../theme/hooks';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { formatDate } from '../../utils/dateUtils';
// systemEmployeeApiService removed; not used after cleanup
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppButton from '../common/AppButton';
import AppTable from '../common/AppTable';
import AppDropdown from '../common/AppDropdown';
import systemEmployeeApiService from '../../api/systemEmployeeApi';
import type { SelectChangeEvent } from '@mui/material/Select';
import AppPageTitle from '../common/AppPageTitle';
import type { CheckInTeamMember } from './TeamCheckInDialog';
import { PAGINATION } from '../../constants/appConstants';

import TeamCheckInView from './TeamCheckInView';
import { authService } from '../../api/authService';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { useUser } from '../../hooks/useUser';

const ATTENDANCE_PAGE_SIZE = PAGINATION.DEFAULT_PAGE_SIZE;
dayjs.extend(duration);

type TenantOption = { id: string; name: string };
interface AttendanceRecord {
  id: string;
  userId: string | null;
  date: string;
  checkInISO?: string | null;
  checkOutISO?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  workedHours?: number | null;
  near_boundary?: boolean;
  user?: { first_name?: string; last_name?: string } | null;
  approvalStatus?: string | null;
}

const hasDateField = (obj: unknown): obj is { date: unknown } =>
  !!obj &&
  typeof obj === 'object' &&
  'date' in (obj as Record<string, unknown>);

const hasCheckInField = (obj: unknown): obj is { checkIn: unknown } =>
  !!obj &&
  typeof obj === 'object' &&
  'checkIn' in (obj as Record<string, unknown>);

const formatLocalYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Normalize approval status from backend shapes
const getApprovalStatus = (obj: unknown): string | null => {
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as Record<string, unknown>;
  const a1 = o['approval_status'];
  const a2 = o['approvalStatus'];
  if (typeof a1 === 'string' && a1) return a1;
  if (typeof a2 === 'string' && a2) return a2;
  return null;
};

const AttendanceTable = () => {
  const { user: contextUser } = useUser();
  const { mode } = useTheme();
  const muiTheme = useMuiTheme();
  const { snackbar, showError, closeSnackbar } = useErrorHandler();
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isManager, setIsManager] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isSystemAdminUser, setIsSystemAdminUser] = useState(false);
  const [isNetworkAdminUser, setIsNetworkAdminUser] = useState(false);
  const [isHRAdminUser, setIsHRAdminUser] = useState(false);
  const [adminView, setAdminView] = useState<'my' | 'all'>('my');
  const [managerView, setManagerView] = useState<'my' | 'team' | 'checkin'>(
    'my'
  );
  const [tab, setTab] = useState(0); // 0: My Attendance, 1: Team Attendance
  const [teamAttendance, setTeamAttendance] = useState<CheckInTeamMember[]>([]);
  const [filteredTeamAttendance, setFilteredTeamAttendance] = useState<
    CheckInTeamMember[]
  >([]);
  const [teamEmployees, setTeamEmployees] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedTeamEmployee, setSelectedTeamEmployee] = useState('');
  const [teamLoading, setTeamLoading] = useState(false);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [, setTeamError] = useState('');
  const [, setTeamCurrentPage] = useState(1);
  const [, setTeamTotalPages] = useState(1);
  const [, setTeamTotalItems] = useState(0);
  const [currentNavigationDate, setCurrentNavigationDate] = useState('all');
  const [myAttendanceNavigationDate, setMyAttendanceNavigationDate] =
    useState('all');
  const [teamCurrentNavigationDate, setTeamCurrentNavigationDate] =
    useState('all');
  const [teamStartDate, setTeamStartDate] = useState('');
  const [teamEndDate, setTeamEndDate] = useState('');

  const toDisplayTime = (iso: string | null) => {
    if (!iso) return '-';
    const d = dayjs(iso);
    return d.isValid() ? d.format('hh:mm A') : '-';
  };
  const token = authService.getAccessToken();

  /**
   * Converts decimal hours (e.g., 1.5) to a string "1 hr 30 min 0 sec"
   * using Day.js Duration plugin
   */
  const formatWorkedHours = (
    decimalHours: number | null | undefined
  ): string => {
    if (
      decimalHours === null ||
      decimalHours === undefined ||
      isNaN(decimalHours)
    ) {
      return '-';
    }

    const dur = dayjs.duration(decimalHours, 'hours');

    const hours = Math.floor(dur.asHours());
    const minutes = dur.minutes();
    const seconds = dur.seconds();

    const parts = [];
    if (hours > 0) parts.push(`${hours} hr`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes} min`);
    parts.push(`${seconds} sec`);

    return parts.join(' ') || '0 sec';
  };

  // Build query params for CSV export based on current filters
  const buildExportFilters = () => {
    const params: Record<string, string> = {};

    // Optional tenant filter (used by System Admin)
    if (selectedTenant) {
      params.tenantId = selectedTenant;
    }

    // Optional date range filters
    if (startDate) {
      params.startDate = startDate;
    }
    if (endDate) {
      params.endDate = endDate;
    }

    return params;
  };
  const buildFromSummaries = (
    summariesRaw: unknown[],
    currentUserId: string
  ): AttendanceRecord[] => {
    return summariesRaw.map((summaryUnknown: unknown) => {
      const summary = (summaryUnknown as Record<string, unknown>) || {};
      const userObj = (summary.user as UserShort) || undefined;
      const date = typeof summary.date === 'string' ? summary.date : '';
      const checkInRaw = summary.checkIn as string | undefined;
      const checkOutRaw = summary.checkOut as string | undefined;
      const workedHours =
        typeof summary.workedHours === 'number' ? summary.workedHours : null;
      const approval =
        (summary.approval_status as string | undefined) ||
        (summary.approvalStatus as string | undefined) ||
        null;

      return {
        id: `${date}-${currentUserId}`,
        userId: currentUserId,
        date,
        checkInISO: checkInRaw || null,
        checkOutISO: checkOutRaw || null,
        checkIn: checkInRaw ? toDisplayTime(checkInRaw) : null,
        checkOut: checkOutRaw ? toDisplayTime(checkOutRaw) : null,
        workedHours,
        approvalStatus: approval,
        user: {
          first_name:
            `${userObj?.first_name || ''} ${userObj?.last_name || ''}`.trim(),
        },
      } as AttendanceRecord;
    });
  };

  const buildFromEvents = (
    eventsRaw: AttendanceEvent[],
    currentUserId: string,
    isAllAttendance: boolean = false
  ): AttendanceRecord[] => {
    const events = eventsRaw
      .filter(e => e && e.timestamp && e.type)
      .map(e => {
        const eventUserId = e.user_id;
        const userObjId = e.user?.id;
        const finalUserId =
          eventUserId ?? userObjId ?? (isAllAttendance ? null : currentUserId);

        console.warn('Processing event:', {
          eventId: e.id,
          eventUserId,
          userObjId,
          finalUserId,
          currentUserId,
          isAllAttendance,
        });

        return {
          id: e.id,
          user_id: finalUserId as string | null,
          timestamp: e.timestamp,
          type: e.type as 'check-in' | 'check-out' | string,
          user: e.user as UserShort | undefined,
          near_boundary: e.near_boundary,
          approvalStatus: getApprovalStatus(e),
        } as AttendanceEvent & { approvalStatus?: string | null };
      })
      .filter(e => {
        const hasUserId = !!e.user_id;
        if (!hasUserId) {
          console.warn('Filtering out event without user_id:', e);
        }
        return hasUserId;
      })
      // Only include events with valid user_id
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

    const sessions: AttendanceRecord[] = [];

    const userEvents = new Map<
      string,
      Array<{
        id: string;
        timestamp: string;
        type: 'check-in' | 'check-out';
        user?: { first_name?: string; last_name?: string };
        approvalStatus?: string | null;
      }>
    >();

    for (const ev of events) {
      const userId = ev.user_id as string;

      if (!isAllAttendance) {
        if (userId && userId !== currentUserId) {
          // Skip events for other users when specific employee is selected
          continue;
        }
        // Only process events for the selected employee (currentUserId)
        if (!userEvents.has(currentUserId)) {
          userEvents.set(currentUserId, []);
        }
        userEvents.get(currentUserId)?.push({
          id: String(ev.id),
          timestamp: String(ev.timestamp),
          type: ev.type as 'check-in' | 'check-out',
          user: ev.user as UserShort | undefined,
          approvalStatus: ev.approvalStatus ?? null,
        });
      } else {
        // For all attendance view (no employee selected), process all events
        const finalUserId = userId || currentUserId;
        if (!finalUserId) continue;

        if (!userEvents.has(finalUserId)) {
          userEvents.set(finalUserId, []);
        }
        userEvents.get(finalUserId)?.push({
          id: String(ev.id),
          timestamp: String(ev.timestamp),
          type: ev.type as 'check-in' | 'check-out',
          user: ev.user as UserShort | undefined,
          approvalStatus: ev.approvalStatus ?? null,
        });
      }
    }

    for (const [userId, userEventList] of userEvents.entries()) {
      // When employee is selected (isAllAttendance = false), only process events for that employee
      if (!isAllAttendance && userId !== currentUserId) {
        continue;
      }
      const openSessions: Array<{
        checkIn: {
          id: string;
          timestamp: string;
          near_boundary?: boolean;
          user?: { first_name?: string; last_name?: string };
        };
        checkOut: {
          id: string;
          timestamp: string;
          near_boundary?: boolean;
        } | null;
      }> = [];

      for (const event of userEventList) {
        // Find the original event to get near_boundary
        const originalEvent = events.find(e => String(e.id) === event.id);
        const nearBoundary = originalEvent?.near_boundary ?? false;

        if (event.type === 'check-in') {
          openSessions.push({
            checkIn: {
              id: event.id,
              timestamp: event.timestamp,
              near_boundary: nearBoundary,
              user: event.user,
              approvalStatus: event.approvalStatus ?? null,
            },
            checkOut: null,
          });
        } else if (event.type === 'check-out') {
          const lastOpenIndex = openSessions.findIndex(
            session => !session.checkOut
          );

          if (lastOpenIndex !== -1) {
            openSessions[lastOpenIndex].checkOut = {
              id: event.id,
              timestamp: event.timestamp,
              near_boundary: nearBoundary,
            };
          }
        }
      }
      for (const session of openSessions) {
        const checkInDate = dayjs(session.checkIn.timestamp);
        const shiftDate = checkInDate.format('YYYY-MM-DD');

        let workedHours = null;
        let checkOutISO = null;
        let checkOutDisplay = null;

        if (session.checkOut) {
          checkOutISO = session.checkOut.timestamp;
          checkOutDisplay = toDisplayTime(checkOutISO);

          const inTime = dayjs(session.checkIn.timestamp);
          const outTime = dayjs(checkOutISO);

          if (outTime.isAfter(inTime)) {
            workedHours = parseFloat(
              outTime.diff(inTime, 'hour', true).toFixed(2)
            );
          }
        }

        sessions.push({
          id: `${session.checkIn.id}-${session.checkOut ? session.checkOut.id : 'open'}`,
          userId: userId,
          date: shiftDate,
          checkInISO: session.checkIn.timestamp,
          checkOutISO,
          checkIn: toDisplayTime(session.checkIn.timestamp),
          checkOut: checkOutDisplay || '-',
          workedHours,
        });
      }
    }

    return sessions;
  };
  const buildFromSystemAll = (
    systemData: SystemAllAttendanceResponse,
    tenantFilter?: string | null,
    employeeFilter?: string | null
  ): AttendanceRecord[] => {
    const rows: AttendanceRecord[] = [];

    systemData.tenants.forEach(tenant => {
      if (tenantFilter && tenant.tenant_id !== tenantFilter) return;

      tenant.employees.forEach(emp => {
        // Filter by employee if employeeFilter is provided
        if (employeeFilter && emp.user_id !== employeeFilter) return;

        emp.attendance.forEach(att => {
          const id = `${tenant.tenant_id}-${emp.user_id}-${att.date}`;

          rows.push({
            id,
            userId: emp.user_id,
            date: att.date,
            checkInISO: att.checkIn,
            checkOutISO: att.checkOut,
            checkIn: att.checkIn ? toDisplayTime(att.checkIn) : null,
            checkOut: att.checkOut ? toDisplayTime(att.checkOut) : null,
            workedHours:
              typeof att.workedHours === 'number' ? att.workedHours : null,
            user: {
              first_name: emp.first_name,
              last_name: emp.last_name,
            },
            approvalStatus: getApprovalStatus(att),
          });
        });
      });
    });

    return rows;
  };

  const fetchTeamAttendance = async (
    page = 1,
    startDate?: string,
    endDate?: string
  ) => {
    setTeamLoading(true);
    setTeamError('');
    try {
      const response = await attendanceApi.getTeamAttendance(
        page,
        startDate,
        endDate,
        selectedTenant || undefined // tenantId
      );

      const teamItems = response.items || [];
      setTeamAttendance(teamItems as unknown as CheckInTeamMember[]);
      if (startDate || endDate) {
        const filteredItems = teamItems
          .map((memberUnknown: unknown) => {
            const member =
              (memberUnknown as CheckInTeamMember) || ({} as CheckInTeamMember);
            const filteredAttendance =
              (member.attendance || []).filter((att: TeamAttendanceEntry) => {
                if (!att.date) return false;
                let attDateStr = '';
                if (
                  typeof att.date === 'string' &&
                  att.date.match(/^\d{4}-\d{2}-\d{2}$/)
                ) {
                  attDateStr = att.date;
                } else if (
                  typeof att.date === 'string' &&
                  att.date.includes('T')
                ) {
                  attDateStr = att.date.split('T')[0];
                } else {
                  try {
                    const dateObj = new Date(att.date);
                    if (!isNaN(dateObj.getTime())) {
                      const year = dateObj.getFullYear();
                      const month = String(dateObj.getMonth() + 1).padStart(
                        2,
                        '0'
                      );
                      const day = String(dateObj.getDate()).padStart(2, '0');
                      attDateStr = `${year}-${month}-${day}`;
                    }
                  } catch {
                    attDateStr = String(att.date);
                  }
                }
                if (startDate && endDate) {
                  return attDateStr >= startDate && attDateStr <= endDate;
                } else if (startDate) {
                  return attDateStr >= startDate;
                } else if (endDate) {
                  return attDateStr <= endDate;
                }
                return true;
              }) || [];
            return {
              ...member,
              attendance: filteredAttendance,
            };
          })
          .filter(
            (member: CheckInTeamMember) =>
              member.attendance && member.attendance.length > 0
          );
        setFilteredTeamAttendance(filteredItems);
      } else {
        setFilteredTeamAttendance(teamItems);
      }
      setTeamCurrentPage(response.page || 1);
      setTeamTotalPages(response.totalPages || 1);
      setTeamTotalItems(response.total || 0);
    } catch (error) {
      setTeamError('Failed to load team attendance');
      setTeamAttendance([]);
      setFilteredTeamAttendance([]);
      setTeamCurrentPage(1);
      setTeamTotalPages(1);
      setTeamTotalItems(0);
      showError(error);
    } finally {
      setTeamLoading(false);
    }
  };
  const fetchAttendanceByDate = async (
    date: string,
    view: 'all' | 'my' | 'team'
  ) => {
    if (view === 'all' || view === 'my') {
      setLoading(true);
    } else {
      setTeamLoading(true);
    }

    try {
      if (!contextUser) {
        if (view === 'all' || view === 'my') {
          setLoading(false);
        } else {
          setTeamLoading(false);
        }
        return;
      }

      const currentUser = contextUser;
      let response: AttendanceResponse;

      if (view === 'all') {
        let rows: AttendanceRecord[] = [];

        if (isSystemAdmin(currentUser.role)) {
          const systemData = await attendanceApi.getSystemAllAttendance(
            date,
            date
          );
          rows = buildFromSystemAll(
            systemData,
            selectedTenant || null,
            selectedEmployee || null
          );
        } else {
          response = await attendanceApi.getAllAttendance(
            1,
            date,
            date,
            undefined,
            selectedTenant || undefined
          );

          const events: AttendanceEvent[] =
            (response.items as AttendanceEvent[]) || [];

          const isShiftBased =
            events.length > 0 &&
            hasDateField(events[0]) &&
            hasCheckInField(events[0]);

          if (isShiftBased) {
            rows = buildFromSummaries(events as unknown[], currentUser.id);
          } else {
            rows = buildFromEvents(events, currentUser.id, true);
          }
        }

        // If an employee is selected in admin "All" view, keep only that employee's records
        let filteredRows = rows;
        if (selectedEmployee) {
          const selectedId = String(selectedEmployee).trim();
          filteredRows = rows.filter(record => {
            const recordUserId = String(record.userId || '').trim();
            return recordUserId === selectedId;
          });
        }

        setAttendanceData(filteredRows);
        setFilteredData(filteredRows);

        setCurrentPage(1);
        setTotalPages(1);
        setTotalItems(filteredRows.length);
      } else if (view === 'my') {
        response = await attendanceApi.getAttendanceEvents(
          currentUser.id,
          1,
          date,
          date,
          selectedTenant || undefined
        );

        const events: AttendanceEvent[] =
          (response.items as AttendanceEvent[]) || [];
        let rows: AttendanceRecord[] = [];

        const isShiftBased =
          events.length > 0 &&
          hasDateField(events[0]) &&
          hasCheckInField(events[0]);

        if (isShiftBased) {
          rows = buildFromSummaries(events as unknown[], currentUser.id);
        } else {
          rows = buildFromEvents(events, currentUser.id, false);
        }

        setAttendanceData(rows);
        setFilteredData(rows);

        setCurrentPage(1);
        setTotalPages(1);
        setTotalItems(rows.length);
      } else {
        const teamResponse = await attendanceApi.getTeamAttendance(
          1,
          date, // Start date
          date, // End date (same day)
          selectedTenant || undefined // tenantId
        );
        response = {
          items: teamResponse.items,
          total: teamResponse.total,
          page: teamResponse.page,
          limit: 10, // Default limit
          totalPages: teamResponse.totalPages,
        };
        const teamItems =
          (response.items as unknown as CheckInTeamMember[]) || [];
        setTeamAttendance(teamItems);

        const selectedDateStr = date;
        const filteredItems = teamItems
          .map((memberUnknown: unknown) => {
            const member =
              (memberUnknown as CheckInTeamMember) || ({} as CheckInTeamMember);
            const filteredAttendance =
              (member.attendance || []).filter((att: TeamAttendanceEntry) => {
                if (!att.date) return false;

                let attDateStr = '';

                if (
                  typeof att.date === 'string' &&
                  att.date.match(/^\d{4}-\d{2}-\d{2}$/)
                ) {
                  attDateStr = att.date;
                } else if (
                  typeof att.date === 'string' &&
                  att.date.includes('T')
                ) {
                  attDateStr = att.date.split('T')[0];
                } else {
                  try {
                    const dateObj = new Date(att.date);
                    if (!isNaN(dateObj.getTime())) {
                      const year = dateObj.getFullYear();
                      const month = String(dateObj.getMonth() + 1).padStart(
                        2,
                        '0'
                      );
                      const day = String(dateObj.getDate()).padStart(2, '0');
                      attDateStr = `${year}-${month}-${day}`;
                    }
                  } catch {
                    attDateStr = String(att.date);
                  }
                }

                return attDateStr === selectedDateStr;
              }) || [];
            return {
              ...member,
              attendance: filteredAttendance,
            };
          })
          .filter(
            (member: CheckInTeamMember) =>
              member.attendance && member.attendance.length > 0
          );
        setFilteredTeamAttendance(filteredItems);
      }
    } catch (error) {
      if (view === 'all' || view === 'my') {
        setAttendanceData([]);
        setFilteredData([]);
      } else {
        setTeamAttendance([]);
        setFilteredTeamAttendance([]);
      }
      showError(error);
    } finally {
      if (view === 'all' || view === 'my') {
        setLoading(false);
      } else {
        setTeamLoading(false);
      }
    }
  };

  const _fetchEmployeesFromAttendance = async (
    _viewOverride?: 'my' | 'all'
  ) => {
    try {
      const currentView = _viewOverride || adminView;

      if (currentView === 'my') {
        setEmployees([]);
        return;
      }

      if (!contextUser) {
        setEmployees([]);
        return;
      }

      if (isSystemAdmin(contextUser.role) && !selectedTenant) {
        setEmployees([]);
        return;
      }

      const currentUser = contextUser;
      const isSystemAdminFlag = isSystemAdmin(currentUser.role);
      const isAdminFlag = isAdmin(currentUser.role);
      const isNetworkAdminFlag = isNetworkAdmin(currentUser.role);
      const isHRAdminFlag = isHRAdmin(currentUser.role);

      let tenantIdForEmployees: string | undefined =
        selectedTenant || undefined;

      if (
        !isSystemAdminFlag &&
        (isAdminFlag || isNetworkAdminFlag || isHRAdminFlag)
      ) {
        const adminTenantId = getAdminTenantId(currentUser);
        if (adminTenantId) {
          tenantIdForEmployees = adminTenantId;
        }
      }
      const userIdMapByEmail = new Map<string, string>();
      const userIdMapByName = new Map<string, string>();

      if (isSystemAdminFlag) {
        const systemAttendanceResponse =
          await attendanceApi.getSystemAllAttendance();

        systemAttendanceResponse.tenants.forEach(tenant => {
          if (
            tenantIdForEmployees &&
            tenant.tenant_id !== tenantIdForEmployees
          ) {
            return;
          }

          if (tenant.tenant_status !== 'active') {
            return;
          }

          tenant.employees.forEach(emp => {
            if (emp.user_id && emp.first_name) {
              const fullName =
                `${emp.first_name} ${emp.last_name || ''}`.trim();

              if (emp.email) {
                userIdMapByEmail.set(emp.email.toLowerCase(), emp.user_id);
              }
              if (fullName) {
                userIdMapByName.set(fullName.toLowerCase(), emp.user_id);
              }
            }
          });
        });
      }

      const response = await systemEmployeeApiService.getSystemEmployees({
        tenantId: tenantIdForEmployees,
        page: null,
      });

      const employeesData = Array.isArray(response)
        ? response
        : 'items' in response && Array.isArray(response.items)
          ? response.items
          : [];

      const employeeOptions = employeesData
        .map((emp: unknown) => {
          const empObj = (emp as Record<string, unknown>) || {};
          let employeeName = 'Unknown';
          let employeeEmail = String(empObj.email || '').toLowerCase();

          const userObj = (empObj.user as Record<string, unknown>) || {};
          const userFirstName = String(
            userObj.first_name || empObj.first_name || ''
          );
          const userLastName = String(
            userObj.last_name || empObj.last_name || ''
          );
          const userEmail = String(
            userObj.email || empObj.email || ''
          ).toLowerCase();

          if (userFirstName) {
            employeeName =
              `${userFirstName}${userLastName ? ` ${userLastName}` : ''}`.trim();
          } else if (empObj.firstName && empObj.lastName) {
            employeeName =
              `${String(empObj.firstName)} ${String(empObj.lastName)}`.trim();
          } else if (empObj.name) {
            employeeName = String(empObj.name);
          } else if (userEmail) {
            employeeName = userEmail;
          }

          employeeEmail = userEmail || employeeEmail;

          let employeeUserId: string | undefined;

          if (userObj.id) {
            employeeUserId = String(userObj.id);
          } else if (employeeEmail && userIdMapByEmail.has(employeeEmail)) {
            employeeUserId = userIdMapByEmail.get(employeeEmail);
          } else if (
            employeeName &&
            userIdMapByName.has(employeeName.toLowerCase())
          ) {
            employeeUserId = userIdMapByName.get(employeeName.toLowerCase());
          } else if (empObj.user_id) {
            employeeUserId = String(empObj.user_id);
          } else if (empObj.id) {
            employeeUserId = String(empObj.id);
          }

          return {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- employeeUserId is non-null: events without user_id are filtered above
            id: employeeUserId!,
            name: employeeName,
          };
        })
        .filter(emp => emp.id && emp.name !== 'Unknown');
      setEmployees(employeeOptions);
    } catch (error) {
      setEmployees([]);
      showError(error);
    }
  };

  const getAdminTenantId = (currentUser: unknown): string | undefined => {
    const userObj = (currentUser as Record<string, unknown>) ?? {};
    const tenantId = userObj?.tenant_id ?? userObj?.tenant;
    if (tenantId) return String(tenantId).trim();
    const storedTenantId = localStorage.getItem('tenant_id');
    return storedTenantId ? storedTenantId.trim() : undefined;
  };

  const fetchAttendance = async (
    view?: 'my' | 'all',
    selectedUserId?: string,
    startDateOverride?: string,
    endDateOverride?: string
  ) => {
    setLoading(true);
    try {
      if (!contextUser) {
        setLoading(false);
        return;
      }

      const currentUser = contextUser;
      const roleName =
        ((currentUser as Record<string, unknown>).role instanceof Object
          ? (
              (currentUser as Record<string, unknown>).role as Record<
                string,
                unknown
              >
            )?.name
          : (currentUser.role ?? '')
        )?.toString() ?? '';
      setUserRole(roleName);
      const isManagerFlag = checkIsManager(currentUser.role);
      const isAdminFlag = isAdmin(currentUser.role);
      const isSystemAdminFlag = isSystemAdmin(currentUser.role);
      const isNetworkAdminFlag = isNetworkAdmin(currentUser.role);
      const isHRAdminFlag = isHRAdmin(currentUser.role);
      setIsManager(isManagerFlag);
      setIsAdminUser(isAdminFlag);
      setIsSystemAdminUser(isSystemAdminFlag);
      setIsNetworkAdminUser(isNetworkAdminFlag);
      setIsHRAdminUser(isHRAdminFlag);

      const adminTenantId =
        !isSystemAdminFlag &&
        (isAdminFlag || isNetworkAdminFlag || isHRAdminFlag)
          ? getAdminTenantId(currentUser)
          : undefined;

      let response: AttendanceResponse;

      const effectiveView: 'my' | 'all' = view ?? adminView;
      const effectiveSelectedEmployee = selectedUserId ?? selectedEmployee;
      const effectiveStartDate = startDateOverride ?? startDate;
      const effectiveEndDate = endDateOverride ?? endDate;
      let rows: AttendanceRecord[] = [];

      // Determine if user can view all attendance based on current local flags
      // We cannot rely on component state `canViewAllAttendance` here because
      // state updates are async and might not have happened yet on initial load.
      const canViewAllLocal =
        isSystemAdminFlag || isAdminFlag || isNetworkAdminFlag || isHRAdminFlag;

      if (isSystemAdminFlag && effectiveView === 'all') {
        const systemData = await attendanceApi.getSystemAllAttendance(
          effectiveStartDate || undefined,
          effectiveEndDate || undefined
        );
        rows = buildFromSystemAll(
          systemData,
          selectedTenant || null,
          effectiveSelectedEmployee || null
        );
      } else {
        if (canViewAllLocal && effectiveView === 'all') {
          const tenantIdForFetch = isSystemAdminFlag
            ? selectedTenant || undefined
            : adminTenantId || selectedTenant || undefined;

          if (effectiveSelectedEmployee) {
            // When a specific employee is selected in All Attendance view,
            // apply the selected date range as well so that both filters work together.
            const employeeStart =
              effectiveStartDate && effectiveStartDate !== ''
                ? effectiveStartDate
                : undefined;
            const employeeEnd =
              effectiveEndDate && effectiveEndDate !== ''
                ? effectiveEndDate
                : undefined;

            response = await attendanceApi.getAttendanceEvents(
              effectiveSelectedEmployee,
              1,
              employeeStart,
              employeeEnd,
              tenantIdForFetch
            );
          } else {
            response = await attendanceApi.getAllAttendance(
              1,
              effectiveStartDate || undefined,
              effectiveEndDate || undefined,
              undefined,
              tenantIdForFetch
            );
          }
        } else {
          let myStartDate = effectiveStartDate;
          let myEndDate = effectiveEndDate;

          if (!myStartDate || !myEndDate) {
            const today = new Date();
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(today.getFullYear() - 1);

            myStartDate = myStartDate || formatLocalYMD(oneYearAgo);
            myEndDate = myEndDate || formatLocalYMD(today);
          }

          response = await attendanceApi.getAttendanceEvents(
            currentUser.id,
            1,
            myStartDate,
            myEndDate,
            selectedTenant || undefined
          );
        }

        const events: AttendanceEvent[] =
          (response.items as AttendanceEvent[]) || [];

        if (events.length > 0) {
          console.warn(
            'Sample events with user_id:',
            events.slice(0, 3).map(ev => ({
              id: ev.id,
              user_id: ev.user_id,
              user: ev.user,
              type: ev.type,
              timestamp: ev.timestamp,
            }))
          );
        }
        const isShiftBased =
          events.length > 0 &&
          hasDateField(events[0]) &&
          hasCheckInField(events[0]);

        if (isShiftBased) {
          const userIdForBuild = effectiveSelectedEmployee || currentUser.id;
          rows = buildFromSummaries(events as unknown[], userIdForBuild);
        } else {
          const userIdForBuild = effectiveSelectedEmployee || currentUser.id;
          const isAllAttendanceView =
            canViewAllLocal &&
            effectiveView === 'all' &&
            !effectiveSelectedEmployee;

          rows = buildFromEvents(events, userIdForBuild, isAllAttendanceView);
        }
      }

      // Debug: log first few built rows to verify approvalStatus comes from API
      try {
        console.warn(
          'Attendance rows sample (approvalStatus):',
          rows
            .slice(0, 5)
            .map(r => ({ id: r.id, approvalStatus: r.approvalStatus }))
        );
      } catch {
        // ignore
      }

      setAttendanceData(rows);

      const isSystemAdminWithTenant =
        isSystemAdminFlag && (selectedTenant || '').trim() !== '';
      if (
        canViewAllLocal &&
        effectiveView === 'all' &&
        !effectiveSelectedEmployee &&
        !isSystemAdminWithTenant
      ) {
        const employeesFromAttendance = new Map<
          string,
          { id: string; name: string }
        >();

        rows.forEach(record => {
          if (record.userId && record.user) {
            const userId = String(record.userId).trim();
            const firstName = record.user.first_name || '';
            const lastName = record.user.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';

            if (!employeesFromAttendance.has(userId)) {
              employeesFromAttendance.set(userId, {
                id: userId,
                name: fullName,
              });
            }
          }
        });

        const extractedEmployees = Array.from(employeesFromAttendance.values());

        if (extractedEmployees.length > 0) {
          setEmployees(extractedEmployees);
        }
      }
      let filteredRows = rows;
      if (effectiveSelectedEmployee) {
        filteredRows = rows.filter(record => {
          const recordUserId = String(record.userId || '').trim();
          const selectedUserId = String(effectiveSelectedEmployee || '').trim();
          const matches = recordUserId === selectedUserId;

          return matches;
        });
      }

      setFilteredData(filteredRows);

      // For system admin "all" view, use client-side pagination to avoid rendering too many rows
      const useSystemAdminPagination =
        isSystemAdminFlag &&
        effectiveView === 'all' &&
        filteredRows.length > ATTENDANCE_PAGE_SIZE;
      if (useSystemAdminPagination) {
        setCurrentPage(1);
        setTotalPages(Math.ceil(filteredRows.length / ATTENDANCE_PAGE_SIZE));
        setTotalItems(filteredRows.length);
      } else {
        setCurrentPage(1);
        setTotalPages(1);
        setTotalItems(filteredRows.length);
      }
    } catch (error) {
      setAttendanceData([]);
      setFilteredData([]);
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  // Keep a stable ref to fetchAttendance so effects can call it without
  // being forced to include the function reference in dependency arrays.
  const fetchAttendanceRef = useRef<typeof fetchAttendance | null>(null);
  fetchAttendanceRef.current = fetchAttendance;
  const hasInitializedViewRef = useRef(false);

  // Refresh attendance when manager approves/disapproves in Team view
  useEffect(() => {
    const handler = () => {
      if (tab === 1) {
        // Team tab: refresh team attendance
        fetchTeamAttendance(
          1,
          teamStartDate || undefined,
          teamEndDate || undefined
        );
      } else {
        // My or All view: refresh current adminView
        const view = adminView === 'all' ? 'all' : 'my';
        fetchAttendanceRef.current?.(
          view,
          view === 'all' ? selectedEmployee || undefined : undefined,
          startDate || undefined,
          endDate || undefined
        );
      }
    };

    window.addEventListener(
      'hrms:attendance-updated',
      handler as EventListener
    );
    return () => {
      window.removeEventListener(
        'hrms:attendance-updated',
        handler as EventListener
      );
    };
    // include relevant state so handler uses latest filters
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchTeamAttendance is a ref-based callback, intentionally excluded
  }, [
    tab,
    adminView,
    selectedEmployee,
    startDate,
    endDate,
    teamStartDate,
    teamEndDate,
  ]);

  const handleDateNavigationChange = (newDate: string) => {
    setCurrentNavigationDate(newDate);
    if (newDate === 'all') {
      fetchAttendance('all', selectedEmployee, '', '');
    } else {
      fetchAttendanceByDate(newDate, 'all');
    }
  };
  const handleMyAttendanceDateNavigationChange = (newDate: string) => {
    setMyAttendanceNavigationDate(newDate);
    if (newDate === 'all') {
      fetchAttendance('my', undefined, '', '');
    } else {
      fetchAttendanceByDate(newDate, 'my');
    }
  };

  const handleTeamDateNavigationChange = (newDate: string) => {
    setTeamCurrentNavigationDate(newDate);
    if (newDate === 'all') {
      // Show all team records or only selected employee records (no date filter)
      if (selectedTeamEmployee) {
        // No date filter, just selected employee
        handleTeamEmployeeChange(selectedTeamEmployee, '', '');
      } else {
        fetchTeamAttendance(1);
      }
    } else {
      // Fetch attendance for specific date
      if (selectedTeamEmployee) {
        // Apply date filter + selected employee together
        handleTeamEmployeeChange(selectedTeamEmployee, newDate, newDate);
      } else {
        // No employee selected -> fetch full team attendance for that date
        fetchAttendanceByDate(newDate, 'team');
      }
    }
  };

  // Handle admin view change - separate buttons
  const handleMyAttendance = () => {
    setAdminView('my');
    setCurrentPage(1);
    setSelectedEmployee('');
    setStartDate('');
    setEndDate('');
    // Reset to show all records for date navigation
    setMyAttendanceNavigationDate('all');

    // Fetch attendance - will show only the current user's attendance
    fetchAttendance('my', undefined, '', '');

    // Clear employees list for "My Attendance" since it only shows user's own attendance
    setEmployees([]);
  };

  const handleAllAttendance = async () => {
    setAdminView('all');
    setCurrentPage(1);
    setSelectedEmployee('');
    setSelectedTenant('');
    setStartDate('');
    setEndDate('');
    const todayStr = formatLocalYMD(new Date());
    setCurrentNavigationDate(todayStr);
    fetchAttendanceByDate(todayStr, 'all');

    if (contextUser && isSystemAdmin(contextUser.role)) {
      fetchTenantsFromSystemAttendance();
    }

    // Employees will be automatically extracted from attendance data in fetchAttendance
  };
  const fetchTenantsFromSystemAttendance = async () => {
    try {
      setTenantsLoading(true);

      // Use the same API as Employee List to get all tenants
      const allTenants = await systemEmployeeApiService.getAllTenants(true);

      console.warn('Fetched tenants from API:', allTenants);

      // Use tenants directly like Employee List does - map to the expected format
      const tenantOptions = (allTenants || [])
        .map((t: Record<string, unknown>) => ({
          id: (t.id || t.tenant_id || '') as string,
          name: (t.name || t.tenant_name || '') as string,
        }))
        .filter((t: { id: string; name: string }) => t.id && t.name); // Only keep tenants with valid id and name

      console.warn('Mapped tenant options:', tenantOptions);
      setTenants(tenantOptions);
      console.warn(' Set tenants in dropdown:', {
        count: tenantOptions.length,
        tenants: tenantOptions.map(t => t.name),
      });

      const excludedTenants = allTenants.filter((tUnknown: unknown) => {
        const t = (tUnknown as Record<string, unknown>) || {};
        const statusLower = String(t.status || '')
          .toLowerCase()
          .trim();
        const isActive = statusLower === 'active';
        const isNotDeleted =
          !t.isDeleted && !t.deleted_at && statusLower !== 'deleted';
        const isNotSuspended = statusLower !== 'suspended';
        return !(isActive && isNotDeleted && isNotSuspended);
      });

      if (excludedTenants.length > 0) {
        console.warn(
          ' Excluded tenants:',
          excludedTenants.map((tUnknown: unknown) => {
            const t = (tUnknown as Record<string, unknown>) || {};
            return {
              name: t.name,
              status: t.status,
              isDeleted: t.isDeleted,
              deleted_at: t.deleted_at,
            };
          })
        );
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
      setTenants([]);
      showError(error);
    } finally {
      setTenantsLoading(false);
    }
  };

  const _fetchEmployeesFromSystemAttendance = async (_tenantId?: string) => {
    try {
      const response = await attendanceApi.getSystemAllAttendance();
      const uniqueEmployees = new Map<string, { id: string; name: string }>();

      response.tenants.forEach(tenant => {
        if (_tenantId && tenant.tenant_id !== _tenantId) return;

        tenant.employees.forEach(emp => {
          if (emp.user_id && emp.first_name) {
            const employeeId = emp.user_id;
            const employeeName =
              emp.first_name + (emp.last_name ? ` ${emp.last_name}` : '');
            if (!uniqueEmployees.has(employeeId)) {
              uniqueEmployees.set(employeeId, {
                id: employeeId,
                name: employeeName,
              });
            }
          }
        });
      });

      setEmployees(Array.from(uniqueEmployees.values()));
    } catch (error) {
      setEmployees([]);
      showError(error);
    }
  };

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenant(tenantId);
    setSelectedEmployee('');
    if (!tenantId) {
      setEmployees([]);
    }
    setCurrentPage(1);
  };

  const handleManagerMyAttendance = () => {
    setManagerView('my');
    setCurrentPage(1);
    setStartDate('');
    setEndDate('');
    const todayStr = formatLocalYMD(new Date());
    setMyAttendanceNavigationDate(todayStr);
    fetchAttendanceByDate(todayStr, 'my');
  };

  const handleManagerTeamAttendance = () => {
    setManagerView('team');
    setTeamCurrentPage(1);
    const todayStr = formatLocalYMD(new Date());
    setTeamCurrentNavigationDate(todayStr);
    setTeamStartDate('');
    setTeamEndDate('');
    fetchAttendanceByDate(todayStr, 'team');
  };
  // Sync role flags from context user and set initial attendance view once.
  // Computes role booleans once per contextUser change and reuses them for
  // both setState calls and the initial view decision — avoids redundant checks.
  useEffect(() => {
    if (!contextUser) return;

    const isAdminRole = isAdmin(contextUser.role);
    const isSystemAdminRole = isSystemAdmin(contextUser.role);
    const isNetworkAdminRole = isNetworkAdmin(contextUser.role);
    const isHRAdminRole = isHRAdmin(contextUser.role);

    setUserRole((contextUser.role ?? '').toString());
    setIsManager(checkIsManager(contextUser.role));
    setIsAdminUser(isAdminRole);
    setIsSystemAdminUser(isSystemAdminRole);
    setIsNetworkAdminUser(isNetworkAdminRole);
    setIsHRAdminUser(isHRAdminRole);

    if (!hasInitializedViewRef.current) {
      hasInitializedViewRef.current = true;
      const todayStr = formatLocalYMD(new Date());
      if (isSystemAdminRole || isAdminRole || isHRAdminRole) {
        setAdminView('all');
        setCurrentNavigationDate(todayStr);
        fetchAttendanceByDate(todayStr, 'all');
      } else {
        setMyAttendanceNavigationDate(todayStr);
        fetchAttendanceByDate(todayStr, 'my');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextUser]);

  // Load tenants when system admin switches to "All Attendance" view
  useEffect(() => {
    if (adminView !== 'all' || !isSystemAdminUser) return;
    if (tenants.length === 0 && !tenantsLoading) {
      fetchTenantsFromSystemAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminView, isSystemAdminUser]);

  useEffect(() => {
    if (adminView === 'all' && isSystemAdminUser) {
      if (!startDate && !endDate) {
        const todayStr = formatLocalYMD(new Date());
        setCurrentNavigationDate(todayStr);
        fetchAttendanceByDate(todayStr, 'all');
      } else {
        fetchAttendanceRef.current?.('all', undefined, startDate, endDate);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchAttendanceByDate is a stable callback ref, intentionally excluded
  }, [selectedTenant, adminView, isSystemAdminUser, startDate, endDate]);

  useEffect(() => {
    if (adminView === 'all' && isSystemAdminUser && selectedTenant) {
      _fetchEmployeesFromAttendance('all');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- _fetchEmployeesFromAttendance is stable, intentionally excluded
  }, [selectedTenant, adminView, isSystemAdminUser]);

  useEffect(() => {
    if (attendanceData.length > 0 && adminView === 'all') {
      if (selectedEmployee) {
        const filtered = attendanceData.filter(record => {
          const recordUserId = String(record.userId || '').trim();
          const selectedUserId = String(selectedEmployee || '').trim();
          const matches = recordUserId === selectedUserId;

          return matches;
        });
        setFilteredData(filtered);
      } else {
        setFilteredData(attendanceData);
      }
    } else if (attendanceData.length > 0) {
      setFilteredData(attendanceData);
    }
  }, [attendanceData, selectedEmployee, adminView]);

  useEffect(() => {
    if (teamStartDate || teamEndDate) {
      return;
    }

    if (teamCurrentNavigationDate === 'all') {
      setFilteredTeamAttendance(teamAttendance);
    } else if (
      teamCurrentNavigationDate &&
      teamCurrentNavigationDate !== 'all'
    ) {
      const selectedDateStr = teamCurrentNavigationDate;

      if (teamAttendance.length === 0) {
        setFilteredTeamAttendance([]);
        return;
      }

      const filtered = teamAttendance
        .map((memberUnknown: unknown) => {
          const member =
            (memberUnknown as CheckInTeamMember) || ({} as CheckInTeamMember);
          const filteredAttendance =
            (member.attendance || []).filter((att: TeamAttendanceEntry) => {
              if (!att.date) return false;

              let attDateStr = '';

              if (
                typeof att.date === 'string' &&
                att.date.match(/^\d{4}-\d{2}-\d{2}$/)
              ) {
                attDateStr = att.date;
              } else if (
                typeof att.date === 'string' &&
                att.date.includes('T')
              ) {
                attDateStr = att.date.split('T')[0];
              } else {
                try {
                  const dateObj = new Date(att.date as string);
                  if (!isNaN(dateObj.getTime())) {
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(
                      2,
                      '0'
                    );
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    attDateStr = `${year}-${month}-${day}`;
                  }
                } catch {
                  attDateStr = String(att.date);
                }
              }

              return attDateStr === selectedDateStr;
            }) || [];
          return {
            ...member,
            attendance: filteredAttendance,
          };
        })
        .filter(
          (member: CheckInTeamMember) =>
            member.attendance && member.attendance.length > 0
        );

      setFilteredTeamAttendance(filtered);
    } else {
      setFilteredTeamAttendance(teamAttendance);
    }
  }, [teamAttendance, teamCurrentNavigationDate, teamStartDate, teamEndDate]);

  // Build unique team employee list whenever team attendance changes
  useEffect(() => {
    const unique = new Map<string, { id: string; name: string }>();
    teamAttendance.forEach(memberUnknown => {
      const member =
        (memberUnknown as CheckInTeamMember) || ({} as CheckInTeamMember);
      const id = member.user_id as string | undefined;
      if (!id) return;
      const firstName = member.first_name || member.user?.first_name || '';
      const lastName = member.last_name || member.user?.last_name || '';
      const name = `${firstName} ${lastName}`.trim() || 'Unknown';
      if (!unique.has(id)) {
        unique.set(id, { id, name });
      }
    });
    setTeamEmployees(Array.from(unique.values()));
  }, [teamAttendance]);

  // Handle team employee selection change (use events API by userId)
  const handleTeamEmployeeChange = async (
    value: string,
    startDateOverride?: string | null,
    endDateOverride?: string | null
  ) => {
    setSelectedTeamEmployee(value);

    // Resolve effective start/end dates (override > state)
    const resolvedStart =
      typeof startDateOverride !== 'undefined'
        ? startDateOverride || ''
        : teamStartDate;
    const resolvedEnd =
      typeof endDateOverride !== 'undefined'
        ? endDateOverride || ''
        : teamEndDate;

    const startForApi = resolvedStart || undefined;
    const endForApi = resolvedEnd || undefined;

    // If cleared, reload team data for current date range
    if (!value) {
      await fetchTeamAttendance(1, startForApi, endForApi);
      return;
    }

    setTeamLoading(true);
    try {
      const response = await attendanceApi.getAttendanceEvents(
        value,
        1,
        startForApi,
        endForApi
      );

      const events: AttendanceEvent[] =
        (response.items as AttendanceEvent[]) || [];

      const records = buildFromEvents(events, value, false);

      if (records.length === 0) {
        setFilteredTeamAttendance([]);
        return;
      }

      const first = records[0];
      const totalDaysWorked = records.length;
      const totalHoursWorked = records.reduce(
        (sum, r) => sum + (r.workedHours || 0),
        0
      );

      const member = {
        user_id: value,
        first_name: first.user?.first_name || '',
        last_name: first.user?.last_name || '',
        totalDaysWorked,
        totalHoursWorked,
        attendance: records.map(r => ({
          date: r.date,
          checkIn: r.checkInISO,
          checkOut: r.checkOutISO,
          workedHours: r.workedHours || 0,
        })),
      };

      setFilteredTeamAttendance([member as CheckInTeamMember]);
    } catch (error) {
      setFilteredTeamAttendance([]);
      showError(error);
    } finally {
      setTeamLoading(false);
    }
  };

  // Add this inside the AttendanceTable component
  const totalWorkedHours = useMemo(() => {
    // If in My/All Attendance tab (tab 0)
    if (tab === 0) {
      return filteredData.reduce(
        (acc, record) => acc + (record.workedHours || 0),
        0
      );
    }
    // If in Team Attendance tab (tab 1)
    else {
      return filteredTeamAttendance.reduce((acc, member) => {
        const memberHours =
          member.attendance?.reduce(
            (sum, att) => sum + (att.workedHours || 0),
            0
          ) || 0;
        return acc + memberHours;
      }, 0);
    }
  }, [filteredData, filteredTeamAttendance, tab]);

  // Handle filter changes - reset page to 1 and fetch new data
  const handleFilterChange = () => {
    setCurrentPage(1);
    setStartDate('');
    setEndDate('');
    setSelectedTenant('');
    setSelectedEmployee('');
    const todayStr = formatLocalYMD(new Date());
    if (canViewAllAttendance && adminView === 'all') {
      setCurrentNavigationDate(todayStr);
      fetchAttendanceByDate(todayStr, 'all');
    } else if (isManager && !isAdminLike) {
      setMyAttendanceNavigationDate(todayStr);
      fetchAttendanceByDate(todayStr, 'my');
    } else if (!canViewAllAttendance) {
      // Employee: current date only
      setMyAttendanceNavigationDate(todayStr);
      fetchAttendanceByDate(todayStr, 'my');
    } else {
      const viewForFetch = canViewAllAttendance ? adminView : 'my';
      fetchAttendance(viewForFetch, '', '', '');
    }
  };

  const handleEmployeeChange = (value: string) => {
    setSelectedEmployee(value);
    setCurrentPage(1);
    fetchAttendance('all', value, startDate, endDate);
  };
  const userRoleLc = (userRole || '').toLowerCase();
  const isAdminLike =
    userRoleLc === 'admin' ||
    userRoleLc === 'system_admin' ||
    userRoleLc === 'network_admin' ||
    userRoleLc === 'hr_admin';
  const canViewAllAttendance =
    isAdminUser || isSystemAdminUser || isNetworkAdminUser || isHRAdminUser;

  // For system admin "all" view, show only current page to avoid rendering thousands of rows
  const attendanceDataToRender =
    isSystemAdminUser &&
    adminView === 'all' &&
    totalItems > ATTENDANCE_PAGE_SIZE
      ? filteredData.slice(
          (currentPage - 1) * ATTENDANCE_PAGE_SIZE,
          currentPage * ATTENDANCE_PAGE_SIZE
        )
      : filteredData;

  return (
    <Box>
      <AppPageTitle>Attendance Management</AppPageTitle>
      {!isManager && !isAdminLike && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex' }}>
            {isManager && (
              <AppButton
                onClick={() => setTab(1)}
                variantType={tab === 1 ? 'primary' : 'secondary'}
                variant={tab === 1 ? 'contained' : 'outlined'}
                sx={{
                  borderBottom: tab === 1 ? 2 : 0,
                  borderColor: 'primary.main',
                  borderRadius: 0,
                }}
              >
                Team Attendance
              </AppButton>
            )}
          </Box>
        </Box>
      )}

      {((tab === 0 && !isManager && !isAdminLike) ||
        (isManager && !isAdminLike && managerView === 'my') ||
        (isAdminLike && (adminView === 'my' || adminView === 'all'))) && (
        <Paper sx={{ background: 'unset', boxShadow: 'none' }}>
          <Box
            sx={{
              mb: 3,
              mt: 3,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              alignItems: { xs: 'stretch', sm: 'flex-end' },
              justifyContent: 'space-between',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                alignItems: { xs: 'stretch', sm: 'center' },
                flex: 1,
                flexWrap: 'wrap',
              }}
            >
              {canViewAllAttendance && (
                <>
                  {!isSystemAdminUser && !isAdminUser && !isHRAdminUser && (
                    <AppButton
                      variant={adminView === 'my' ? 'contained' : 'outlined'}
                      variantType={adminView === 'my' ? 'primary' : 'secondary'}
                      onClick={handleMyAttendance}
                      sx={{
                        width: { xs: '100%', sm: '200px' },
                        minWidth: { xs: '100%', sm: '200px' },
                        maxWidth: { sm: '200px' },
                        boxSizing: 'border-box',
                        flexShrink: 0,
                        backgroundColor:
                          adminView === 'my' ? 'primary.dark' : undefined,
                        color:
                          adminView === 'my' ? 'common.white' : 'primary.dark',
                        borderColor: 'primary.dark',
                        '&:hover': {
                          backgroundColor:
                            adminView === 'my' ? 'primary.dark' : undefined,
                          borderColor: 'primary.dark',
                        },
                      }}
                    >
                      My Attendance
                    </AppButton>
                  )}
                  <AppButton
                    variant={adminView === 'all' ? 'contained' : 'outlined'}
                    variantType={adminView === 'all' ? 'primary' : 'secondary'}
                    onClick={handleAllAttendance}
                    sx={{
                      width: { xs: '100%', sm: '200px' },
                      minWidth: { xs: '100%', sm: '200px' },
                      maxWidth: { sm: '200px' },
                      boxSizing: 'border-box',
                      flexShrink: 0,
                    }}
                  >
                    All Attendance
                  </AppButton>
                </>
              )}

              {isManager && !isAdminLike && (
                <>
                  <AppButton
                    variant={managerView === 'my' ? 'contained' : 'outlined'}
                    variantType={managerView === 'my' ? 'primary' : 'secondary'}
                    onClick={handleManagerMyAttendance}
                    sx={{
                      width: { xs: '100%', sm: '200px' },
                      minWidth: { xs: '100%', sm: '200px' },
                      maxWidth: { sm: '200px' },
                      boxSizing: 'border-box',
                      flexShrink: 0,
                      backgroundColor:
                        managerView === 'my' ? 'primary.dark' : undefined,
                      color:
                        managerView === 'my' ? 'common.white' : 'primary.dark',
                      borderColor: 'primary.dark',
                      '&:hover': {
                        backgroundColor:
                          managerView === 'my' ? 'primary.dark' : undefined,
                        borderColor: 'primary.dark',
                      },
                    }}
                  >
                    My Attendance
                  </AppButton>
                  <AppButton
                    variant={
                      managerView === 'team' || managerView === 'checkin'
                        ? 'contained'
                        : 'outlined'
                    }
                    variantType={
                      managerView === 'team' || managerView === 'checkin'
                        ? 'primary'
                        : 'secondary'
                    }
                    onClick={handleManagerTeamAttendance}
                    sx={{
                      width: { xs: '100%', sm: '200px' },
                      minWidth: { xs: '100%', sm: '200px' },
                      maxWidth: { sm: '200px' },
                      boxSizing: 'border-box',
                      flexShrink: 0,
                    }}
                  >
                    Team Attendance
                  </AppButton>
                </>
              )}

              {adminView === 'all' && isSystemAdminUser && (
                <>
                  <AppDropdown
                    showLabel={false}
                    value={selectedTenant || ''}
                    onChange={(e: SelectChangeEvent<string | number>) =>
                      handleTenantChange(e.target.value as string)
                    }
                    options={[
                      { value: '', label: 'All Tenants' },
                      ...tenants.map(tenant => ({
                        value: tenant.id,
                        label: tenant.name,
                      })),
                    ]}
                    placeholder='SELECT TENANT'
                    disabled={tenantsLoading}
                    containerSx={{
                      minWidth: { xs: '100%', sm: 220 },
                      width: { xs: '100%', sm: 'auto' },
                    }}
                  />
                  <AppDropdown
                    showLabel={false}
                    value={selectedEmployee || ''}
                    onChange={(e: SelectChangeEvent<string | number>) =>
                      handleEmployeeChange(e.target.value as string)
                    }
                    options={[
                      { value: '', label: 'All Employees' },
                      ...employees.map(emp => ({
                        value: emp.id,
                        label: emp.name,
                      })),
                    ]}
                    placeholder='SELECT EMPLOYEE'
                    containerSx={{
                      width: { xs: '100%', sm: '200px' },
                      minWidth: { xs: '100%', sm: '200px' },
                      maxWidth: { sm: '200px' },
                      flexShrink: 0,
                      padding: 0,
                      margin: 0,
                      boxSizing: 'border-box',
                    }}
                  />
                </>
              )}
              <Box
                sx={{
                  width: { xs: '100%', sm: '200px' },
                  minWidth: { xs: '100%', sm: '200px' },
                  maxWidth: { sm: '200px' },
                  flexShrink: 0,
                }}
              >
                <DatePicker
                  range
                  numberOfMonths={2}
                  value={
                    startDate && endDate
                      ? [new Date(startDate), new Date(endDate)]
                      : startDate
                        ? [new Date(startDate)]
                        : []
                  }
                  onChange={dates => {
                    if (Array.isArray(dates) && dates.length === 2) {
                      const start = formatLocalYMD(dates[0].toDate());
                      const end = formatLocalYMD(dates[1].toDate());
                      setStartDate(start);
                      setEndDate(end);
                      setCurrentPage(1);
                      const view = canViewAllAttendance ? adminView : 'my';
                      const selectedId =
                        view === 'all' ? selectedEmployee : undefined;
                      fetchAttendance(view, selectedId, start, end);
                    } else if (Array.isArray(dates) && dates.length === 1) {
                      const start = formatLocalYMD(dates[0].toDate());
                      setStartDate(start);
                      setEndDate('');
                      setCurrentPage(1);
                      const view = canViewAllAttendance ? adminView : 'my';
                      const selectedId =
                        view === 'all' ? selectedEmployee : undefined;
                      fetchAttendance(view, selectedId, start, '');
                    } else {
                      setStartDate('');
                      setEndDate('');
                      setCurrentPage(1);
                      const view = canViewAllAttendance ? adminView : 'my';
                      const selectedId =
                        view === 'all' ? selectedEmployee : undefined;
                      fetchAttendance(view, selectedId, '', '');
                    }
                  }}
                  format='MM/DD/YYYY'
                  placeholder='START DATE - END DATE'
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '6.5px 14px',
                    border: `1px solid ${muiTheme.palette.primary.main}`,
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                  containerStyle={{
                    width: '100%',
                  }}
                  inputClass={`custom-date-picker-input ${mode === 'dark' ? 'theme-dark' : ''}`}
                  className={`custom-date-picker ${mode === 'dark' ? 'theme-dark' : ''}`}
                  editable={false}
                  showOtherDays={true}
                  onOpen={() => {
                    document.body.style.overflow = 'hidden';
                  }}
                  onClose={() => {
                    document.body.style.overflow = 'auto';
                  }}
                />
              </Box>

              <AppButton
                variant='outlined'
                variantType='secondary'
                onClick={handleFilterChange}
                sx={{
                  width: { xs: '100%', sm: '200px' },
                  minWidth: { xs: '100%', sm: '200px' },
                  maxWidth: { sm: '200px' },
                  borderRadius: '12px',
                  boxSizing: 'border-box',
                  flexShrink: 0,
                  color: 'primary.dark',
                  borderColor: 'primary.dark',
                  '&:hover': { borderColor: 'primary.dark' },
                }}
              >
                Clear Filters
              </AppButton>
              <AppButton
                variant='outlined'
                color='info'
                sx={{
                  pointerEvents: 'none', // Makes it look like a badge/tag rather than a clickable button
                  fontWeight: 'bold',
                  borderColor: 'info.main',
                }}
              >
                Total Hours: {totalWorkedHours.toFixed(2)}
              </AppButton>
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'flex-start', sm: 'flex-end' },
              }}
            >
              {/* Single CSV export button - behavior changes based on view and role */}
              <Tooltip
                title={
                  isSystemAdminUser && adminView === 'all'
                    ? 'Export System Attendance'
                    : isManager && !isAdminLike && managerView === 'team'
                      ? 'Export Team Attendance'
                      : 'Export My Attendance'
                }
              >
                <IconButton
                  color='primary'
                  onClick={() => {
                    // System Admin in "All Attendance" view → use /attendance/export/system
                    if (isSystemAdminUser && adminView === 'all') {
                      const params = buildExportFilters();
                      exportCSV(
                        '/attendance/export/system',
                        'attendance-system.csv',
                        token || '',
                        params
                      );
                    }
                    // Manager in "Team Attendance" view → use /attendance/export/team
                    else if (
                      isManager &&
                      !isAdminLike &&
                      managerView === 'team'
                    ) {
                      exportCSV(
                        '/attendance/export/team',
                        'attendance-team.csv',
                        token || '',
                        buildExportFilters()
                      );
                    }
                    // Manager in "My Attendance" view → use /attendance/export/self with startDate & endDate
                    else if (
                      isManager &&
                      !isAdminLike &&
                      managerView === 'my'
                    ) {
                      const selfParams: Record<string, string> = {};
                      if (startDate) selfParams.startDate = startDate;
                      if (endDate) selfParams.endDate = endDate;

                      exportCSV(
                        '/attendance/export/self',
                        'attendance-self.csv',
                        token || '',
                        selfParams
                      );
                    } else if (isAdminLike) {
                      const allParams: Record<string, string> = {};
                      if (startDate) allParams.startDate = startDate;
                      if (endDate) allParams.endDate = endDate;

                      exportCSV(
                        '/attendance/export/all',
                        'attendance-all.csv',
                        token || '',
                        allParams
                      );
                    }
                    // Everyone else (regular employees) → use /attendance/export/self with startDate & endDate
                    else {
                      const selfParams: Record<string, string> = {};
                      if (startDate) selfParams.startDate = startDate;
                      if (endDate) selfParams.endDate = endDate;

                      exportCSV(
                        '/attendance/export/self',
                        'attendance-self.csv',
                        token || '',
                        selfParams
                      );
                    }
                  }}
                  sx={{
                    backgroundColor: 'primary.main',
                    borderRadius: '6px',
                    padding: '6px',
                    color: 'common.white',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                    },
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
                {canViewAllAttendance && adminView === 'all' && (
                  <TableCell sx={{ fontWeight: 'bold' }}>Employee</TableCell>
                )}
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Check In</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Check Out</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Worked Hours</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      canViewAllAttendance && adminView === 'all' ? 6 : 5
                    }
                    align='center'
                  >
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : attendanceDataToRender.length > 0 ? (
                attendanceDataToRender.map(record => (
                  <TableRow key={record.id}>
                    {canViewAllAttendance && adminView === 'all' && (
                      <TableCell>
                        {record.user?.first_name} {record.user?.last_name}
                      </TableCell>
                    )}
                    <TableCell>
                      {record.checkInISO
                        ? formatDate(record.checkInISO.split('T')[0])
                        : '--'}
                    </TableCell>
                    <TableCell>{record.checkIn || '--'}</TableCell>
                    <TableCell>{record.checkOut || '--'}</TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {/* Use the formatter here */}
                        {formatWorkedHours(record.workedHours)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                      >
                        {/* Approval status chip */}
                        {record.approvalStatus === 'approved' ? (
                          <Chip
                            label='Approved'
                            color='success'
                            size='small'
                            sx={{ fontSize: '0.7rem', height: 24 }}
                          />
                        ) : (record.approvalStatus || '').toString() ===
                          'rejected' ? (
                          <Chip
                            label='Rejected'
                            color='error'
                            size='small'
                            sx={{ fontSize: '0.7rem', height: 24 }}
                          />
                        ) : (record.approvalStatus || '').toString() ===
                          'disapproved' ? (
                          <Chip
                            label='Disapproved'
                            color='error'
                            size='small'
                            sx={{ fontSize: '0.7rem', height: 24 }}
                          />
                        ) : record.checkInISO ? (
                          <Chip
                            label='Pending'
                            color='warning'
                            size='small'
                            sx={{ fontSize: '0.7rem', height: 24 }}
                          />
                        ) : (
                          <Chip
                            label='Absent'
                            color='default'
                            size='small'
                            sx={{ fontSize: '0.7rem', height: 24 }}
                          />
                        )}

                        {/* Near boundary indicator */}
                        {record.near_boundary && (
                          <Chip
                            label='Near Boundary'
                            size='small'
                            color='info'
                            sx={{ fontSize: '0.7rem', height: 24 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={
                      canViewAllAttendance && adminView === 'all' ? 6 : 5
                    }
                    align='center'
                  >
                    No attendance records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </AppTable>

          {isSystemAdminUser && adminView === 'all' && totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color='primary'
                showFirstButton
                showLastButton
              />
            </Box>
          )}

          {canViewAllAttendance && adminView === 'all' && (
            <DateNavigation
              currentDate={currentNavigationDate}
              onDateChange={handleDateNavigationChange}
              disabled={loading}
            />
          )}

          {(!canViewAllAttendance ||
            (canViewAllAttendance && adminView === 'my') ||
            (isManager && !isAdminLike && managerView === 'my')) && (
            <DateNavigation
              currentDate={myAttendanceNavigationDate}
              onDateChange={handleMyAttendanceDateNavigationChange}
              disabled={loading}
            />
          )}

          {totalItems > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Typography
                fontWeight={400}
                fontSize='16px'
                lineHeight='24px'
                letterSpacing='-1%'
                color='text.primary'
              >
                Showing all {totalItems} records
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {tab === 1 && !isManager && !isAdminLike && (
        <Paper sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography
              fontWeight={500}
              fontSize={{ xs: '20px', lg: '28px' }}
              lineHeight='36px'
              letterSpacing='-2%'
              color='text.primary'
            >
              Team Attendance
            </Typography>
          </Box>

          <Box
            sx={{
              mb: 3,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              alignItems: { xs: 'stretch', sm: 'center' },
              flexWrap: 'wrap',
            }}
          >
            <Box
              sx={{
                width: { xs: '100%', sm: '200px' },
                minWidth: { xs: '100%', sm: '200px' },
                maxWidth: { sm: '200px' },
                flexShrink: 0,
              }}
            >
              <DatePicker
                range
                numberOfMonths={2}
                value={
                  teamStartDate && teamEndDate
                    ? [new Date(teamStartDate), new Date(teamEndDate)]
                    : teamStartDate
                      ? [new Date(teamStartDate)]
                      : []
                }
                onChange={dates => {
                  if (dates && dates.length === 2) {
                    const start = dates[0]?.format('YYYY-MM-DD') || '';
                    const end = dates[1]?.format('YYYY-MM-DD') || '';
                    setTeamStartDate(start);
                    setTeamEndDate(end);
                    setTeamCurrentNavigationDate('all'); // Reset date navigation
                    if (selectedTeamEmployee) {
                      // Apply date range + selected employee together
                      handleTeamEmployeeChange(
                        selectedTeamEmployee,
                        start,
                        end
                      );
                    } else {
                      // No employee selected -> fetch full team attendance
                      fetchTeamAttendance(1, start, end);
                    }
                  } else if (dates && dates.length === 1) {
                    const start = dates[0]?.format('YYYY-MM-DD') || '';
                    setTeamStartDate(start);
                    setTeamEndDate('');
                    setTeamCurrentNavigationDate('all'); // Reset date navigation
                    if (selectedTeamEmployee) {
                      handleTeamEmployeeChange(selectedTeamEmployee, start, '');
                    } else {
                      fetchTeamAttendance(1, start, '');
                    }
                  } else {
                    setTeamStartDate('');
                    setTeamEndDate('');
                    setTeamCurrentNavigationDate('all'); // Reset date navigation
                    if (selectedTeamEmployee) {
                      // Clear date filter but keep selected employee
                      handleTeamEmployeeChange(selectedTeamEmployee, '', '');
                    } else {
                      fetchTeamAttendance(1);
                    }
                  }
                }}
                format='MM/DD/YYYY'
                placeholder='Start Date - End Date'
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '6.5px 14px',
                  border: `1px solid ${muiTheme.palette.primary.main}`,
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
                  outline: 'none',
                }}
                containerStyle={{
                  width: '100%',
                }}
                inputClass={`custom-date-picker-input ${mode === 'dark' ? 'theme-dark' : ''}`}
                className={`custom-date-picker ${mode === 'dark' ? 'theme-dark' : ''}`}
                editable={false}
                showOtherDays={true}
                onOpen={() => {
                  document.body.style.overflow = 'hidden';
                }}
                onClose={() => {
                  document.body.style.overflow = 'auto';
                }}
              />
            </Box>
            {/* Team Employee Filter - for team attendance (regular users) */}
            {teamEmployees.length > 0 && (
              <AppDropdown
                showLabel={false}
                label='Employee'
                value={selectedTeamEmployee || ''}
                onChange={(e: SelectChangeEvent<string | number>) =>
                  handleTeamEmployeeChange(e.target.value as string)
                }
                options={[
                  { value: '', label: 'All Employees' },
                  ...teamEmployees.map(emp => ({
                    value: emp.id,
                    label: emp.name,
                  })),
                ]}
                placeholder='SELECT EMPLOYEE'
                containerSx={{
                  width: '200px',
                  minWidth: '200px',
                  maxWidth: '200px',
                  flexShrink: 0,
                  padding: 0,
                  margin: 0,
                }}
              />
            )}
            <AppButton
              variant='outlined'
              variantType='secondary'
              onClick={() => {
                setTeamStartDate('');
                setTeamEndDate('');
                const todayStr = formatLocalYMD(new Date());
                setTeamCurrentNavigationDate(todayStr);
                setSelectedTeamEmployee('');
                fetchAttendanceByDate(todayStr, 'team');
              }}
              sx={{
                color: 'primary.dark',
                borderColor: 'primary.dark',
                '&:hover': { borderColor: 'primary.dark' },
              }}
            >
              Clear Filters
            </AppButton>
          </Box>

          <AppTable>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Check In</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Check Out</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Days Worked</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Hours Worked</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teamLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align='center'>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredTeamAttendance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align='center'>
                    No team attendance records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeamAttendance.flatMap((memberUnknown: unknown) => {
                  const member =
                    (memberUnknown as CheckInTeamMember) ||
                    ({} as CheckInTeamMember);
                  const attendanceList = member.attendance || [];
                  if (attendanceList.length > 0) {
                    return attendanceList.map(
                      (attendance: TeamAttendanceEntry, index: number) => (
                        <TableRow key={`${member.user_id}-${index}`}>
                          <TableCell>
                            {member.first_name} {member.last_name}
                          </TableCell>
                          <TableCell>
                            {attendance.date
                              ? formatDate(attendance.date)
                              : '--'}
                          </TableCell>
                          <TableCell>
                            {attendance.checkIn
                              ? new Date(
                                  attendance.checkIn
                                ).toLocaleTimeString()
                              : '--'}
                          </TableCell>
                          <TableCell>
                            {attendance.checkOut
                              ? new Date(
                                  attendance.checkOut
                                ).toLocaleTimeString()
                              : '--'}
                          </TableCell>
                          <TableCell>{member.totalDaysWorked}</TableCell>
                          <TableCell>{attendance.workedHours || 0}</TableCell>
                        </TableRow>
                      )
                    );
                  }

                  return [
                    <TableRow key={member.user_id}>
                      <TableCell>
                        {member.first_name} {member.last_name}
                      </TableCell>
                      <TableCell>--</TableCell>
                      <TableCell>--</TableCell>
                      <TableCell>--</TableCell>
                      <TableCell>{member.totalDaysWorked}</TableCell>
                      <TableCell>{member.totalHoursWorked}</TableCell>
                    </TableRow>,
                  ];
                })
              )}
            </TableBody>
          </AppTable>
          <DateNavigation
            currentDate={teamCurrentNavigationDate}
            onDateChange={handleTeamDateNavigationChange}
            disabled={teamLoading}
          />
        </Paper>
      )}

      {isManager && !isAdminLike && managerView === 'team' && (
        <Paper sx={{ background: 'unset !important', boxShadow: 'none' }}>
          <Box
            sx={{
              mb: 3,
              mt: 3,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              alignItems: { xs: 'stretch', sm: 'center' },
              flexWrap: 'wrap',
            }}
          >
            <AppButton
              variant={
                (managerView as string) === 'my' ? 'contained' : 'outlined'
              }
              variantType={
                (managerView as string) === 'my' ? 'primary' : 'secondary'
              }
              onClick={handleManagerMyAttendance}
              sx={{
                width: { xs: '100%', sm: '200px' },
                minWidth: { xs: '100%', sm: '200px' },
                maxWidth: { sm: '200px' },
                borderRadius: '12px',
                boxSizing: 'border-box',
                flexShrink: 0,
                color: 'primary.dark',
                borderColor: 'primary.dark',
                '&:hover': { borderColor: 'primary.dark' },
              }}
            >
              My Attendance
            </AppButton>
            <AppButton
              variant={managerView === 'team' ? 'contained' : 'outlined'}
              variantType={managerView === 'team' ? 'primary' : 'secondary'}
              onClick={handleManagerTeamAttendance}
              sx={{
                width: { xs: '100%', sm: '200px' },
                minWidth: { xs: '100%', sm: '200px' },
                maxWidth: { sm: '200px' },
                borderRadius: '12px',
                boxSizing: 'border-box',
                flexShrink: 0,
              }}
            >
              Team Attendance
            </AppButton>

            <Box
              sx={{
                width: { xs: '100%', sm: '200px' },
                minWidth: { xs: '100%', sm: '200px' },
                maxWidth: { sm: '200px' },
                flexShrink: 0,
              }}
            >
              <DatePicker
                range
                numberOfMonths={2}
                value={
                  teamStartDate && teamEndDate
                    ? [new Date(teamStartDate), new Date(teamEndDate)]
                    : teamStartDate
                      ? [new Date(teamStartDate)]
                      : []
                }
                onChange={dates => {
                  if (dates && dates.length === 2) {
                    const start = dates[0]?.format('YYYY-MM-DD') || '';
                    const end = dates[1]?.format('YYYY-MM-DD') || '';
                    setTeamStartDate(start);
                    setTeamEndDate(end);
                    setTeamCurrentNavigationDate('all'); // Reset date navigation
                    if (selectedTeamEmployee) {
                      // Apply date range + selected employee together
                      handleTeamEmployeeChange(
                        selectedTeamEmployee,
                        start,
                        end
                      );
                    } else {
                      fetchTeamAttendance(1, start, end);
                    }
                  } else if (dates && dates.length === 1) {
                    const start = dates[0]?.format('YYYY-MM-DD') || '';
                    setTeamStartDate(start);
                    setTeamEndDate('');
                    setTeamCurrentNavigationDate('all'); // Reset date navigation
                    if (selectedTeamEmployee) {
                      handleTeamEmployeeChange(selectedTeamEmployee, start, '');
                    } else {
                      fetchTeamAttendance(1, start, '');
                    }
                  } else {
                    setTeamStartDate('');
                    setTeamEndDate('');
                    setTeamCurrentNavigationDate('all'); // Reset date navigation
                    if (selectedTeamEmployee) {
                      // Clear date filter but keep selected employee
                      handleTeamEmployeeChange(selectedTeamEmployee, '', '');
                    } else {
                      fetchTeamAttendance(1);
                    }
                  }
                }}
                format='MM/DD/YYYY'
                placeholder='Start Date - End Date'
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '6.5px 14px',
                  border: `1px solid ${muiTheme.palette.primary.main}`,
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
                  outline: 'none',
                }}
                containerStyle={{
                  width: '100%',
                }}
                inputClass={`custom-date-picker-input ${mode === 'dark' ? 'theme-dark' : ''}`}
                className={`custom-date-picker ${mode === 'dark' ? 'theme-dark' : ''}`}
                editable={false}
                showOtherDays={true}
                onOpen={() => {
                  document.body.style.overflow = 'hidden';
                }}
                onClose={() => {
                  document.body.style.overflow = 'auto';
                }}
              />
            </Box>
            {/* Team Employee Filter - for manager team attendance */}
            {teamEmployees.length > 0 && (
              <AppDropdown
                showLabel={false}
                label='Employee'
                value={selectedTeamEmployee || ''}
                onChange={(e: SelectChangeEvent<string | number>) =>
                  handleTeamEmployeeChange(e.target.value as string)
                }
                options={[
                  { value: '', label: 'All Employees' },
                  ...teamEmployees.map(emp => ({
                    value: emp.id,
                    label: emp.name,
                  })),
                ]}
                placeholder='SELECT EMPLOYEE'
                containerSx={{
                  width: { xs: '100%', sm: '200px' },
                  minWidth: { xs: '100%', sm: '200px' },
                  maxWidth: { sm: '200px' },
                  flexShrink: 0,
                }}
              />
            )}
            <AppButton
              variant='contained'
              variantType='primary'
              onClick={() => {
                setManagerView('checkin');
              }}
              sx={{
                width: { xs: '100%', sm: '200px' },
                minWidth: { xs: '100%', sm: '200px' },
                maxWidth: { sm: '200px' },
                borderRadius: '12px',
                boxSizing: 'border-box',
                flexShrink: 0,
              }}
            >
              Team Check In
            </AppButton>
            <AppButton
              variant='outlined'
              variantType='secondary'
              onClick={() => {
                setTeamStartDate('');
                setTeamEndDate('');
                const todayStr = formatLocalYMD(new Date());
                setTeamCurrentNavigationDate(todayStr);
                setSelectedTeamEmployee('');
                fetchAttendanceByDate(todayStr, 'team');
              }}
              sx={{
                width: { xs: '100%', sm: '200px' },
                minWidth: { xs: '100%', sm: '200px' },
                maxWidth: { sm: '200px' },
                borderRadius: '12px',
                boxSizing: 'border-box',
                flexShrink: 0,
                color: 'primary.dark',
                borderColor: 'primary.dark',
                '&:hover': { borderColor: 'primary.dark' },
              }}
            >
              Clear Filters
            </AppButton>

            <Tooltip title='Export Team Attendance'>
              <IconButton
                color='primary'
                onClick={() => {
                  const params: Record<string, string> = {};
                  if (teamStartDate) params.startDate = teamStartDate;
                  if (teamEndDate) params.endDate = teamEndDate;

                  exportCSV(
                    '/attendance/export/team',
                    'attendance-team.csv',
                    token || '',
                    params
                  );
                }}
                sx={{
                  backgroundColor: 'primary.main',
                  borderRadius: '6px',
                  padding: '6px',
                  color: 'common.white',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  },
                }}
              >
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <AppTable>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Check In</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Check Out</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Hours Worked</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teamLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align='center'>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredTeamAttendance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align='center'>
                    No team attendance records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeamAttendance.flatMap((memberUnknown: unknown) => {
                  const member =
                    (memberUnknown as CheckInTeamMember) ||
                    ({} as CheckInTeamMember);
                  const attendanceList = member.attendance || [];
                  if (attendanceList.length > 0) {
                    return attendanceList.map(
                      (attendance: TeamAttendanceEntry, index: number) => (
                        <TableRow key={`${member.user_id}-${index}`}>
                          <TableCell>
                            {member.first_name} {member.last_name}
                          </TableCell>
                          <TableCell>
                            {attendance.date
                              ? formatDate(attendance.date)
                              : '--'}
                          </TableCell>
                          <TableCell>
                            {attendance.checkIn
                              ? new Date(
                                  attendance.checkIn
                                ).toLocaleTimeString()
                              : '--'}
                          </TableCell>
                          <TableCell>
                            {attendance.checkOut
                              ? new Date(
                                  attendance.checkOut
                                ).toLocaleTimeString()
                              : '--'}
                          </TableCell>
                          <TableCell>{attendance.workedHours || 0}</TableCell>
                        </TableRow>
                      )
                    );
                  }

                  return [
                    <TableRow key={member.user_id}>
                      <TableCell>
                        {member.first_name} {member.last_name}
                      </TableCell>
                      <TableCell>--</TableCell>
                      <TableCell>--</TableCell>
                      <TableCell>--</TableCell>
                      <TableCell>{member.totalHoursWorked}</TableCell>
                    </TableRow>,
                  ];
                })
              )}
            </TableBody>
          </AppTable>
          <DateNavigation
            currentDate={teamCurrentNavigationDate}
            onDateChange={handleTeamDateNavigationChange}
            disabled={teamLoading}
          />
          {(() => {
            const teamRecordCount = filteredTeamAttendance.reduce(
              (sum, m) =>
                sum + ((m as CheckInTeamMember).attendance?.length || 0),
              0
            );
            return teamRecordCount > 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Typography
                  fontWeight={400}
                  fontSize='16px'
                  lineHeight='24px'
                  letterSpacing='-1%'
                  color='text.primary'
                >
                  Showing all {teamRecordCount} records
                </Typography>
              </Box>
            ) : null;
          })()}
        </Paper>
      )}

      {isManager && !isAdminLike && managerView === 'checkin' && (
        <TeamCheckInView onBack={() => setManagerView('team')} />
      )}
      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
};

export default AttendanceTable;
