import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import AppButton from '../common/AppButton';
import AppTextarea from '../common/AppTextarea';

interface LeaveApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  action: 'approved' | 'rejected';
  allowComments?: boolean; // For managers, always show comment field
  commentLabel?: string; // Custom label for comment field
  showRemarksField?: boolean; // Whether to show remarks field (false for admin/HR admin rejections)
}

const LeaveApprovalDialog = ({
  open,
  onClose,
  onConfirm,
  action,
  allowComments = false,
  commentLabel = 'Comments',
  showRemarksField = true, // Default to true for backward compatibility
}: LeaveApprovalDialogProps) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  const actionText = action === 'approved' ? 'Approve' : 'Reject';
  const actionLower = action === 'approved' ? 'approve' : 'reject';
  // Show comment field if: allowComments is true OR (action is rejected AND showRemarksField is true)
  const showCommentField =
    allowComments || (action === 'rejected' && showRemarksField);

  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle sx={{ fontWeight: 600, textAlign: 'center' }}>
        Confirm {actionText}
      </DialogTitle>
      <DialogContent>
        <Typography align='center' sx={{ mb: 2 }}>
          Are you sure you want to {actionLower} this leave request?
        </Typography>
        {showCommentField && (
          <AppTextarea
            label={action === 'rejected' ? 'Rejection Reason' : commentLabel}
            value={reason}
            onChange={e => setReason(e.target.value)}
            minRows={2}
            containerSx={{ mt: 2 }}
            required={action === 'rejected'}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <AppButton
          onClick={() => onConfirm(showCommentField ? reason : undefined)}
          variant='contained'
          variantType={action === 'approved' ? 'primary' : 'danger'}
          disabled={showCommentField && action === 'rejected' && !reason.trim()}
        >
          Yes
        </AppButton>
        <AppButton onClick={onClose} variant='outlined' variantType='secondary'>
          No
        </AppButton>
      </DialogActions>
    </Dialog>
  );
};

export default LeaveApprovalDialog;
