import React, { memo } from 'react';
import {
  Box,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  Typography,
  useTheme,
} from '@mui/material';
import AppTable from '../common/AppTable';
import ReplayIcon from '@mui/icons-material/Replay';
import { useOutletContext } from 'react-router-dom';
import type { AppOutletContext } from '../../types/outletContexts';
import { Icons } from '../../assets/icons';

interface Employee {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  departmentId: string;
  designationId: string;
  status?: string;
  cnic_number?: string;
  profile_picture?: string;
  cnic_picture?: string;
  cnic_back_picture?: string;
  department: {
    id: string;
    name: string;
    description: string;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  designation: {
    id: string;
    title: string;
    tenantId: string;
    departmentId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

interface EmployeeListProps {
  employees: Employee[];
  onDelete?: (id: string) => void;
  onEdit?: (employee: Employee) => void;
  onResendInvite?: (employee: Employee) => void;
  onView?: (employee: Employee) => void;
  loading?: boolean;
  departments?: Record<string, string>;
  designations?: Record<string, string>;
}

const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  onDelete,
  onEdit,
  onResendInvite,
  onView,
  loading,
  departments = {},
  designations = {},
}) => {
  const theme = useTheme();
  const direction = theme.direction;
  const { darkMode } = useOutletContext<AppOutletContext>();

  // Dark mode styles
  const textColor = theme.palette.text.primary;
  const secondaryTextColor = theme.palette.text.secondary;

  // Handle resend invite
  const handleResendInvite = (employee: Employee) => {
    if (onResendInvite) {
      onResendInvite(employee);
    }
  };

  return (
    <Box>
      <AppTable
        sx={{
          backgroundColor: 'transparent',
          '& .MuiTableBody-root .MuiTableRow-root .MuiTableCell-root': {
            whiteSpace: 'nowrap',
            px: { xs: 1, sm: 1.5, md: 1 }, // Reduced horizontal padding
            py: 1.5,
            backgroundColor: 'transparent',
          },
          '& .MuiTableHead-root .MuiTableRow-root .MuiTableCell-root': {
            whiteSpace: 'nowrap',
            px: { xs: 1, sm: 1.5, md: 1 }, // Reduced horizontal padding
            py: 1.5,
          },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell
              align={direction === 'rtl' ? 'right' : 'left'}
              sx={{ color: textColor, fontWeight: 'bold' }}
            >
              {direction === 'rtl' ? 'الاسم' : 'Name'}
            </TableCell>
            <TableCell
              align={direction === 'rtl' ? 'right' : 'left'}
              sx={{ color: textColor, fontWeight: 'bold' }}
            >
              {direction === 'rtl' ? 'البريد الإلكتروني' : 'Email'}
            </TableCell>
            <TableCell
              align={direction === 'rtl' ? 'right' : 'left'}
              sx={{ color: textColor, fontWeight: 'bold' }}
            >
              {direction === 'rtl' ? 'رقم الهاتف' : 'Phone'}
            </TableCell>
            <TableCell
              align={direction === 'rtl' ? 'right' : 'left'}
              sx={{ color: textColor, fontWeight: 'bold' }}
            >
              {direction === 'rtl' ? 'القسم' : 'Department'}
            </TableCell>
            <TableCell
              align={direction === 'rtl' ? 'right' : 'left'}
              sx={{ color: textColor, fontWeight: 'bold' }}
            >
              {direction === 'rtl' ? 'الوظيفة' : 'Designation'}
            </TableCell>
            <TableCell
              align={direction === 'rtl' ? 'right' : 'left'}
              sx={{
                color: textColor,
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
              }}
            >
              {direction === 'rtl' ? 'رقم الهوية' : 'CNIC Number'}
            </TableCell>
            <TableCell
              align={direction === 'rtl' ? 'right' : 'left'}
              sx={{ color: textColor, fontWeight: 'bold' }}
            >
              {direction === 'rtl' ? 'حالة الدعوة' : 'Invite Status'}
            </TableCell>
            {(onDelete || onEdit || onResendInvite || onView) && (
              <TableCell
                align='center'
                sx={{ color: textColor, fontWeight: 'bold', width: '120px' }}
              >
                {direction === 'rtl' ? 'إجراءات' : 'Actions'}
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell
                colSpan={onDelete || onEdit || onResendInvite || onView ? 8 : 7}
                align='center'
              >
                <Box display='flex' justifyContent='center' py={4}>
                  <CircularProgress />
                </Box>
              </TableCell>
            </TableRow>
          )}
          {!loading && employees.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={onDelete || onEdit || onResendInvite || onView ? 8 : 7}
                align='center'
              >
                <Box display='flex' justifyContent='center' py={4}>
                  <Typography variant='body1' color='textSecondary'>
                    {direction === 'rtl' ? 'لا توجد سجلات' : 'No record exists'}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
          {!loading &&
            employees.length > 0 &&
            employees.map(emp => (
              <TableRow
                key={emp.id}
                sx={{
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <TableCell sx={{ color: textColor }}>{emp.name}</TableCell>
                <TableCell sx={{ color: secondaryTextColor }}>
                  {emp.email}
                </TableCell>
                <TableCell sx={{ color: textColor }}>{emp.phone}</TableCell>
                <TableCell sx={{ color: textColor }}>
                  {emp.department?.name ||
                    departments[emp.departmentId] ||
                    emp.departmentId ||
                    '—'}
                </TableCell>
                <TableCell sx={{ color: textColor }}>
                  {emp.designation?.title ||
                    designations[emp.designationId] ||
                    emp.designationId ||
                    '—'}
                </TableCell>
                <TableCell sx={{ color: textColor, whiteSpace: 'nowrap' }}>
                  {emp.cnic_number || '—'}
                </TableCell>
                <TableCell sx={{ color: textColor }}>
                  {emp.status || 'N/A'}
                </TableCell>
                {(onDelete || onEdit || onResendInvite || onView) && (
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Box
                      display='flex'
                      justifyContent='center'
                      alignItems='center'
                      gap={1}
                    >
                      {onView && (
                        <Tooltip
                          title={
                            direction === 'rtl'
                              ? 'عرض التفاصيل'
                              : 'View Details'
                          }
                          placement='bottom'
                        >
                          <IconButton
                            onClick={() => onView(emp)}
                            disabled={loading}
                            aria-label={`View details for employee ${emp.name}`}
                            sx={{
                              '&:hover': {
                                backgroundColor: theme.palette.action.hover,
                              },
                            }}
                          >
                            <Box
                              component='img'
                              src={Icons.password}
                              alt=''
                              aria-hidden='true'
                              sx={{ width: 20, height: 20 }}
                            />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onResendInvite && (
                        <Tooltip
                          title={
                            direction === 'rtl'
                              ? 'إعادة إرسال الدعوة'
                              : 'Resend Invite'
                          }
                          placement='bottom'
                        >
                          <span>
                            <IconButton
                              sx={{
                                color: darkMode ? '#1976d2' : '#0288d1',
                                opacity:
                                  emp.status === 'Invite Expired' ? 1 : 0.5,
                              }}
                              onClick={() =>
                                emp.status === 'Invite Expired' &&
                                handleResendInvite(emp)
                              }
                              disabled={
                                loading || emp.status !== 'Invite Expired'
                              }
                              aria-label={`Resend invite to employee ${emp.name}`}
                            >
                              <ReplayIcon aria-hidden='true' />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      {onEdit && (
                        <Tooltip
                          title={
                            direction === 'rtl'
                              ? 'تعديل الموظف'
                              : 'Edit Employee'
                          }
                          placement='bottom'
                        >
                          <IconButton
                            onClick={() => onEdit(emp)}
                            disabled={loading}
                            aria-label={`Edit employee ${emp.name}`}
                            sx={{
                              '&:hover': {
                                backgroundColor: theme.palette.action.hover,
                              },
                            }}
                          >
                            <Box
                              component='img'
                              src={Icons.edit}
                              alt=''
                              aria-hidden='true'
                              sx={{ width: 20, height: 20 }}
                            />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onDelete && (
                        <Tooltip
                          title={
                            direction === 'rtl'
                              ? 'حذف الموظف'
                              : 'Delete Employee'
                          }
                          placement='bottom'
                        >
                          <IconButton
                            onClick={() => onDelete(emp.id)}
                            disabled={loading}
                            aria-label={`Delete employee ${emp.name}`}
                            sx={{
                              '&:hover': {
                                backgroundColor: theme.palette.action.hover,
                              },
                            }}
                          >
                            <Box
                              component='img'
                              src={Icons.delete}
                              alt=''
                              aria-hidden='true'
                              sx={{ width: 20, height: 20 }}
                            />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}
        </TableBody>
      </AppTable>
    </Box>
  );
};

export default memo(EmployeeList);
