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
import { COLORS } from '../../constants/appConstants';

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

  const validate = () => {
    const newErrors = {
      name: formData.name ? '' : 'Policy name is required',
      description: formData.description ? '' : 'Description is required',
      type: formData.type ? '' : 'Type is required',
      effectiveDate: formData.effectiveDate ? '' : 'Effective date is required',
    };

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
          sx={{ backgroundColor: COLORS.PRIMARY }}
        />
      </DialogActions>
    </Dialog>
  );
};

export default PolicyForm;
