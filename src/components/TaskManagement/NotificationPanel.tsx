import React from 'react';

import {
  Box,
  Typography,
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Chip,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import { useNotifications } from '../../context/NotificationContext';

function formatDateLocal(isoDate?: string) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
// AppCard not needed here

export default function NotificationPanel() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  } = useNotifications();

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );

  // Render notifications for all users (managers will still see task-style items)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;
  const unreadList = notifications.filter(n => !n.read);

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleClearNotification = (
    e: React.MouseEvent,
    notificationId: string
  ) => {
    e.stopPropagation();
    clearNotification(notificationId);
  };

  return (
    <>
      <IconButton
        aria-describedby={id}
        onClick={handleClick}
        sx={{ color: 'text.primary' }}
      >
        <Badge badgeContent={unreadCount} color='error'>
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '90vw', sm: 400 },
              maxHeight: 500,
              mt: 1,
            },
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
            mb={2}
          >
            <Typography variant='h6' fontWeight={600}>
              Notifications
            </Typography>
            {unreadList.length > 0 && (
              <Box display='flex' gap={1}>
                <Button size='small' onClick={markAllAsRead}>
                  Mark all read
                </Button>
                <Button
                  size='small'
                  color='error'
                  onClick={clearAllNotifications}
                >
                  Clear all
                </Button>
              </Box>
            )}
          </Box>

          {unreadList.length === 0 ? (
            <Box py={4} textAlign='center'>
              <Typography color='text.secondary'>
                No notifications yet
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {unreadList.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{
                      px: 0,
                      py: 1.5,
                      bgcolor: notification.read
                        ? 'transparent'
                        : 'action.hover',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                    }}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <ListItemText
                      primary={
                        <Box
                          display='flex'
                          justifyContent='space-between'
                          alignItems='flex-start'
                          gap={1}
                        >
                          <Typography
                            variant='body2'
                            fontWeight={notification.read ? 400 : 600}
                          >
                            {notification.taskTitle
                              ? `${notification.employeeName ?? 'Someone'} updated task status`
                              : notification.title}
                          </Typography>
                          <IconButton
                            size='small'
                            onClick={e =>
                              handleClearNotification(e, notification.id)
                            }
                            sx={{ ml: 1 }}
                          >
                            <CloseIcon fontSize='small' />
                          </IconButton>
                        </Box>
                      }
                      secondary={
                        <Box mt={1}>
                          {notification.taskTitle ? (
                            <>
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ mb: 1 }}
                              >
                                <strong>{notification.taskTitle}</strong>
                              </Typography>
                              <Box
                                display='flex'
                                alignItems='center'
                                gap={1}
                                mb={1}
                              >
                                <Chip
                                  label={notification.oldStatus}
                                  size='small'
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                                <Typography variant='caption'>→</Typography>
                                <Chip
                                  label={notification.newStatus}
                                  size='small'
                                  color={
                                    notification.newStatus === 'Completed'
                                      ? 'success'
                                      : notification.newStatus === 'In Progress'
                                        ? 'warning'
                                        : 'default'
                                  }
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              </Box>
                            </>
                          ) : (
                            <Typography
                              variant='body2'
                              color='text.secondary'
                              sx={{ mb: 1 }}
                            >
                              {notification.text}
                            </Typography>
                          )}

                          <Typography variant='caption' color='text.secondary'>
                            {formatDateLocal(notification.timestamp)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
}
