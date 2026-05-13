import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  IconButton,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CloseIcon from '@mui/icons-material/Close';
import { v4 as uuidv4 } from 'uuid';
import type { Holiday } from '../../types/holiday';

interface AddHolidayDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (newHoliday: Holiday) => void;
}

const AddHolidayDialog: React.FC<AddHolidayDialogProps> = ({
  open,
  onClose,
  onAdd,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ title?: string; date?: string }>({});

  const handleSubmit = () => {
    const newErrors: typeof errors = {};
    if (!title.trim() || title.trim().length < 2) {
      newErrors.title = 'Title must be at least 2 characters';
    }
    if (!date) {
      newErrors.date = 'Date is required';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        newErrors.date = 'Holiday date cannot be in the past';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newHoliday: Holiday = {
      id: uuidv4(),
      title: title.trim(),
      date: date?.toISOString().split('T')[0] || '',
      description: description.trim(),
    };

    onAdd(newHoliday);
    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setDate(null);
    setDescription('');
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth='sm'>
      <DialogTitle>
        Add Holiday
        <IconButton
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <TextField
          label='Title'
          fullWidth
          margin='dense'
          value={title}
          onChange={e => setTitle(e.target.value)}
          error={Boolean(errors.title)}
          helperText={errors.title}
          inputProps={{ maxLength: 200 }}
        />

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label='Date'
            value={date}
            onChange={newDate => setDate(newDate)}
            slotProps={{
              textField: {
                fullWidth: true,
                margin: 'dense',
                error: Boolean(errors.date),
                helperText: errors.date,
              },
            }}
          />
        </LocalizationProvider>

        <TextField
          label='Description'
          fullWidth
          margin='dense'
          multiline
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
          inputProps={{ maxLength: 500 }}
        />
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        <Button variant='contained' onClick={handleSubmit}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddHolidayDialog;
