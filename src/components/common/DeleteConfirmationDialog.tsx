import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import AppButton from './AppButton';
import { useOutletContext } from 'react-router-dom';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  isRTL?: boolean;
  loading?: boolean;
  confirmVariantType?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const DeleteConfirmationDialog: React.FC<
  DeleteConfirmationDialogProps
> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isRTL = false,
  loading = false,
  confirmVariantType = 'danger',
}) => {
  const theme = useTheme();
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  // darkMode is reserved for future use
  void darkMode;

  const dialogTitle = title || (isRTL ? 'تأكيد الحذف' : 'Confirm Delete');
  const dialogMessage = itemName
    ? message.replace('{itemName}', itemName)
    : message;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      aria-labelledby='delete-dialog-title'
      aria-describedby='delete-dialog-description'
      PaperProps={{
        sx: {
          direction: isRTL ? 'rtl' : 'ltr',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <DialogTitle
        id='delete-dialog-title'
        sx={{ textAlign: 'center', pb: 1, color: theme.palette.text.primary }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <Typography variant='h6' sx={{ color: theme.palette.text.primary }}>
            {dialogTitle}
          </Typography>
          <IconButton
            onClick={onClose}
            size='small'
            aria-label={
              isRTL ? 'إغلاق مربع حوار التأكيد' : 'Close confirmation dialog'
            }
            sx={{
              position: 'absolute',
              right: isRTL ? 'auto' : 8,
              left: isRTL ? 8 : 'auto',
              color: theme.palette.text.secondary,
            }}
          >
            <CloseIcon aria-hidden='true' />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box id='delete-dialog-description' sx={{ textAlign: 'center' }}>
          <WarningIcon
            sx={{ fontSize: 64, color: theme.palette.warning.main, mb: 2 }}
            aria-hidden='true'
          />
          <Typography
            variant='body1'
            sx={{ mb: 2, lineHeight: 1.6, color: theme.palette.text.primary }}
          >
            {dialogMessage}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', p: 3, pt: 1 }}>
        {/* autoFocus on the safe action prevents accidental destructive Enter-key press */}
        <AppButton
          onClick={onClose}
          variantType='secondary'
          text={isRTL ? 'إلغاء' : cancelText}
          disabled={loading}
          autoFocus
          sx={{ minWidth: 80 }}
        />
        <AppButton
          onClick={onConfirm}
          variantType={confirmVariantType}
          text={
            loading
              ? isRTL
                ? 'جاري المعالجة...'
                : 'Processing...'
              : isRTL
                ? 'حذف'
                : confirmText
          }
          disabled={loading}
          sx={{ minWidth: 80 }}
        />
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
