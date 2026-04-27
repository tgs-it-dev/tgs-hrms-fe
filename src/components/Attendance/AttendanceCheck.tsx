import { useState, useEffect } from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import attendanceApi from '../../api/attendanceApi';
import MyTimeCard from '../TimerTracker/MyTimeCard';
import AppButton from '../common/AppButton';
import EmployeeGeofenceStatus from '../Geofencing/EmployeeGeofenceStatus';
import {
  isAdmin,
  isSystemAdmin,
  isNetworkAdmin,
  isHRAdmin,
} from '../../utils/roleUtils';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppPageTitle from '../common/AppPageTitle';
import { useUser } from '../../hooks/useUser';

type AttendanceStatus = 'Not Checked In' | 'Checked In' | 'Checked Out';

const AttendanceCheck = () => {
  const { user } = useUser();
  const [status, setStatus] = useState<AttendanceStatus>('Not Checked In');
  const [punchInTime, setPunchInTime] = useState<string | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { snackbar, showError, closeSnackbar } = useErrorHandler();
  const [attendanceRefreshToken, setAttendanceRefreshToken] = useState(0);
  const theme = useTheme();

  const isAdminUser = isAdmin(user?.role);
  const isSystemAdminUser = isSystemAdmin(user?.role);
  const isNetworkAdminUser = isNetworkAdmin(user?.role);
  const isHRAdminUser = isHRAdmin(user?.role);
  const userName = user?.first_name || 'User';

  const fetchToday = async () => {
    closeSnackbar();
    const userId = user?.id;
    if (!userId) {
      showError('User not found. Please log in again.');
      return;
    }
    try {
      const today = await attendanceApi.getTodaySummary(userId);
      if (today) {
        const checkInISO = today.checkIn ? new Date(today.checkIn) : null;
        const checkOutISO = today.checkOut ? new Date(today.checkOut) : null;
        const checkIn = checkInISO ? checkInISO.toLocaleTimeString() : null;
        const checkOut =
          checkInISO && checkOutISO && checkOutISO > checkInISO
            ? checkOutISO.toLocaleTimeString()
            : null;
        setPunchInTime(checkIn);
        setPunchOutTime(checkOut);
        if (checkIn && !checkOut) setStatus('Checked In');
        else if (checkOut) setStatus('Checked Out');
        else setStatus('Not Checked In');
      } else {
        setPunchInTime(null);
        setPunchOutTime(null);
        setStatus('Not Checked In');
      }
    } catch {
      showError("Failed to fetch today's attendance summary.");
    }
  };

  useEffect(() => {
    fetchToday();
    const timer = setInterval(
      () => setCurrentTime(new Date().toLocaleTimeString()),
      1000
    );
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Try to get position; on failure we still hit API so backend can return e.g. "Turn on Your Location"
  const tryGetPositionOnce = (): Promise<{ lat: number; lon: number } | null> =>
    new Promise(resolve => {
      if (!('geolocation' in navigator)) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos =>
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
      );
    });

  const tryGetPosition = async (): Promise<{ lat: number; lon: number } | null> => {
    const first = await tryGetPositionOnce();
    if (first) return first;
    await new Promise(r => setTimeout(r, 800));
    return tryGetPositionOnce();
  };

  const handleCheckIn = async () => {
    setLoading(true);
    closeSnackbar();

    try {
      const coords = await tryGetPosition();
      const payload: { type: string; latitude?: number; longitude?: number } = {
        type: 'CHECK_IN',
      };
      if (coords) {
        payload.latitude = coords.lat;
        payload.longitude = coords.lon;
      }

      await attendanceApi.createAttendance(payload);

      setPunchOutTime(null);
      setStatus('Checked In');
      await fetchToday();
      setAttendanceRefreshToken(prev => prev + 1);
    } catch (err: unknown) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    closeSnackbar();

    try {
      const coords = await tryGetPosition();
      const payload: { type: string; latitude?: number; longitude?: number } = {
        type: 'CHECK_OUT',
      };
      if (coords) {
        payload.latitude = coords.lat;
        payload.longitude = coords.lon;
      }

      await attendanceApi.createAttendance(payload);

      setStatus('Checked Out');
      await fetchToday();
      setAttendanceRefreshToken(prev => prev + 1);
    } catch (err: unknown) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header with Check In/Out Button */}
      <Box
        display='flex'
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        gap={{ xs: 2, sm: 0 }}
        mb={3}
        sx={{
          backgroundColor: 'background.paper',
          p: 2,
          borderRadius: 1,
        }}
      >
        <Box>
          <AppPageTitle>Attendance Management</AppPageTitle>
          <Typography
            fontWeight={400}
            fontSize={{ xs: '16px', lg: '16px' }}
            lineHeight='24px'
            letterSpacing='-1%'
            color={theme.palette.text.secondary}
            sx={{ mt: 1 }}
          >
            {isAdminUser ||
              isSystemAdminUser ||
              isNetworkAdminUser ||
              isHRAdminUser
              ? 'Admin - Track your daily attendance'
              : 'Track your daily attendance'}
          </Typography>
        </Box>

        {/* Single Check In / Check Out Button */}
        {status === 'Not Checked In' || status === 'Checked Out' ? (
          <AppButton
            variant='contained'
            variantType='primary'
            text={loading ? 'Checking In...' : 'Check In'} 
            onClick={handleCheckIn}
            loading={loading} 
            startIcon={!loading && 
            <LoginIcon />} 
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: 'auto', sm: 120, md: 140 },
            }}
          />
        ) : (
          <AppButton
            variant='contained'
            variantType='primary'
            text={loading ? 'Checking Out...' : 'Check Out'} 
            onClick={handleCheckOut}
            loading={loading} 
            startIcon={!loading && 
            <LogoutIcon />} 
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: 'auto', sm: 120, md: 140 },
            }}
          />
        )}
      </Box>

      <Box display='flex' flexDirection={{ xs: 'column', lg: 'row' }} gap={2}>
        {/* Attendance Status Card */}
        <Paper
          sx={{
            p: 3,
            borderRadius: 1,
            flex: 1,
            height: 'fit-content',
            boxShadow: 'unset',
          }}
        >
          <Typography
            fontWeight={500}
            fontSize={{ xs: '20px', lg: '28px' }}
            lineHeight='36px'
            letterSpacing='-2%'
            color={theme.palette.text.primary}
          >
            Good{' '}
            {new Date().getHours() < 12
              ? 'morning'
              : new Date().getHours() < 18
                ? 'afternoon'
                : 'evening'}
            , {userName}
          </Typography>
          <Typography
            fontWeight={500}
            fontSize='20px'
            lineHeight='28px'
            letterSpacing='-1%'
            color={theme.palette.text.secondary}
            mb={3}
            sx={{ fontFamily: 'monospace' }}
          >
            {currentTime}
          </Typography>

          <Box
            display='flex'
            flexDirection={{ xs: 'column', sm: 'row' }}
            gap={2}
          >
            <Box
              display='flex'
              alignItems='center'
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 1,
                flex: 1,
              }}
            >
              <LoginIcon
                sx={{
                  color: 'success.main',
                  mr: { xs: 1, sm: 2 },
                  fontSize: { xs: 20, sm: 24 },
                }}
              />
              <Box>
                <Typography
                  fontWeight={400}
                  fontSize={{ xs: '14px', lg: '14px' }}
                  lineHeight='20px'
                  letterSpacing='-1%'
                  color={theme.palette.text.secondary}
                >
                  Check In Time
                </Typography>
                <Typography
                  fontWeight={500}
                  fontSize={{ xs: '20px', lg: '20px' }}
                  lineHeight='28px'
                  letterSpacing='-1%'
                  color='success.main'
                >
                  {punchInTime || '--:--'}
                </Typography>
              </Box>
            </Box>

            <Box
              display='flex'
              alignItems='center'
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 1,
                flex: 1,
              }}
            >
              <LogoutIcon
                sx={{
                  color: 'warning.main',
                  mr: { xs: 1, sm: 2 },
                  fontSize: { xs: 20, sm: 24 },
                }}
              />
              <Box>
                <Typography
                  fontWeight={400}
                  fontSize={{ xs: '14px', lg: '14px' }}
                  lineHeight='20px'
                  letterSpacing='-1%'
                  color={theme.palette.text.secondary}
                >
                  Check Out Time
                </Typography>
                <Typography
                  fontWeight={500}
                  fontSize={{ xs: '20px', lg: '20px' }}
                  lineHeight='28px'
                  letterSpacing='-1%'
                  color='warning.main'
                >
                  {punchOutTime || '--:--'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Time Card */}
        <Box flex={1}>
          <MyTimeCard attendanceRefreshToken={attendanceRefreshToken} />
        </Box>
      </Box>

      <EmployeeGeofenceStatus />

      {/* Toast Notifications */}
      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box >
  );
};

export default AttendanceCheck;
