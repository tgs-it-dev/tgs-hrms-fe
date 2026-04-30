import type React from 'react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useLanguage } from '../../hooks/useLanguage';
import {
  departmentApiService,
  type FrontendDepartment,
} from '../../api/departmentApi';
import AppButton from '../common/AppButton';

interface Designation {
  id: string;
  title: string;
  titleAr: string;
  departmentId: string;
}

interface DesignationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    titleAr: string;
    departmentId: string;
  }) => void;
  designation: Designation | null;
  isRTL: boolean;
}

export default function DesignationModal({
  open,
  onClose,
  onSave,
  designation,
  isRTL,
}: DesignationModalProps) {
  const { language } = useLanguage();
  const getText = (en: string, ar: string) => (language === 'ar' ? ar : en);
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalTitleAr, setOriginalTitleAr] = useState('');
  const [originalDepartmentId, setOriginalDepartmentId] = useState('');
  const [departments, setDepartments] = useState<FrontendDepartment[]>([]);
  // const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    titleAr?: string;
    departmentId?: string;
  }>({});

  // Load departments when modal opens
  useEffect(() => {
    if (open) {
      loadDepartments();
    }
  }, [open]);

  useEffect(() => {
    if (designation) {
      setTitle(designation.title);
      setTitleAr(designation.titleAr || '');
      setDepartmentId(designation.departmentId);
      setOriginalTitle(designation.title);
      setOriginalTitleAr(designation.titleAr || '');
      setOriginalDepartmentId(designation.departmentId);
    } else {
      setTitle('');
      setTitleAr('');
      setDepartmentId('');
      setOriginalTitle('');
      setOriginalTitleAr('');
      setOriginalDepartmentId('');
    }
    setErrors({});
  }, [designation, open]);

  const loadDepartments = async () => {
    try {
      // setLoadingDepartments(true);
      const backendDepartments = await departmentApiService.getAllDepartments();
      const frontendDepartments = backendDepartments.map(dept =>
        departmentApiService.convertBackendToFrontend(dept)
      );
      setDepartments(frontendDepartments);
    } catch {
      setDepartments([]);
    } finally {
      // setLoadingDepartments(false);
    }
  };

  // Check if form has changes
  const hasChanges = designation
    ? title !== originalTitle ||
      titleAr !== originalTitleAr ||
      departmentId !== originalDepartmentId
    : title.trim() !== '' || titleAr.trim() !== '' || departmentId !== '';

  // Disable Create/Update until required fields are present (and basic validation passes)
  const isFormValid =
    title.trim().length > 0 &&
    departmentId.trim().length > 0 &&
    (!titleAr.trim() || titleAr.trim().length >= 2);

  const validateForm = () => {
    const newErrors: {
      title?: string;
      titleAr?: string;
      departmentId?: string;
    } = {};

    if (!title.trim()) {
      newErrors.title = getText(
        'Designation title is required',
        'عنوان المسمى الوظيفي مطلوب'
      );
    }

    if (!designation && !departmentId) {
      newErrors.departmentId = getText(
        'Please select a department',
        'يرجى اختيار قسم'
      );
    }

    // Arabic title is optional but if provided, validate it
    if (titleAr.trim() && titleAr.trim().length < 2) {
      newErrors.titleAr = getText(
        'Arabic title must be at least 2 characters',
        'العنوان بالعربية يجب أن يكون على الأقل حرفين'
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave({ title: title.trim(), titleAr: titleAr.trim(), departmentId });
      handleClose();
    }
  };

  const handleClose = () => {
    setTitle('');
    setTitleAr('');
    setDepartmentId('');
    setErrors({});
    onClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog
      className='Ramish first'
      open={open}
      onClose={handleClose}
      fullScreen={false}
      fullWidth={!isLargeScreen}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: {
            xs: '100%',
            sm: '90%',
            md: '600px',
            lg: '527px', // Fixed width on large screens
          },
          maxWidth: {
            xs: '100%',
            sm: '90%',
            md: '600px',
            lg: '527px',
          },
          borderRadius: { xs: '20px', sm: '30px' },
          padding: {
            xs: '20px 16px',
            sm: '24px 20px',
            lg: '32px 20px', // 32px top/bottom, 20px left/right on large screens
          },
          backgroundColor: theme.palette.background.paper,
          margin: { xs: '16px', lg: 'auto' },
        },
      }}
      sx={{
        '& .MuiDialog-paper': {
          margin: { xs: '16px', lg: 'auto' },
        },
        '& .MuiBackdrop-root': {
          backgroundColor:
            theme.palette.mode === 'dark'
              ? 'rgba(0, 0, 0, 0.7)'
              : 'rgba(0, 0, 0, 0.5)',
        },
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <DialogTitle
        sx={{
          p: 0,
          pb: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant='h6' sx={{ color: theme.palette.text.primary }}>
            {designation
              ? getText('Edit Designation', 'تعديل المسمى الوظيفي')
              : getText('Create New Designation', 'إنشاء مسمى وظيفي جديد')}
          </Typography>
          <IconButton
            onClick={handleClose}
            size='small'
            aria-label='Close designation modal'
            sx={{ color: theme.palette.text.secondary }}
          >
            <CloseIcon aria-hidden='true' />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          pt: 0, // No top padding since title has bottom padding
          pb: { xs: 2, sm: 3, lg: '32px' }, // 32px spacing between content and actions on large screens
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 2, sm: 3, lg: '32px' }, // 32px gap on large screens
            pt: { xs: 1, lg: 0 },
          }}
        >
          <AppDropdown
            label={getText('Department', 'القسم')}
            options={departments.map(dept => ({
              value: dept.id,
              label: getText(dept.name, dept.nameAr),
            }))}
            value={departmentId}
            onChange={(e: SelectChangeEvent<string | number>) => {
              setDepartmentId(String(e.target.value));
              if (errors.departmentId) {
                setErrors(prev => ({ ...prev, departmentId: undefined }));
              }
            }}
            error={!!errors.departmentId}
            helperText={errors.departmentId}
            required
          />
          <TextField
            label={getText(
              'Designation Title',
              'عنوان المسمى الوظيفي (بالإنجليزية)'
            )}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            error={!!errors.title}
            helperText={errors.title}
            fullWidth
            required
            autoFocus={designation ? !isMobile : false}
            inputProps={{
              dir: 'ltr',
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.background.default
                    : 'background.default',
              },
            }}
          />
          {/* <TextField
            label={getText(
              'Designation Title (Arabic - Optional)',
              'عنوان المسمى الوظيفي (بالعربية - اختياري)'
            )}
            value={titleAr}
            onChange={e => setTitleAr(e.target.value)}
            onKeyPress={handleKeyPress}
            error={!!errors.titleAr}
            helperText={errors.titleAr}
            fullWidth
            inputProps={{
              dir: 'rtl',
            }}
          /> */}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 0,
          pt: 0,
          px: 2,
          pb: 2,
        }}
      >
        <AppButton
          variantType='secondary'
          onClick={handleClose}
          text={getText('Cancel', 'إلغاء')}
        />
        <AppButton
          variantType='primary'
          onClick={handleSubmit}
          disabled={!hasChanges || !isFormValid}
          text={
            designation
              ? getText('Update', 'تحديث')
              : getText('Create', 'إنشاء')
          }
        />
      </DialogActions>
    </Dialog>
  );
}
