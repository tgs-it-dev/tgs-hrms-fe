import * as React from 'react';
import {
  Box,
  Badge,
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  Typography,
  useTheme,
} from '@mui/material';
import { useNotifications } from '../../context/NotificationContext';
import { Icons } from '../../assets/icons';
import { useScopedTranslations } from '../../hooks/useScopedTranslations';

/**
 * NotificationButton — notification bell with unread badge and dropdown menu.
 * Extracted from Navbar to keep the parent component focused on layout concerns.
 */
const NotificationButton: React.FC = () => {
  const theme = useTheme();
  const t = useScopedTranslations('navbar');
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
        aria-label={t.notifications}
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
            alt=''
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
            {t.notifications}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button
            size='small'
            onClick={() => {
              markAllAsRead();
            }}
          >
            {t.markAllRead}
          </Button>
          <Button
            size='small'
            onClick={() => {
              clearAllNotifications();
            }}
          >
            {t.clear}
          </Button>
        </Box>
        <Divider />
        {(() => {
          const unreadList = notifications.filter(n => !n.read);
          return unreadList.length === 0 ? (
            <List sx={{ p: 2 }}>
              <ListItem>
                <ListItemText
                  primary={t.noNotifications}
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

export default NotificationButton;
