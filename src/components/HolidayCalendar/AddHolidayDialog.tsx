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
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!date) newErrors.date = 'Date is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newHoliday: Holiday = {
      id: crypto.randomUUID(),
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
