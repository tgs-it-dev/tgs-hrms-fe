import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Alert,
  Collapse,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  CheckCircle as CheckInIcon,
  ExitToApp as CheckOutIcon,
} from '@mui/icons-material';
import {
  useWebSocketNotifications,
  type Notification,
} from '../../hooks/useWebSocketNotifications';
import { format } from 'date-fns';

const AttendanceNotifications: React.FC = () => {
  const { notifications, isConnected, clearNotifications, removeNotification } =
    useWebSocketNotifications();
  const [expanded, setExpanded] = React.useState(true);

  if (!isConnected && notifications.length === 0) {
    return null; // Don't show if not connected and no notifications
  }

  return (
    <Paper
      sx={{
        p: 2,
        mb: 3,
        borderRadius: '20px',
        backgroundColor: 'background.paper',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon color={isConnected ? 'primary' : 'disabled'} />
          <Typography variant='h6' fontWeight='bold'>
            Real-time Attendance Notifications
          </Typography>
          {notifications.length > 0 && (
            <Chip
              label={notifications.length}
              size='small'
              color='primary'
              sx={{ ml: 1 }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {notifications.length > 0 && (
            <>
              <IconButton
                size='small'
                onClick={clearNotifications}
                title='Clear all notifications'
              >
                <CloseIcon fontSize='small' />
              </IconButton>
              <IconButton
                size='small'
                onClick={() => setExpanded(!expanded)}
                title={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? (
                  <CloseIcon fontSize='small' />
                ) : (
                  <NotificationsIcon fontSize='small' />
                )}
              </IconButton>
            </>
          )}
        </Box>
      </Box>

      {!isConnected && (
        <Alert severity='warning' sx={{ mb: 1 }}>
          WebSocket disconnected. Notifications may not be received.
        </Alert>
      )}

      <Collapse in={expanded}>
        {notifications.length === 0 ? (
          <Typography variant='body2' color='text.secondary' sx={{ py: 2 }}>
            No recent attendance notifications.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRemove={removeNotification}
              />
            ))}
          </Box>
        )}
      </Collapse>
    </Paper>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRemove,
}) => {
  const theme = useTheme();
  const isCheckIn = notification.type === 'check-in';
  const timestamp = new Date(notification.timestamp);

  return (
    <Paper
      sx={{
        p: 1.5,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        backgroundColor: 'background.default',
        borderLeft: `4px solid ${isCheckIn ? theme.palette.success.main : theme.palette.warning.main}`,
      }}
    >
      <Box sx={{ mt: 0.5 }}>
        {isCheckIn ? (
          <CheckInIcon color='success' fontSize='small' />
        ) : (
          <CheckOutIcon color='warning' fontSize='small' />
        )}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant='body2' fontWeight={600}>
            {notification.employee_name}
          </Typography>
          <Chip
            label={isCheckIn ? 'Check In' : 'Check Out'}
            size='small'
            color={isCheckIn ? 'success' : 'warning'}
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
          {notification.near_boundary && (
            <Chip
              label='Near Boundary'
              size='small'
              color='info'
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
        </Box>
        <Typography variant='caption' color='text.secondary'>
          {format(timestamp, 'PPp')}
        </Typography>
        {notification.message && (
          <Typography variant='body2' sx={{ mt: 0.5 }}>
            {notification.message}
          </Typography>
        )}
      </Box>
      <IconButton
        size='small'
        onClick={() => onRemove(notification.id)}
        sx={{ mt: -0.5 }}
      >
        <CloseIcon fontSize='small' />
      </IconButton>
    </Paper>
  );
};

export default AttendanceNotifications;
