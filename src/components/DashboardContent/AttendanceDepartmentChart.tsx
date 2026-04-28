import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  useTheme,
  CircularProgress,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import attendanceApi, { type AttendanceEvent } from '../../api/attendanceApi';
import employeeApi, { type BackendEmployee } from '../../api/employeeApi';
import {
  departmentApiService,
  type BackendDepartment,
} from '../../api/departmentApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import AppDropdown from '../common/AppDropdown';
import { useLanguage } from '../../hooks/useLanguage';
import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';
import AppTable from '../common/AppTable';

interface AttendanceChartItem {
  id?: string;
  name: string;
  presents: number;
  absents: number;
  leaves: number;
  departmentId?: string;
  departmentName?: string;
}

const AttendanceDepartmentChart: React.FC = () => {
  const theme = useTheme();
  const { language } = useLanguage();
  const { showError } = useErrorHandler();

  const [chartData, setChartData] = useState<AttendanceChartItem[]>([]);
  const [departments, setDepartments] = useState<BackendDepartment[]>([]);

  const [loading, setLoading] = useState(true);

  const [selectedDeptId, setSelectedDeptId] = useState('all');

  const [dataCache, setDataCache] = useState<{
    events: AttendanceEvent[];
    emps: BackendEmployee[];
    depts: BackendDepartment[];
  } | null>(null);

  const getTenantId = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return user.tenant_id || user.tenant || null;
    } catch {
      return null;
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const processAttendanceData = (
    events: AttendanceEvent[],
    depts: BackendDepartment[],
    emps: BackendEmployee[],
    filterDeptId: string
  ) => {
    const userDeptMap = new Map<string, { id: string; name: string }>();
    const userNameMap = new Map<string, string>();

    emps.forEach(e => {
      if (e.user_id) {
        const dept = depts.find(d => d.id === e.departmentId);
        userDeptMap.set(e.user_id, {
          id: e.departmentId || 'unknown',
          name: dept ? dept.name : 'Unknown Department',
        });
        // Prefer full name
        const fullName =
          e.firstName && e.lastName ? `${e.firstName} ${e.lastName}` : e.name;
        userNameMap.set(e.user_id, fullName || 'Unknown User');
      }
    });

    const userPresents = new Map<string, Set<string>>();

    events.forEach(ev => {
      if (!ev.user_id) return;

      if (!userPresents.has(ev.user_id)) {
        userPresents.set(ev.user_id, new Set());
      }
      let dateStr = '';
      if (ev.timestamp) {
        dateStr = new Date(ev.timestamp).toISOString().split('T')[0];
      }
      if (dateStr) {
        userPresents.get(ev.user_id)?.add(dateStr);
      }
    });

    if (filterDeptId === 'all') {
      const deptStats = new Map<
        string,
        { presents: number; absents: number; count: number }
      >();

      depts.forEach(d => {
        deptStats.set(d.id, { presents: 0, absents: 0, count: 0 });
      });

      emps.forEach(emp => {
        const uId = emp.user_id;
        if (!uId) return;

        const deptInfo = userDeptMap.get(uId);
        if (!deptInfo) return;

        const daysPresent = userPresents.get(uId)?.size || 0;
        const daysAbsent = Math.max(0, 30 - daysPresent);

        if (!deptStats.has(deptInfo.id)) {
          deptStats.set(deptInfo.id, { presents: 0, absents: 0, count: 0 });
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guaranteed non-null: we just set it above with has() check
        const stat = deptStats.get(deptInfo.id)!;
        stat.presents += daysPresent;
        stat.absents += daysAbsent;
        stat.count++;
      });

      const data: AttendanceChartItem[] = [];
      deptStats.forEach((val, key) => {
        const dept = depts.find(d => d.id === key);
        if (dept) {
          data.push({
            id: dept.id,
            name: dept.name,
            departmentId: dept.id,
            departmentName: dept.name,
            presents: val.presents,
            absents: val.absents,
            leaves: 0,
          });
        }
      });
      setChartData(data);
    } else {
      const data: AttendanceChartItem[] = [];
      const targetEmps = emps.filter(e => e.departmentId === filterDeptId);

      targetEmps.forEach(emp => {
        if (!emp.user_id) return;
        const daysPresent = userPresents.get(emp.user_id)?.size || 0;
        const daysAbsent = Math.max(0, 30 - daysPresent);

        const fullName =
          emp.firstName && emp.lastName
            ? `${emp.firstName} ${emp.lastName}`
            : emp.name;
        const deptName = userDeptMap.get(emp.user_id)?.name || 'Unknown';

        data.push({
          id: emp.id,
          name: fullName || 'Unknown',
          departmentName: deptName,
          presents: daysPresent,
          absents: daysAbsent,
          leaves: 0,
          departmentId: filterDeptId,
        });
      });
      setChartData(data);
    }
  };

  useEffect(() => {
    if (dataCache) {
      processAttendanceData(
        dataCache.events,
        dataCache.depts,
        dataCache.emps,
        selectedDeptId
      );
    }
  }, [selectedDeptId, dataCache]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const tenantId = getTenantId();
        if (!tenantId) {
          setLoading(false);
          return;
        }

        const depts = await departmentApiService.getAllDepartments();

        const allEmps = await employeeApi.getAllEmployeesWithoutPagination();

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const startStr = formatDate(startDate);
        const endStr = formatDate(endDate);

        let page = 1;
        const allEvents: AttendanceEvent[] = [];
        let hasMore = true;
        const MAX_PAGES = 50;

        while (hasMore && page <= MAX_PAGES) {
          const res = await attendanceApi.getAllAttendance(
            page,
            startStr,
            endStr,
            undefined,
            tenantId
          );
          const items = Array.isArray(res.items)
            ? (res.items as AttendanceEvent[])
            : [];

          if (items.length === 0) {
            hasMore = false;
          } else {
            allEvents.push(...items);
            if (res.totalPages && page < res.totalPages) page++;
            else hasMore = false;
          }
        }

        setDataCache({ events: allEvents, emps: allEmps, depts: depts });
        setDepartments(depts);
      } catch (e) {
        showError(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departmentOptions = [
    {
      value: 'all',
      label: language === 'ar' ? 'كل الأقسام' : 'All Departments',
    },
    ...departments.map(d => ({
      value: d.id,
      label: d.name,
    })),
  ];

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' p={3}>
        <CircularProgress />
      </Box>
    );
  }

  const getTitle = () => {
    if (selectedDeptId === 'all')
      return language === 'ar'
        ? 'الحضور حسب القسم (آخر 30 يومًا)'
        : 'Attendance by Department (Last 30 Days)';
    const d = departments.find(x => x.id === selectedDeptId);
    return language === 'ar'
      ? `الحضور: ${d?.name || ''}`
      : `Attendance: ${d?.name || ''}`;
  };

  const isAllDept = selectedDeptId === 'all';

  return (
    <AppCard
      padding={3}
      sx={{
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography
          fontWeight={500}
          fontSize={{ xs: '20px', lg: '28px' }}
          sx={{ color: theme.palette.text.primary }}
        >
          {getTitle()}
        </Typography>

        <Box sx={{ minWidth: 200 }}>
          <AppDropdown
            label={language === 'ar' ? 'القسم' : 'Department'}
            value={selectedDeptId}
            onChange={e => setSelectedDeptId(e.target.value as string)}
            options={departmentOptions}
            showLabel={false}
            sx={{
              height: 40,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.divider,
              },
            }}
          />
        </Box>
      </Box>

      <AppTable sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <TableHead>
          <TableRow>
            <TableCell>
              {isAllDept
                ? language === 'ar'
                  ? 'القسم'
                  : 'Department'
                : language === 'ar'
                  ? 'اسم الموظف'
                  : 'Employee Name'}
            </TableCell>
            {!isAllDept && (
              <TableCell>
                {language === 'ar' ? 'القسم' : 'Department'}
              </TableCell>
            )}
            <TableCell align='center'>
              {language === 'ar' ? 'حاضر' : 'Present'}
            </TableCell>
            <TableCell align='center'>
              {language === 'ar' ? 'اجازة' : 'Leaves'}
            </TableCell>
            <TableCell align='center'>
              {language === 'ar' ? 'غائب' : 'Absent'}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {chartData.length > 0 ? (
            chartData.map((row, index) => (
              <TableRow
                key={index}
                hover
                onClick={() =>
                  isAllDept &&
                  row.departmentId &&
                  setSelectedDeptId(row.departmentId)
                }
                sx={{ cursor: isAllDept ? 'pointer' : 'default' }}
              >
                <TableCell>
                  {isAllDept ? (
                    <AppButton
                      variantType='ghost'
                      text={row.name}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (row.departmentId)
                          setSelectedDeptId(row.departmentId);
                      }}
                      sx={{
                        justifyContent: 'flex-start',
                        p: 0,
                        minHeight: 'auto',
                        fontSize: 'inherit',
                        boxShadow: 'none',
                        '&:hover': {
                          backgroundColor: 'transparent',
                          textDecoration: 'underline',
                          color: theme.palette.primary.main,
                        },
                      }}
                    />
                  ) : (
                    row.name
                  )}
                </TableCell>
                {!isAllDept && <TableCell>{row.departmentName}</TableCell>}
                <TableCell align='center'>{row.presents}</TableCell>
                <TableCell align='center'>{row.leaves}</TableCell>
                <TableCell align='center'>{row.absents}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={isAllDept ? 4 : 5} align='center'>
                <Typography color='textSecondary'>
                  {language === 'ar'
                    ? 'لا توجد بيانات حضور'
                    : 'No attendance data found'}
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </AppTable>
    </AppCard>
  );
};

export default AttendanceDepartmentChart;
