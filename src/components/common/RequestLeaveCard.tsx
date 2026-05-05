import React, { useCallback, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  useTheme,
  Divider,
  CardContent,
} from '@mui/material';
import { Icons } from '../../assets/icons';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import { useDirectionLabel } from '../../hooks/useDirectionLabel';
import AppCard from './AppCard';

export interface RequestLeaveCardProps {
  title: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  startDate: string;
  endDate: string;
  reason: string;
  submittedDate: string;
  message: string;
  managerName?: string;
  managerMessageDate?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  actions?: React.ReactNode;
  isManagerView?: boolean;
}

const RequestLeaveCard: React.FC<RequestLeaveCardProps> = props => {
  const {
    title,
    type,
    status,
    startDate,
    endDate,
    reason,
    submittedDate,
    message,
    managerName,
    managerMessageDate,
    onEdit,
    onDelete,
    actions,
    isManagerView = false,
  } = props;

  const theme = useTheme();
  const getLabel = useDirectionLabel();

  const statusConfig = {
    pending: {
      label: getLabel('Pending', 'قيد الانتظار'),
      bg: 'var(--status-pending-bg)',
      color: 'var(--status-pending-text)',
    },
    approved: {
      label: getLabel('Approved', 'مقبول'),
      bg: 'var(--status-approved-bg)',
      color: 'var(--status-approved-text)',
    },
    rejected: {
      label: getLabel('Rejected', 'مرفوض'),
      bg: 'var(--status-rejected-bg)',
      color: 'var(--status-rejected-text)',
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.pending;
  const isPending = status === 'pending';

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    onDelete?.();
    setDeleteDialogOpen(false);
  }, [onDelete]);

  return (
    <AppCard
      padding={2.5}
      sx={{
        maxWidth: '100%',
        borderRadius: 'var(--border-radius-2xl)',
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <CardContent
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between',
          '&:last-child': { pb: 0 },
        }}
      >
        <Box>
          {/* Header */}
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='flex-start'
          >
            <Box>
              <Typography
                sx={{
                  fontSize: { xs: '18px', lg: 'var(--subheading2-font-size)' },
                  fontWeight: 600,
                  lineHeight: 'var(--body-line-height)',
                  letterSpacing: 'var(--body-letter-spacing)',
                  color: theme.palette.text.primary,
                }}
              >
                {title}
              </Typography>
              <Typography
                sx={{
                  fontSize: 'var(--body-font-size)',
                  color: 'text.secondary',
                  mt: 0.5,
                  lineHeight: 'var(--body-line-height)',
                  letterSpacing: 'var(--body-letter-spacing)',
                }}
              >
                {type}
              </Typography>
            </Box>

            <Chip
              label={currentStatus.label}
              sx={{
                backgroundColor: currentStatus.bg,
                color: currentStatus.color,
                fontWeight: 600,
                borderRadius: '100px',
                height: '28px',
                fontSize: 'var(--label-font-size)',
              }}
            />
          </Box>

          <Divider
            sx={{ borderColor: theme.palette.divider, opacity: 0.5, my: 1.5 }}
          />

          {/* Content */}
          <Box display='flex' flexDirection='column' gap={1.5}>
            {isManagerView && (
              <Box display='flex' gap={2}>
                <Typography
                  sx={{
                    minWidth: '80px',
                    fontWeight: 500,
                    fontSize: 'var(--body-font-size)',
                    color: theme.palette.text.primary,
                  }}
                >
                  {getLabel('Title:', 'العنوان:')}
                </Typography>
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: 'var(--body-font-size)',
                    lineHeight: 'var(--body-line-height)',
                    letterSpacing: 'var(--body-letter-spacing)',
                  }}
                >
                  {title}
                </Typography>
              </Box>
            )}
            <Box display='flex' gap={2}>
              <Typography
                sx={{
                  minWidth: '80px',
                  fontWeight: 500,
                  fontSize: 'var(--body-font-size)',
                  color: theme.palette.text.primary,
                }}
              >
                {getLabel('Date:', 'التاريخ:')}
              </Typography>
              <Typography
                sx={{
                  color: 'text.secondary',
                  fontSize: 'var(--body-font-size)',
                  lineHeight: 'var(--body-line-height)',
                  letterSpacing: 'var(--body-letter-spacing)',
                }}
              >
                {startDate} - {endDate}
              </Typography>
            </Box>

            <Box display='flex' gap={2}>
              <Typography
                sx={{
                  minWidth: '80px',
                  fontWeight: 500,
                  fontSize: 'var(--body-font-size)',
                  color: theme.palette.text.primary,
                }}
              >
                {getLabel('Reason:', 'السبب:')}
              </Typography>
              <Typography
                sx={{
                  color: 'text.secondary',
                  flex: 1,
                  fontSize: 'var(--body-font-size)',
                  lineHeight: 'var(--body-line-height)',
                  letterSpacing: 'var(--body-letter-spacing)',
                }}
              >
                {reason}
              </Typography>
            </Box>
          </Box>

          <Divider
            sx={{ borderColor: theme.palette.divider, opacity: 0.5, my: 2 }}
          />

          {/* Message / Remarks Section */}
          {!isManagerView && (
            <Box
              sx={{
                backgroundColor: 'var(--app-table-header-bg)',
                borderLeft: `4px solid ${theme.palette.primary.main}`,
                p: '12px 16px',
                borderRadius: '4px',
              }}
            >
              {managerName && (
                <Box display='flex' justifyContent='space-between' mb={0.5}>
                  <Typography
                    fontWeight={600}
                    sx={{
                      fontSize: 'var(--body-font-size)',
                      color: theme.palette.text.primary,
                    }}
                  >
                    {managerName}:
                  </Typography>
                  {managerMessageDate && (
                    <Typography
                      sx={{
                        fontSize: 'var(--label-font-size)',
                        color: 'text.secondary',
                      }}
                    >
                      {managerMessageDate}
                    </Typography>
                  )}
                </Box>
              )}

              <Typography
                sx={{
                  fontSize: '14px',
                  color: 'text.secondary',
                  fontStyle: message
                    ? managerName
                      ? 'normal'
                      : 'italic'
                    : 'italic',
                  lineHeight: 'var(--body-line-height)',
                  letterSpacing: 'var(--body-letter-spacing)',
                }}
              >
                {message || getLabel('No remarks yet', 'لا توجد ملاحظات بعد')}
              </Typography>
            </Box>
          )}

          {/* Actions Slot (Manager controls or Employee remarks input) */}
          {actions && <Box mt={2}>{actions}</Box>}
        </Box>

        <Box>
          <Divider
            sx={{ borderColor: theme.palette.divider, opacity: 0.5, my: 2 }}
          />

          {/* Footer */}
          <Box
            display='flex'
            justifyContent={
              isPending && !isManagerView ? 'space-between' : 'left'
            }
            alignItems='center'
          >
            <Typography
              sx={{
                fontSize: 'var(--label-font-size)',
                color: 'text.secondary',
              }}
            >
              {getLabel('Submitted:', 'تاريخ التقديم:')} {submittedDate}
            </Typography>

            {!isManagerView && isPending && (
              <Box display='flex' gap={0.5}>
                <IconButton size='small' onClick={onEdit}>
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
                <IconButton size='small' onClick={handleDeleteClick}>
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
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={getLabel('Confirm Deletion', 'تأكيد الحذف')}
        message={getLabel(
          'Are you sure you want to delete this request? This action cannot be undone.',
          'هل أنت متأكد أنك تريد حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.'
        )}
        confirmText={getLabel('Delete', 'حذف')}
      />
    </AppCard>
  );
};

export default RequestLeaveCard;
