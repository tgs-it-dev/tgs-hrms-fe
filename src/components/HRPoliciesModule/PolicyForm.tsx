import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  TextField,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { Policy } from '../../types/policy';
import AppButton from '../common/AppButton';

interface PolicyFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Policy) => void;
  initialData: Policy | null;
}

const PolicyForm: React.FC<PolicyFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<Policy>({
    id: initialData?.id || crypto.randomUUID(),
    name: initialData?.name || '',
    description: initialData?.description || '',
    type: initialData?.type || '',
    effectiveDate: initialData?.effectiveDate || '',
  });

  const [errors, setErrors] = useState({
    name: '',
    description: '',
    type: '',
    effectiveDate: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        id: crypto.randomUUID(),
        name: '',
        description: '',
        type: '',
        effectiveDate: '',
      });
    }
    setErrors({ name: '', description: '', type: '', effectiveDate: '' });
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const ALLOWED_TYPES = [
    'hr',
    'leave',
    'attendance',
    'code_of_conduct',
    'other',
  ];

  const validate = () => {
    const newErrors = {
      name: '',
      description: '',
      type: '',
      effectiveDate: '',
    };

    if (!formData.name) {
      newErrors.name = 'Policy name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Policy name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Policy name must be 100 characters or less';
    }

    if (!formData.description) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.trim().length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    if (!formData.type) {
      newErrors.type = 'Type is required';
    } else if (!ALLOWED_TYPES.includes(formData.type.toLowerCase())) {
      newErrors.type = `Type must be one of: ${ALLOWED_TYPES.join(', ')}`;
    }

    if (!formData.effectiveDate) {
      newErrors.effectiveDate = 'Effective date is required';
    } else if (!initialData) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const effectiveDate = new Date(formData.effectiveDate);
      if (effectiveDate < today) {
        newErrors.effectiveDate =
          'Effective date cannot be in the past for new policies';
      }
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(err => err !== '');
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {initialData ? 'Edit Policy' : 'Add Policy'}
        <IconButton onClick={onClose} size='small'>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <TextField
          name='name'
          label='Policy Name'
          fullWidth
          margin='normal'
          value={formData.name}
          onChange={handleChange}
          error={!!errors.name}
          helperText={errors.name}
        />
        <TextField
          name='description'
          label='Description'
          fullWidth
          margin='normal'
          value={formData.description}
          onChange={handleChange}
          error={!!errors.description}
          helperText={errors.description}
        />
        <TextField
          name='type'
          label='Type'
          fullWidth
          margin='normal'
          value={formData.type}
          onChange={handleChange}
          error={!!errors.type}
          helperText={errors.type}
        />

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label='Effective Date'
            value={
              formData.effectiveDate ? new Date(formData.effectiveDate) : null
            }
            onChange={newDate => {
              setFormData(prev => ({
                ...prev,
                effectiveDate: newDate
                  ? newDate.toISOString().split('T')[0]
                  : '',
              }));
              setErrors(prev => ({ ...prev, effectiveDate: '' }));
            }}
            slotProps={{
              popper: {
                placement: 'bottom-start',
                modifiers: [
                  {
                    name: 'preventOverflow',
                    options: {
                      boundary: 'viewport',
                    },
                  },
                ],
              },
              textField: {
                fullWidth: true,
                margin: 'normal',
                error: !!errors.effectiveDate,
                helperText: errors.effectiveDate,
              },
            }}
          />
        </LocalizationProvider>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <AppButton
          variant='contained'
          text={initialData ? 'Update' : 'Add'}
          onClick={handleSubmit}
          sx={{ backgroundColor: 'primary.main' }}
        />
      </DialogActions>
    </Dialog>
  );
};

export default PolicyForm;
