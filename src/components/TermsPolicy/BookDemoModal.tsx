import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import AppFormModal from '../common/AppFormModal';
import AppInputField from '../common/AppInputField';
import AppDropdown from '../common/AppDropdown';
import AppButton from '../common/AppButton';
import { validateEmailAddress } from '../../utils/validation';

type BookDemoModalProps = {
  open: boolean;
  onClose: () => void;
};

const TEAM_SIZE_OPTIONS = [
  { value: '', label: 'Select' },
  { value: '1-20', label: '1-20 people' },
  { value: '21-200', label: '21-200 people' },
  { value: '201-1000', label: '201-1000 people' },
  { value: '1001-2000', label: '1001-2000 people' },
  { value: '2001+', label: '2001+ people' },
] as const;

const BookDemoModal: React.FC<BookDemoModalProps> = ({ open, onClose }) => {
  const theme = useTheme();

  const [fullName, setFullName] = React.useState('');
  const [workEmail, setWorkEmail] = React.useState('');
  const [companyName, setCompanyName] = React.useState('');
  const [teamSize, setTeamSize] = React.useState<string>('');
  const [errors, setErrors] = React.useState<{
    fullName?: string;
    workEmail?: string;
    companyName?: string;
    teamSize?: string;
  }>({});

  const reset = React.useCallback(() => {
    setFullName('');
    setWorkEmail('');
    setCompanyName('');
    setTeamSize('');
    setErrors({});
  }, []);

  const handleClose = React.useCallback(() => {
    onClose();
    reset();
  }, [onClose, reset]);

  const handleSubmit = () => {
    const nextErrors: typeof errors = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      nextErrors.fullName = 'Full name must be at least 2 characters';
    }

    const emailError = validateEmailAddress(workEmail);
    if (emailError) {
      nextErrors.workEmail = emailError;
    }

    if (!companyName.trim() || companyName.trim().length < 2) {
      nextErrors.companyName = 'Company name must be at least 2 characters';
    }

    if (!teamSize) {
      nextErrors.teamSize = 'Please select a team size';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    handleClose();
  };

  const hasErrors = Object.values(errors).some(Boolean);

  const controlBg =
    theme.palette.mode === 'dark'
      ? theme.palette.background.default
      : theme.palette.background.default;

  return (
    <AppFormModal
      open={open}
      onClose={handleClose}
      title='Book a Free Demo'
      hideActions
      wrapInForm={false}
      maxWidth='sm'
      paperSx={{
        width: { xs: '100%', sm: '680px', lg: '720px' },
        maxWidth: { xs: '100%', sm: '680px', lg: '720px' },
        borderRadius: { xs: '16px', sm: '24px' },
        px: { xs: 2, sm: 3.5 },
        py: { xs: 2, sm: 0 },
        '& .MuiDialogTitle-root': {
          pb: 0,
        },
      }}
    >
      <Box sx={{ mx: -2 }}>
        <Typography
          sx={{ color: theme.palette.text.secondary, fontSize: '14px', mt: -1 }}
        >
          See Workonnect.ai in action. A 30-minute walkthrough built around your
          team&apos;s needs.
        </Typography>

        <Box
          sx={{
            mt: 2,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
            '& .book-demo-label': {
              fontWeight: '400 !important',
              fontStyle: 'normal !important',
              fontSize: '14px !important',
            },
          }}
        >
          <AppInputField
            label='Full Name'
            labelClassName='book-demo-label'
            value={fullName}
            placeholder='Name'
            inputBackgroundColor={controlBg}
            onValueChange={value => {
              setFullName(String(value));
              if (errors.fullName)
                setErrors(prev => ({ ...prev, fullName: undefined }));
            }}
            error={Boolean(errors.fullName)}
            helperText={errors.fullName}
          />
          <AppInputField
            label='Work Email'
            labelClassName='book-demo-label'
            value={workEmail}
            placeholder='Email'
            inputBackgroundColor={controlBg}
            onValueChange={value => {
              setWorkEmail(String(value));
              if (errors.workEmail)
                setErrors(prev => ({ ...prev, workEmail: undefined }));
            }}
            error={Boolean(errors.workEmail)}
            helperText={errors.workEmail}
          />
          <AppInputField
            label='Company Name'
            labelClassName='book-demo-label'
            value={companyName}
            placeholder='Company Name'
            inputBackgroundColor={controlBg}
            onValueChange={value => {
              setCompanyName(String(value));
              if (errors.companyName)
                setErrors(prev => ({ ...prev, companyName: undefined }));
            }}
            error={Boolean(errors.companyName)}
            helperText={errors.companyName}
          />
          <Box>
            <AppDropdown
              label='Team Size'
              labelClassName='book-demo-label'
              options={[...TEAM_SIZE_OPTIONS]}
              value={teamSize}
              placeholder='Select'
              inputBackgroundColor={controlBg}
              onChange={(e: SelectChangeEvent<string | number | string[]>) => {
                setTeamSize(String(e.target.value ?? ''));
                if (errors.teamSize)
                  setErrors(prev => ({ ...prev, teamSize: undefined }));
              }}
              error={Boolean(errors.teamSize)}
              helperText={errors.teamSize}
            />
          </Box>
        </Box>

        <Box sx={{ mt: 2.5 }}>
          <AppButton
            fullWidth
            variant='contained'
            onClick={handleSubmit}
            disabled={hasErrors}
            sx={{
              backgroundColor: 'text.primary',
              borderRadius: '999px',
              py: 1.3,
              fontWeight: 700,
              '&:hover': { backgroundColor: 'text.primary', opacity: 0.85 },
              '&:disabled': {
                backgroundColor: 'text.primary',
                opacity: 0.5,
                color: 'common.white',
              },
            }}
          >
            Book a Demo
          </AppButton>
          <Typography
            sx={{
              mt: 1.25,
              textAlign: 'center',
              color: theme.palette.text.secondary,
              fontSize: '13px',
            }}
          >
            No commitment. Free 30 minutes.
          </Typography>
        </Box>
      </Box>
    </AppFormModal>
  );
};

export default BookDemoModal;
