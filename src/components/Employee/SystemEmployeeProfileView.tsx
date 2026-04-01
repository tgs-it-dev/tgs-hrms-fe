import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Button,
  Stack,
  Divider,
  DialogActions,
  useTheme,
} from '@mui/material';
import { Work, Business, Email, Star, Close } from '@mui/icons-material';
import systemEmployeeApiService, {
  type EmployeeLeave,
  type EmployeeAsset,
  type SystemEmployeeDetails,
  type EmployeePerformance,
} from '../../api/systemEmployeeApi';
import { leaveApi, type LeaveType } from '../../api/leaveApi';
import UserAvatar from '../common/UserAvatar';
import KpiDetailCard from '../KPI/KPICardDetail';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AppTable from '../common/AppTable';

interface Props {
  open: boolean;
  onClose: () => void;
  employeeId: string | null;
}

const SystemEmployeeProfileView: React.FC<Props> = ({
  open,
  onClose,
  employeeId,
}) => {
  const theme = useTheme();
  const [profile, setProfile] = useState<SystemEmployeeDetails | null>(null);
  const [leaves, setLeaves] = useState<EmployeeLeave[]>([]);
  const [assets, setAssets] = useState<EmployeeAsset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKpi, setSelectedKpi] = useState<EmployeePerformance | null>(
    null
  );
  const [openKpiDialog, setOpenKpiDialog] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<Record<string, string>>({});

  // Fetch leave types when modal opens
  useEffect(() => {
    if (!open) {
      // Reset leave types when modal closes
      setLeaveTypes({});
      return;
    }

    const fetchLeaveTypes = async () => {
      try {
        const response = await leaveApi.getLeaveTypes({ page: 1, limit: 100 });
        // Create a map of leaveTypeId to leaveType name
        const leaveTypesMap: Record<string, string> = {};
        if (response.items && Array.isArray(response.items)) {
          response.items.forEach((leaveType: LeaveType) => {
            if (leaveType.id && leaveType.name) {
              leaveTypesMap[leaveType.id] = leaveType.name;
            }
          });
        }
        setLeaveTypes(leaveTypesMap);
      } catch {
        // Don't set error state, just log it - leave types are not critical
      }
    };

    fetchLeaveTypes();
  }, [open]);

  useEffect(() => {
    if (!employeeId || !open) return;

    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const profileRes =
          await systemEmployeeApiService.getSystemEmployeeById(employeeId);
        setProfile(profileRes);

        // Note: All system employee API endpoints (leaves, assets, performance) use employee ID, not user ID
        const [leavesRes, assetsRes, performanceRes] = await Promise.all([
          systemEmployeeApiService.getSystemEmployeeLeaves(employeeId),
          systemEmployeeApiService.getSystemEmployeeAssets(employeeId),
          systemEmployeeApiService.getSystemEmployeePerformance(employeeId),
        ]);

        setLeaves(leavesRes);
        setAssets(assetsRes);

        setProfile(prev => (prev ? { ...prev, kpis: performanceRes } : null));
      } catch (e: unknown) {
        setError((e as Error)?.message || 'Failed to load employee data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [employeeId, open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='md'
      scroll='paper'
      PaperProps={{
        sx: { borderRadius: 1, maxHeight: '90vh', overflowY: 'auto' },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pr: 2,
        }}
      >
        <Typography
          component='span'
          sx={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--primary-dark-color)',
          }}
        >
          Employee Profile
        </Typography>
        <IconButton onClick={onClose} size='small'>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading ? (
          <Box py={3} display='flex' justifyContent='center'>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box py={3}>
            <Alert severity='error'>{error}</Alert>
          </Box>
        ) : !profile ? (
          <Typography variant='body2' align='center' color='text.secondary'>
            No profile data available
          </Typography>
        ) : (
          <Box py={2} display='flex' flexDirection='column' gap={2}>
            <Paper
              elevation={1}
              sx={{ borderRadius: 3, p: 2, boxShadow: 'none' }}
            >
              <Box display='flex' alignItems='center'>
                <UserAvatar
                  user={{
                    id: profile.id,
                    first_name: profile.name.split(' ')[0] || '',
                    last_name: profile.name.split(' ').slice(1).join(' ') || '',
                    profile_pic: '',
                  }}
                  size={80}
                  sx={{ mr: 2 }}
                />
                <Box>
                  <Typography variant='h6' fontWeight={600}>
                    {profile.name}
                  </Typography>
                  <Chip
                    label={profile.designationTitle || '—'}
                    icon={<Work />}
                    sx={{ mr: 1, mb: 1 }}
                    color='secondary'
                  />
                  <Chip
                    label={profile.departmentName || '—'}
                    icon={<Business />}
                    sx={{ mb: 1 }}
                    color='info'
                  />
                  <Typography variant='body2' color='text.secondary' mt={1}>
                    <Email sx={{ fontSize: 16, mr: 0.5 }} />{' '}
                    {profile.email || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Paper
              elevation={1}
              sx={{ borderRadius: 3, p: 2, boxShadow: 'none' }}
            >
              <Typography
                variant='h6'
                fontWeight={600}
                gutterBottom
                color='var(--primary-dark-color)'
              >
                Leaves
              </Typography>
              <AppTable>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaves.length ? (
                    leaves.map((leave, idx) => {
                      // Get leave type name from API response (leaveType object) or fallback to mapping
                      const leaveTypeName =
                        leave.leaveType?.name ||
                        (leave.leaveTypeId && leaveTypes[leave.leaveTypeId]
                          ? leaveTypes[leave.leaveTypeId]
                          : null);

                      return (
                        <TableRow key={leave.id || idx}>
                          <TableCell>
                            {(leaveTypeName || leave.leaveTypeId || '—').replace(
                              /^./,
                              c => c.toUpperCase()
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(leave.startDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(leave.endDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{leave.reason || '—'}</TableCell>
                          <TableCell>
                            <Chip
                              label={leave.status}
                              size='small'
                              sx={{
                                bgcolor:
                                  leave.status.toLowerCase() === 'approved'
                                    ? 'success.main'
                                    : leave.status.toLowerCase() === 'pending'
                                      ? 'warning.main'
                                      : 'error.main',
                                color: '#fff',
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align='center'>
                        No leaves found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </AppTable>
            </Paper>

            <Paper
              elevation={1}
              sx={{ borderRadius: 3, p: 2, boxShadow: 'none' }}
            >
              <Typography
                variant='h6'
                fontWeight={600}
                gutterBottom
                color='var(--primary-dark-color)'
              >
                Assigned Assets
              </Typography>
              <AppTable>
                <TableHead>
                  <TableRow>
                    <TableCell>Asset Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assets.length ? (
                    assets.map((asset, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell>{asset.category}</TableCell>
                        <TableCell>
                          <Chip
                            label={asset.status}
                            size='small'
                            sx={{
                              bgcolor:
                                asset.status.toLowerCase() === 'assigned'
                                  ? 'success.main'
                                  : 'error.main',
                              color: '#fff',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align='center'>
                        No assets assigned
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </AppTable>
            </Paper>

            <Paper
              elevation={1}
              sx={{ borderRadius: 3, p: 2, boxShadow: 'none' }}
            >
              <Typography
                variant='h6'
                fontWeight={600}
                gutterBottom
                color='var(--primary-dark-color)'
              >
                KPIs Overview
              </Typography>

              {profile.kpis?.length ? (
                <Box
                  display='grid'
                  gridTemplateColumns={{
                    xs: '1fr',
                    sm: '1fr 1fr',
                    md: '1fr 1fr 1fr',
                  }}
                  gap={2}
                >
                  {profile.kpis.map((kpi, idx) => {
                    const achievedPercent =
                      kpi.targetValue && kpi.achievedValue
                        ? Math.min(
                            (kpi.achievedValue / kpi.targetValue) * 100,
                            100
                          )
                        : 0;

                    const stars = Math.round(kpi.score || 0);
                    const filledStars = Array(stars).fill('★').join('');
                    const emptyStars = Array(5 - stars)
                      .fill('☆')
                      .join('');

                    return (
                      <Paper
                        key={idx}
                        variant='outlined'
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          borderColor: 'orange.200',
                        }}
                      >
                        <Typography
                          variant='subtitle1'
                          fontWeight={600}
                          color='text.primary'
                          gutterBottom
                        >
                          {kpi.kpi?.title || 'Untitled KPI'}
                        </Typography>

                        <Typography
                          variant='body2'
                          color='text.secondary'
                          mb={0.5}
                        >
                          Target: {kpi.targetValue ?? '—'} | Achieved:{' '}
                          {kpi.achievedValue ?? '—'}
                        </Typography>

                        <Box
                          sx={{
                            height: 8,
                            borderRadius: 5,
                            backgroundColor: 'grey.300',
                            overflow: 'hidden',
                            mb: 1,
                          }}
                        >
                          <Box
                            sx={{
                              width: `${achievedPercent}%`,
                              height: '100%',
                              backgroundColor:
                                achievedPercent >= 90
                                  ? 'success.main'
                                  : achievedPercent >= 60
                                    ? 'warning.main'
                                    : 'error.main',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </Box>

                        <Stack
                          direction='row'
                          spacing={1}
                          flexWrap='wrap'
                          useFlexGap
                          mb={1}
                        >
                          <Chip
                            label={kpi.reviewCycle || 'No Cycle'}
                            color='primary'
                            size='small'
                            variant='outlined'
                          />
                          <Chip
                            label={kpi.kpi?.category || 'No Category'}
                            color='secondary'
                            size='small'
                            variant='outlined'
                          />
                          <Chip
                            label={kpi.kpi?.status || 'Unknown'}
                            color={
                              kpi.kpi?.status === 'active'
                                ? 'success'
                                : kpi.kpi?.status === 'inactive'
                                  ? 'default'
                                  : 'warning'
                            }
                            size='small'
                            variant='outlined'
                          />
                        </Stack>

                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            Score:
                            <span
                              style={{
                                color: theme.palette.warning.main,
                                fontSize: '1.2rem',
                              }}
                            >
                              {filledStars}
                            </span>
                            <span
                              style={{
                                color: theme.palette.text.disabled,
                                fontSize: '1.2rem',
                              }}
                            >
                              {emptyStars}
                            </span>
                          </Typography>

                          <Box
                            mt={1}
                            display='flex'
                            alignItems='center'
                            justifyContent='space-between'
                          >
                            <Button
                              variant='text'
                              size='small'
                              color='primary'
                              sx={{ color: 'var(--primary-dark-color)' }}
                              onClick={() => {
                                setSelectedKpi(kpi);
                                setOpenKpiDialog(true);
                              }}
                            >
                              <VisibilityIcon />
                            </Button>
                          </Box>
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              ) : (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  align='center'
                  mt={1}
                >
                  No KPI data available
                </Typography>
              )}

              <KpiDetailCard
                open={openKpiDialog}
                onClose={() => setOpenKpiDialog(false)}
                kpiData={selectedKpi}
              />
            </Paper>

            <Paper
              elevation={1}
              sx={{ borderRadius: 3, p: 2, boxShadow: 'none' }}
            >
              <Typography
                variant='h6'
                fontWeight={600}
                gutterBottom
                color='var(--primary-dark-color)'
              >
                Promotions
              </Typography>
              <AppTable>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(156,39,176,0.08)' }}>
                    <TableCell>Previous Designation</TableCell>
                    <TableCell>New Designation</TableCell>
                    <TableCell>Effective Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {profile.promotions?.length ? (
                    profile.promotions.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{p.previousDesignation}</TableCell>
                        <TableCell>{p.newDesignation}</TableCell>
                        <TableCell>
                          {new Date(p.effectiveDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={p.status}
                            size='small'
                            sx={{
                              bgcolor:
                                p.status.toLowerCase() === 'approved'
                                  ? 'success.main'
                                  : 'warning.main',
                              color: '#fff',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>{p.remarks || '—'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align='center'>
                        No promotion records
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </AppTable>
            </Paper>

            <Paper
              elevation={1}
              sx={{ borderRadius: 3, p: 2, boxShadow: 'none' }}
            >
              <Typography
                variant='h6'
                fontWeight={600}
                gutterBottom
                color='var(--primary-dark-color)'
              >
                Performance Reviews
              </Typography>
              <AppTable>
                <TableHead>
                  <TableRow>
                    <TableCell>Cycle</TableCell>
                    <TableCell>Overall Score</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Recommendation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {profile.performanceReviews?.length ? (
                    profile.performanceReviews.map((pr, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{pr.cycle}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${pr.overallScore ?? '—'} ★`}
                            icon={<Star />}
                            color='warning'
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={pr.status}
                            size='small'
                            sx={{
                              bgcolor:
                                pr.status.toLowerCase() === 'completed'
                                  ? 'success.main'
                                  : 'warning.main',
                              color: '#fff',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>{pr.recommendation || '—'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align='center'>
                        No performance reviews
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </AppTable>
            </Paper>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SystemEmployeeProfileView;
