import React, { useState } from 'react';
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
import dayjs from 'dayjs';
import type { WorkflowStep } from '../../api/workflowApi';
import { getDocumentUrl } from '../../utils/fileUtils';
import { getIcon } from '../../assets/icons';
import { IoCloseCircleOutline } from 'react-icons/io5';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { isEmployee, isManager } from '../../utils/roleUtils';

export interface RequestLeaveCardProps {
  title: string;
  from?: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_review';
  startDate: string;
  endDate: string;
  reason: string;
  submittedDate: string;
  steps?: WorkflowStep[];
  onEdit?: () => void;
  onCancel?: () => void;
  actions?: React.ReactNode;
  role?: string;
  attachments?: string[];
  leaveType?: string | undefined;
}

const RequestLeaveCard: React.FC<RequestLeaveCardProps> = props => {
  const {
    title,
    from,
    type,
    status,
    startDate,
    endDate,
    reason,
    submittedDate,
    onEdit,
    onCancel,
    actions,
    role: userRole,
    steps,
    attachments = [],
    leaveType,
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
    cancelled: {
      label: getLabel('Cancelled', 'ملغى'),
      bg: 'var(--status-rejected-bg)',
      color: 'var(--status-rejected-text)',
    },
    in_review: {
      label: getLabel('In Review', 'قيد المراجعة'),
      bg: 'var(--status-review-bg)',
      color: 'var(--status-review-text)',
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.pending;
  const isPending = status === 'pending';
  const manager = isManager(userRole);
  const employee = isEmployee(userRole);

  // Controls whether the delete confirmation dialog is visible
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Controls whether the document viewing dialog is visible
  const [openDocs, setOpenDocs] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const handleViewDocs = () => {
    setFailedImages(new Set());
    setOpenDocs(true);
  };

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
                color={theme.palette.text.primary}
                fontWeight={600}
                fontSize='var(--subheading2-font-size)'
                lineHeight='var(--subheading2-line-height)'
                letterSpacing='var(--subheading2-letter-spacing)'
              >
                {title}
              </Typography>
              <Typography
                color={theme.palette.text.secondary}
                mt={0.5}
                lineHeight='var(--body-line-height)'
                letterSpacing='var(--body-letter-spacing)'
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
            {manager && (
              <Box display='flex' gap={2}>
                <Typography
                  sx={{
                    minWidth: '80px',
                    fontWeight: 500,
                    fontSize: 'var(--body-font-size)',
                    color: theme.palette.text.primary,
                  }}
                >
                  {getLabel('From:', 'من:')}
                </Typography>
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: 'var(--body-font-size)',
                    lineHeight: 'var(--body-line-height)',
                    letterSpacing: 'var(--body-letter-spacing)',
                  }}
                >
                  {from}
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
                flex={'1'}
                sx={{
                  color: 'text.secondary',
                  fontSize: 'var(--body-font-size)',
                  lineHeight: 'var(--body-line-height)',
                  letterSpacing: 'var(--body-letter-spacing)',
                }}
              >
                {reason}
              </Typography>
            </Box>

            {leaveType && (
              <Box display='flex' gap={2}>
                <Typography
                  sx={{
                    minWidth: '80px',
                    fontWeight: 500,
                    fontSize: 'var(--body-font-size)',
                    color: theme.palette.text.primary,
                  }}
                >
                  {getLabel('Leave Type:', 'نوع الإجازة:')}
                </Typography>
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: 'var(--body-font-size)',
                    lineHeight: 'var(--body-line-height)',
                    letterSpacing: 'var(--body-letter-spacing)',
                  }}
                >
                  {leaveType.charAt(0).toUpperCase() + leaveType.slice(1)}
                </Typography>
              </Box>
            )}

            {attachments.length > 0 && (
              <Box display='flex' gap={2} alignItems='center'>
                <Typography
                  sx={{
                    minWidth: '80px',
                    fontWeight: 500,
                    fontSize: 'var(--body-font-size)',
                    color: theme.palette.text.primary,
                  }}
                >
                  {getLabel('Documents:', 'المستندات:')}
                </Typography>
                <IconButton
                  onClick={handleViewDocs}
                  size='small'
                  sx={{ p: 0.5 }}
                >
                  <img
                    src={getIcon('password')}
                    alt='View Documents'
                    width={20}
                    height={20}
                  />
                </IconButton>
              </Box>
            )}
          </Box>

          <Divider
            sx={{ borderColor: theme.palette.divider, opacity: 0.5, my: 2 }}
          />
        </Box>

        <Box>
          <Box>
            {/* steps for manager, hr admin and admin  */}
            {steps && steps?.length > 0 ? (
              <Box display='flex' flexDirection='column' gap={2}>
                {steps?.map(step =>
                  step.status === 'approved' ? (
                    <Box
                      key={step.id}
                      sx={{
                        backgroundColor: 'var(--app-table-header-bg)',
                        borderLeft: `4px solid ${theme.palette.primary.main}`,
                        p: '12px 16px',
                        borderRadius: '4px',
                      }}
                    >
                      <Box
                        display='flex'
                        justifyContent='space-between'
                        mb={0.5}
                      >
                        <Typography
                          fontWeight={600}
                          sx={{
                            fontSize: 'var(--body-font-size)',
                            color: theme.palette.text.primary,
                          }}
                        >
                          {step.step_label}:
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: 'var(--label-font-size)',
                            color: 'text.secondary',
                          }}
                        >
                          {dayjs(step.acted_at).format('MMM D, h:mm A')}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          color: 'text.secondary',
                          fontStyle: 'normal',
                          lineHeight: 'var(--body-line-height)',
                          letterSpacing: 'var(--body-letter-spacing)',
                        }}
                      >
                        {step.remarks ||
                          getLabel('No remarks yet', 'لا توجد ملاحظات بعد')}
                      </Typography>
                    </Box>
                  ) : step.status === 'withdrawn' ? (
                    <Box
                      sx={{
                        backgroundColor: 'var(--app-table-header-bg)',
                        borderLeft: `4px solid ${theme.palette.primary.main}`,
                        p: '12px 16px',
                        borderRadius: '4px',
                      }}
                    >
                      <Box
                        display='flex'
                        justifyContent='space-between'
                        mb={0.5}
                      >
                        <Typography
                          fontWeight={600}
                          sx={{
                            fontSize: 'var(--body-font-size)',
                            color: theme.palette.text.primary,
                          }}
                        >
                          {step.step_label}:
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: 'var(--label-font-size)',
                            color: 'text.secondary',
                          }}
                        >
                          {dayjs(step.acted_at).format('MMM D, h:mm A')}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          color: 'text.secondary',
                          fontStyle: 'normal',
                          lineHeight: 'var(--body-line-height)',
                          letterSpacing: 'var(--body-letter-spacing)',
                        }}
                      >
                        {step.remarks ||
                          getLabel('No remarks yet', 'لا توجد ملاحظات بعد')}
                      </Typography>
                    </Box>
                  ) : step.status === 'rejected' ? (
                    <Box
                      sx={{
                        backgroundColor: 'var(--app-table-header-bg)',
                        borderLeft: `4px solid ${theme.palette.primary.main}`,
                        p: '12px 16px',
                        borderRadius: '4px',
                      }}
                    >
                      <Box
                        display='flex'
                        justifyContent='space-between'
                        mb={0.5}
                      >
                        <Typography
                          fontWeight={600}
                          sx={{
                            fontSize: 'var(--body-font-size)',
                            color: theme.palette.text.primary,
                          }}
                        >
                          {step.step_label}:
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: 'var(--label-font-size)',
                            color: 'text.secondary',
                          }}
                        >
                          {dayjs(step.acted_at).format('MMM D, h:mm A')}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          color: 'text.secondary',
                          fontStyle: 'normal',
                          lineHeight: 'var(--body-line-height)',
                          letterSpacing: 'var(--body-letter-spacing)',
                        }}
                      >
                        {step.remarks ||
                          getLabel('No remarks yet', 'لا توجد ملاحظات بعد')}
                      </Typography>
                    </Box>
                  ) : step.status === 'pending' ? (
                    // waiting message for admin, hr admin and employee
                    userRole === step.approval_role ? (
                      <Box
                        sx={{
                          backgroundColor: 'var(--app-table-header-bg)',
                          borderLeft: `4px solid ${theme.palette.primary.main}`,
                          p: '12px 16px',
                          borderRadius: '4px',
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '14px',
                            color: 'text.secondary',
                            fontStyle: 'normal',
                            lineHeight: 'var(--body-line-height)',
                            letterSpacing: 'var(--body-letter-spacing)',
                          }}
                        >
                          {getLabel(
                            `Waiting for ${step.approver_role} approval`,
                            'في انتظار الموافقة'
                          )}
                        </Typography>
                      </Box>
                    ) : (
                      //waiting message for employee
                      employee && (
                        <Box
                          sx={{
                            backgroundColor: 'var(--app-table-header-bg)',
                            borderLeft: `4px solid ${theme.palette.primary.main}`,
                            p: '12px 16px',
                            borderRadius: '4px',
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: '14px',
                              color: 'text.secondary',
                              fontStyle: 'normal',
                              lineHeight: 'var(--body-line-height)',
                              letterSpacing: 'var(--body-letter-spacing)',
                            }}
                          >
                            {getLabel(
                              `Waiting for ${step.approver_role} approval`,
                              'في انتظار الموافقة'
                            )}
                          </Typography>
                        </Box>
                      )
                    )
                  ) : null
                )}
              </Box>
            ) : (
              <Box
                sx={{
                  backgroundColor: 'var(--app-table-header-bg)',
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                  p: '12px 16px',
                  borderRadius: '4px',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '14px',
                    color: 'text.secondary',
                    fontStyle: 'normal',
                    lineHeight: 'var(--body-line-height)',
                    letterSpacing: 'var(--body-letter-spacing)',
                  }}
                >
                  {getLabel('Waiting for Approvals', 'في انتظار الموافقة')}
                </Typography>
              </Box>
            )}

            {/* Actions performed by admin, hr admin and manager (e.g. Approve / Reject buttons) */}
            {actions && <Box mt={2}>{actions}</Box>}
          </Box>
          {/* Footer */}
          <Box>
            <Divider
              sx={{ borderColor: theme.palette.divider, opacity: 0.5, my: 2 }}
            />

            <Box
              display='flex'
              justifyContent={
                isPending && !manager ? 'space-between' : 'flex-start'
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

              {/* Edit / Delete — only visible to employees on pending requests */}
              {employee && isPending ? (
                <Box display='flex' gap={0.5}>
                  <IconButton size='small' onClick={onEdit}>
                    <img
                      src={Icons.edit}
                      alt='edit'
                      style={{ width: 20, height: 20 }}
                    />
                  </IconButton>
                  <IconButton
                    size='small'
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <img
                      src={Icons.delete}
                      alt='edit'
                      style={{ width: 20, height: 20 }}
                    />
                  </IconButton>
                </Box>
              ) : null}
            </Box>
          </Box>
        </Box>
      </CardContent>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          onCancel?.();
          setDeleteDialogOpen(false);
        }}
        title={getLabel('Cancel Request', 'إلغاء الطلب')}
        message={getLabel(
          'Are you sure you want to cancel this request? This action cannot be undone.',
          'هل أنت متأكد أنك تريد إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.'
        )}
        confirmText={getLabel('Confirm Cancellation', 'إلغاء الطلب')}
      />

      <Dialog
        open={openDocs}
        onClose={() => setOpenDocs(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle
          display={'flex'}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Typography variant='h6'>
            {getLabel('Uploaded Documents', 'المستندات المرفوعة')}
          </Typography>
          <IconButton onClick={() => setOpenDocs(false)}>
            <IoCloseCircleOutline />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box
            display={'grid'}
            gridTemplateColumns={'repeat(4, 1fr)'}
            gap={2}
            width={'100%'}
            justifyItems={'center'}
            paddingBottom={'2'}
          >
            {attachments.map((doc, index) => {
              const imageUrl = getDocumentUrl(doc);

              return (
                <Box key={index}>
                  {!failedImages.has(index) ? (
                    <>
                      <img
                        src={imageUrl}
                        alt={`document-${index}`}
                        style={{
                          width: '100%',
                          height: 120,
                          objectFit: 'cover',
                          borderRadius: 6,
                          border: `1px solid ${theme.palette.divider}`,
                          cursor: 'pointer',
                        }}
                        onError={() => {
                          setFailedImages(prev => new Set(prev).add(index));
                        }}
                      />
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          mt: 0.5,
                        }}
                      >
                        <Typography
                          variant='caption'
                          sx={{
                            cursor: 'pointer',
                            color: 'primary.main',
                            mx: 0.5,
                          }}
                          onClick={() => window.open(imageUrl, '_blank')}
                        >
                          {getLabel('View', 'عرض')} /
                        </Typography>

                        <Typography
                          variant='caption'
                          sx={{ cursor: 'pointer', color: 'primary.main' }}
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = imageUrl;
                            link.download = `document-${index}`;
                            link.click();
                          }}
                        >
                          {getLabel('Download', 'تحميل')}
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <Typography variant='caption' color='error'>
                      {getLabel('Failed to load', 'فشل التحميل')}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </DialogContent>
      </Dialog>
    </AppCard>
  );
};

export default RequestLeaveCard;
