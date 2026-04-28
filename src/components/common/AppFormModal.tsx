import React, { type ReactNode } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  CircularProgress,
  type SxProps,
  type Theme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import AppInputField from './AppInputField';
import AppTextarea from './AppTextarea';
import AppDropdown from './AppDropdown';
import type { SelectChangeEvent } from '@mui/material/Select';
import AppButton from './AppButton';

export interface FormField {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'dropdown';
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  multiline?: boolean;
  rows?: number;
  options?: Array<{ value: string | number; label: string }>;
  value: string | number;
  error?: string;
  onChange: (value: string | number) => void;
  component?: ReactNode;
}

export interface AppFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  title: string;
  fields?: FormField[];
  children?: ReactNode;
  hideActions?: boolean;
  wrapInForm?: boolean;
  paperSx?: SxProps<Theme>;
  submitLabel?: string;
  cancelLabel?: string;
  submitStartIcon?: ReactNode;
  submitTitle?: string;
  submitDisabled?: boolean;
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  isSubmitting?: boolean;
  hasChanges?: boolean;
  hideCancel?: boolean;
  showCancelButton?: boolean;
  showSubmitButton?: boolean;
  isRtl?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const AppFormModal: React.FC<AppFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  title,
  fields = [],
  children,
  hideActions = false,
  wrapInForm = true,
  paperSx,
  submitLabel = 'Create',
  cancelLabel = 'Cancel',
  submitStartIcon,
  submitTitle,
  submitDisabled,
  secondaryAction,
  isSubmitting = false,
  hasChanges = true,
  hideCancel = false,
  showCancelButton = true,
  showSubmitButton = true,
  isRtl = false,
  maxWidth = 'sm',
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasChanges && !isSubmitting && onSubmit) {
      onSubmit();
    }
  };

  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth={!isLargeScreen}
      maxWidth={maxWidth}
      PaperProps={{
        sx: {
          borderRadius: { xs: '20px', sm: '30px' },
          padding: {
            xs: '20px 16px',
            sm: '24px 20px',
            lg: '32px 20px',
          },
          width: {
            xs: '100%',
            sm: '90%',
            lg: '527px',
          },
          maxWidth: {
            xs: '100%',
            sm: '90%',
            lg: '527px',
          },
          backgroundColor: theme.palette.background.paper,
          margin: { xs: '16px', lg: 'auto' },
          // Keep scrolling but hide scrollbar visuals
          overflowY: 'auto',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge legacy
          '&::-webkit-scrollbar': {
            display: 'none', // Chrome/Safari
          },
          ...(paperSx || {}),
        },
      }}
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 0,
          pb: 2,
          position: 'relative',
          textAlign: isRtl ? 'right' : 'left',
        }}
      >
        <Typography
          fontWeight={500}
          fontSize={{ xs: '16px', sm: '24px', lg: '28px' }}
          lineHeight={{ xs: '28px', sm: '32px', lg: '36px' }}
          sx={{ color: theme.palette.text.primary }}
        >
          {title}
        </Typography>

        <IconButton
          onClick={onClose}
          size={isSmallScreen ? 'small' : 'medium'}
          sx={{
            position: 'absolute',
            top: 0,
            right: isRtl ? 'auto' : 0,
            left: isRtl ? 0 : 'auto',
            color: theme.palette.text.secondary,
          }}
        >
          <CloseIcon fontSize={isSmallScreen ? 'small' : 'medium'} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          pt: 0,
          pb: 2,
          px: 2,
          // Keep scrolling but hide scrollbar visuals (if DialogContent becomes scroll container)
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        }}
      >
        <Box
          sx={{
            width: '100%',
            mt: 2,
            mb: 1,
          }}
        >
          <Box
            component={wrapInForm ? 'form' : 'div'}
            onSubmit={wrapInForm ? handleSubmit : undefined}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              width: '100%',
              direction: isRtl ? 'rtl' : 'ltr',
              // Ensure dropdown labels and input labels are readable on small screens
              '& .subheading2': {
                fontSize: { xs: '13px', sm: 'var(--subheading2-font-size)' },
                fontWeight: { xs: '400', sm: 'var(--subheading2-font-weight)' },
              },
              '& .MuiInputLabel-root': {
                fontSize: { xs: '13px', sm: 'var(--label-font-size)' },
                fontWeight: { xs: '400', sm: 'var(--label-font-weight)' },
              },
            }}
          >
            {children ||
              fields.map(field => (
                <Box key={field.name} width='100%'>
                  {field.component ||
                    (field.type === 'dropdown' && field.options ? (
                      <AppDropdown
                        label={field.label}
                        options={field.options}
                        value={field.value}
                        onChange={(e: SelectChangeEvent<string | number>) =>
                          field.onChange(e.target.value)
                        }
                        placeholder={field.placeholder}
                        error={!!field.error}
                        helperText={field.error}
                        disabled={field.disabled}
                        inputBackgroundColor={
                          theme.palette.mode === 'dark'
                            ? theme.palette.background.default
                            : '#F8F8F8'
                        }
                      />
                    ) : field.type === 'textarea' ? (
                      <AppTextarea
                        label={field.label}
                        name={field.name}
                        value={field.value as string}
                        onChange={e => field.onChange(e.target.value)}
                        placeholder={field.placeholder}
                        rows={field.rows ?? 3}
                        error={!!field.error}
                        helperText={
                          field.error ??
                          (field.maxLength != null
                            ? `${String(field.value).length}/${field.maxLength}`
                            : undefined)
                        }
                        inputProps={
                          field.maxLength != null
                            ? { maxLength: field.maxLength }
                            : undefined
                        }
                        inputBackgroundColor={
                          theme.palette.mode === 'dark'
                            ? theme.palette.background.default
                            : '#F8F8F8'
                        }
                      />
                    ) : (
                      <AppInputField
                        label={field.label}
                        name={field.name}
                        value={field.value as string}
                        onChange={e => field.onChange(e.target.value)}
                        placeholder={field.placeholder}
                        multiline={field.multiline}
                        rows={field.rows}
                        error={!!field.error}
                        helperText={
                          field.error ??
                          (field.maxLength != null
                            ? `${String(field.value).length}/${field.maxLength}`
                            : undefined)
                        }
                        required={field.required}
                        inputProps={
                          field.maxLength != null
                            ? { maxLength: field.maxLength }
                            : undefined
                        }
                        inputBackgroundColor={
                          theme.palette.mode === 'dark'
                            ? theme.palette.background.default
                            : '#F8F8F8'
                        }
                      />
                    ))}
                </Box>
              ))}
          </Box>
        </Box>
      </DialogContent>

      {!hideActions && (
        <DialogActions
          sx={{
            p: 0,
            pt: 0,
            px: 2,
            pb: { xs: 1, sm: 2 },
            gap: 1,
            justifyContent: 'flex-end',
          }}
        >
          {!hideCancel && showCancelButton && Boolean(cancelLabel?.trim()) && (
            <AppButton
              onClick={onClose}
              variant='outlined'
              variantType='secondary'
              sx={{ px: 4 }}
            >
              {cancelLabel}
            </AppButton>
          )}
          {secondaryAction && (
            <AppButton
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
              variant='contained'
              variantType='primary'
              sx={{ px: 4 }}
            >
              {secondaryAction.label}
            </AppButton>
          )}

          {showSubmitButton && (
            <AppButton
              type={wrapInForm ? 'submit' : 'button'}
              variant='contained'
              variantType='primary'
              disabled={
                submitDisabled !== undefined
                  ? submitDisabled
                  : isSubmitting || !hasChanges
              }
              onClick={wrapInForm ? handleSubmit : onSubmit}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={18} color='inherit' />
                ) : (
                  submitStartIcon
                )
              }
              title={submitTitle}
              sx={{ px: 4 }}
            >
              {isSubmitting ? 'Saving...' : submitLabel}
            </AppButton>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default AppFormModal;
