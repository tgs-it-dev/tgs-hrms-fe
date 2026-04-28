import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  CircularProgress,
  IconButton,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Icons } from '../../assets/icons';

import AppPageTitle from '../common/AppPageTitle';
import AppButton from '../common/AppButton';
import AppTable from '../common/AppTable';
import ErrorSnackbar from '../common/ErrorSnackbar';
import DeleteConfirmationDialog from '../common/DeleteConfirmationDialog';
import AnnouncementModal from './AnnouncementModal';

import { useLanguage } from '../../hooks/useLanguage';
import { useUser } from '../../hooks/useUser';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { isSystemAdmin } from '../../utils/roleUtils';
import {
  announcementsApiService,
  type Announcement,
} from '../../api/announcementsApi';

function formatDate(value: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}

export default function AnnouncementsPage() {
  const theme = useTheme();
  const { language } = useLanguage();
  const { user } = useUser();
  const isRtl = language === 'ar';
  const canCreate = !isSystemAdmin(user?.role);

  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();

  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const list = await announcementsApiService.listAnnouncements();
      // Newest first (best-effort)
      const sorted = [...list].sort((a, b) => {
        const ad = new Date(a.created_at).getTime();
        const bd = new Date(b.created_at).getTime();
        return (Number.isNaN(bd) ? 0 : bd) - (Number.isNaN(ad) ? 0 : ad);
      });
      setAnnouncements(sorted);
    } catch (err: unknown) {
      showError(err);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void fetchAnnouncements();
  }, [fetchAnnouncements]);

  const titleText = useMemo(
    () => (isRtl ? 'الإعلانات' : 'Announcements'),
    [isRtl]
  );

  const handleOpenCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (a: Announcement) => {
    setEditing(a);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!deleting || isDeleting) return;
    setIsDeleting(true);
    try {
      await announcementsApiService.deleteAnnouncement(deleting.id);
      setAnnouncements(prev => prev.filter(a => a.id !== deleting.id));
      showError(new Error(isRtl ? 'تم حذف الإعلان' : 'Announcement deleted.'));
      setDeleting(null);
    } catch (err: unknown) {
      showError(err);
    } finally {
      setIsDeleting(false);
    }
  }, [deleting, isDeleting, showError, showSuccess, isRtl]);

  return (
    <Box sx={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <AppPageTitle isRtl={isRtl} sx={{ mb: { xs: 1.5, sm: 3 } }}>
          {titleText}
        </AppPageTitle>

        {canCreate && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              paddingBottom: '10px',
            }}
          >
            <AppButton
              variantType='primary'
              onClick={handleOpenCreate}
              startIcon={<AddIcon />}
              text={isRtl ? 'إنشاء إعلان' : 'Create announcement'}
            />
          </Box>
        )}
      </Box>

      <Box>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 220,
            }}
          >
            <CircularProgress />
          </Box>
        ) : announcements.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography sx={{ color: theme.palette.text.secondary }}>
              {isRtl ? 'لا توجد إعلانات بعد' : 'No announcements yet.'}
            </Typography>
          </Box>
        ) : (
          <AppTable>
            <TableHead>
              <TableRow>
                <TableCell>{isRtl ? 'العنوان' : 'Title'}</TableCell>
                <TableCell>{isRtl ? 'الفئة' : 'Category'}</TableCell>
                <TableCell>{isRtl ? 'الأولوية' : 'Priority'}</TableCell>
                <TableCell>{isRtl ? 'الحالة' : 'Status'}</TableCell>
                <TableCell>{isRtl ? 'مجدول في' : 'Scheduled at'}</TableCell>
                <TableCell>{isRtl ? 'تم الإنشاء' : 'Created at'}</TableCell>
                {canCreate && (
                  <TableCell>{isRtl ? 'إجراءات' : 'Actions'}</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {announcements.map(a => (
                <TableRow key={a.id} hover>
                  <TableCell data-truncate='true'>
                    <Tooltip title={a.title || ''} arrow placement='top'>
                      <Typography
                        sx={{ fontWeight: 600, cursor: 'help' }}
                        data-truncate='true'
                      >
                        {a.title}
                      </Typography>
                    </Tooltip>
                    <Tooltip title={a.content || ''} arrow placement='top'>
                      <Typography
                        sx={{
                          color: theme.palette.text.secondary,
                          mt: 0.5,
                          cursor: 'help',
                        }}
                        data-truncate='true'
                      >
                        {a.content}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {a.category}
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {String(a.priority)}
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {String(a.status)}
                  </TableCell>
                  <TableCell>{formatDate(a.scheduled_at)}</TableCell>
                  <TableCell>{formatDate(a.created_at)}</TableCell>
                  {canCreate && (
                    <TableCell>
                      <Box display='flex' alignItems='center' gap={0.5}>
                        <Tooltip
                          title={
                            a.status === 'sent'
                              ? isRtl
                                ? 'لا يمكن تعديل الإعلان المرسل'
                                : 'Cannot edit sent announcement'
                              : isRtl
                                ? 'تعديل'
                                : 'Edit'
                          }
                        >
                          <span>
                            <IconButton
                              color='primary'
                              size='small'
                              onClick={() => handleOpenEdit(a)}
                              disabled={a.status === 'sent'}
                              aria-label={
                                isRtl ? 'تعديل الإعلان' : 'Edit announcement'
                              }
                            >
                              <Box
                                component='img'
                                src={Icons.edit}
                                alt='Edit'
                                sx={{
                                  width: { xs: 16, sm: 20 },
                                  height: { xs: 16, sm: 20 },
                                }}
                              />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={isRtl ? 'حذف' : 'Delete'}>
                          <IconButton
                            color='error'
                            size='small'
                            onClick={() => setDeleting(a)}
                            aria-label={
                              isRtl ? 'حذف الإعلان' : 'Delete announcement'
                            }
                          >
                            <Box
                              component='img'
                              src={Icons.delete}
                              alt='Delete'
                              sx={{
                                width: { xs: 16, sm: 20 },
                                height: { xs: 16, sm: 20 },
                              }}
                            />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </AppTable>
        )}
      </Box>

      <AnnouncementModal
        open={formOpen}
        onClose={handleCloseForm}
        isRtl={isRtl}
        announcement={editing}
        showError={showError}
        showSuccess={showSuccess}
        onCreated={created => setAnnouncements(prev => [created, ...prev])}
        onUpdated={updated =>
          setAnnouncements(prev =>
            prev.map(a => (a.id === updated.id ? updated : a))
          )
        }
      />

      <DeleteConfirmationDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
        isRTL={isRtl}
        loading={isDeleting}
        title={isRtl ? 'حذف الإعلان' : 'Delete announcement'}
        message={
          isRtl
            ? 'هل أنت متأكد أنك تريد حذف "{itemName}"؟ لا يمكن التراجع عن هذا الإجراء.'
            : 'Are you sure you want to delete "{itemName}"? This action cannot be undone.'
        }
        itemName={deleting?.title || ''}
        confirmText={isRtl ? 'حذف' : 'Delete'}
        cancelText={isRtl ? 'إلغاء' : 'Cancel'}
      />

      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      />
    </Box>
  );
}
