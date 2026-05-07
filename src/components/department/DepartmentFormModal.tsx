import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  IconButton,
  useMediaQuery,
  Drawer,
  Typography,
  Alert,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
// useOutletContext removed (darkMode not used)
import type { SxProps, Theme } from '@mui/material/styles';
import AppButton from '../common/AppButton';
import AppTextarea from '../common/AppTextarea';
import type {
  Department,
  DepartmentFormData,
  DepartmentFormErrors,
} from '../../types';
import { TIMEOUTS, VALIDATION_LIMITS } from '../../constants/appConstants';

interface DepartmentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DepartmentFormData) => void;
  department?: Department | null;
  isRtl?: boolean;
}

export const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  department,
  isRtl = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  // darkMode not used

  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    description: '',
  });

  const [originalData, setOriginalData] = useState<DepartmentFormData>({
    name: '',
    description: '',
  });

  const [errors, setErrors] = useState<DepartmentFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(department);
  const title = isEditing
    ? isRtl
      ? 'تعديل القسم'
      : 'Edit Department'
    : isRtl
      ? 'إنشاء قسم جديد'
      : 'Create New Department';

  useEffect(() => {
    if (department) {
      // When editing, populate fields from database
      const initialData = {
        name: department.name,
        description: department.description || '',
      };
      setFormData(initialData);
      setOriginalData(initialData);
    } else {
      const initialData = {
        name: '',
        description: '',
      };
      setFormData(initialData);
      setOriginalData(initialData);
    }
    setErrors({});
  }, [department, open]);

  // Check if form has changes
  const hasChanges = isEditing
    ? formData.name !== originalData.name ||
      (formData.description || '') !== (originalData.description || '')
    : formData.name.trim() !== '' || (formData.description || '').trim() !== '';

  // Used to disable Create/Update until all required fields are valid
  const isFormValid =
    formData.name.trim().length >=
      VALIDATION_LIMITS.MIN_DEPARTMENT_NAME_LENGTH &&
    (formData.description || '').length <=
      VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH;

  /* ---------- validation helpers ---------- */
  const validateForm = (): boolean => {
    const newErrors: DepartmentFormErrors = {};

    // Name is required
    if (!formData.name.trim()) {
      newErrors.name = isRtl
        ? 'اسم القسم مطلوب'
        : 'Department name is required';
    } else if (
      formData.name.trim().length < VALIDATION_LIMITS.MIN_DEPARTMENT_NAME_LENGTH
    ) {
      newErrors.name = isRtl
        ? `اسم القسم يجب أن يكون على الأقل ${VALIDATION_LIMITS.MIN_DEPARTMENT_NAME_LENGTH} حرفين`
        : `Department name must be at least ${VALIDATION_LIMITS.MIN_DEPARTMENT_NAME_LENGTH} characters`;
    }

    // Description is optional but validate length if provided
    if (
      formData.description &&
      formData.description.length > VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH
    ) {
      newErrors.description = isRtl
        ? `الوصف يجب أن يكون أقل من ${VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH} حرف`
        : `Description must be less than ${VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------- submit ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      await new Promise(r => setTimeout(r, TIMEOUTS.FAKE_DELAY));
      onSubmit(formData);
      onClose();
    } catch {
      // Handle error silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange =
    (field: keyof DepartmentFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };

  /* ---------- form JSX ---------- */
  const formContent = (
    <Box
      component='form'
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        mt: 2,
        direction: isRtl ? 'rtl' : 'ltr',
        color: theme.palette.text.primary,
      }}
    >
      {/* Department name */}
      <TextField
        fullWidth
        label={isRtl ? 'اسم القسم' : 'Department Name'}
        value={formData.name}
        onChange={handleInputChange('name')}
        error={!!errors.name}
        helperText={errors.name}
        required
        InputLabelProps={{
          sx: { color: theme.palette.text.secondary },
        }}
        InputProps={{
          sx: {
            color: theme.palette.text.primary,
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: theme.palette.divider,
            },
            '&:hover fieldset': {
              borderColor: theme.palette.divider,
            },
            '&.Mui-focused fieldset': {
              borderColor: theme.palette.primary.main,
            },
          },
        }}
      />

      {/* Description */}
      <AppTextarea
        label={isRtl ? 'الوصف (اختياري)' : 'Description (Optional)'}
        name='description'
        value={formData.description || ''}
        onChange={handleInputChange('description')}
        error={!!errors.description}
        helperText={
          errors.description ??
          `${(formData.description || '').length}/${VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH}`
        }
        rows={3}
        inputProps={{ maxLength: VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH }}
        inputBackgroundColor={
          theme.palette.mode === 'dark'
            ? theme.palette.background.default
            : theme.palette.background.default
        }
      />

      {Object.keys(errors).length > 0 && (
        <Alert severity='error'>
          {isRtl
            ? 'يرجى تصحيح الأخطاء أعلاه'
            : 'Please correct the errors above'}
        </Alert>
      )}
    </Box>
  );

  /* ---------- action buttons ---------- */
  const actionButtons = (
    <>
      <AppButton
        variantType='secondary'
        onClick={onClose}
        disabled={isSubmitting}
        text={isRtl ? 'إلغاء' : 'Cancel'}
        sx={{ flex: 1 }}
      />
      <AppButton
        variantType='primary'
        type='submit'
        disabled={isSubmitting || !hasChanges || !isFormValid}
        onClick={handleSubmit}
        text={
          isSubmitting
            ? isRtl
              ? 'جاري الحفظ...'
              : 'Saving...'
            : isEditing
              ? isRtl
                ? 'تحديث'
                : 'Update'
              : isRtl
                ? 'إنشاء'
                : 'Create'
        }
        sx={{ flex: 1 }}
      />
    </>
  );

  const paperSx: SxProps<Theme> = {
    direction: isRtl ? 'rtl' : 'ltr',
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
  };

  /* ---------- MOBILE drawer ---------- */
  if (isMobile) {
    return (
      <Drawer
        anchor={isRtl ? 'right' : 'left'}
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: '100%', maxWidth: 400, ...paperSx } }}
      >
        <Box
          sx={{
            p: 3,
            overflowY: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant='h6' sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
            <IconButton
              onClick={onClose}
              size='small'
              aria-label='Close dialog'
              sx={{ color: theme.palette.text.secondary }}
            >
              <CloseIcon aria-hidden='true' />
            </IconButton>
          </Box>
          {formContent}
          <Box
            sx={{ display: 'flex', gap: 1, mt: 3 }}
          >
            {actionButtons}
          </Box>
        </Box>
      </Drawer>
    );
  }

  /* ---------- DESKTOP dialog ---------- */
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isLargeScreen ? 'md' : 'sm'}
      fullWidth
    >
      <DialogTitle sx={{ ...paperSx, position: 'relative' }}>
        <Typography
          sx={{
            textAlign: isRtl ? 'right' : 'left',
            fontWeight: 600,
            fontSize: '1.25rem',
            lineHeight: 1.6,
            letterSpacing: '0.0075em',
          }}
        >
          {title}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: isRtl ? 'auto' : 8,
            left: isRtl ? 8 : 'auto',
            top: 8,
            color: theme.palette.text.secondary,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          ...paperSx,
          pt: 2,
          maxHeight: '70vh',
          overflowY: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
        }}
      >
        {formContent}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2, gap: 1, ...paperSx }}>
        {actionButtons}
      </DialogActions>
    </Dialog>
  );
};
