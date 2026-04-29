import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
} from '@mui/material';

interface ManagerResponseDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => void;
}

const ManagerResponseDialog = ({
  open,
  onClose,
  onConfirm,
}: ManagerResponseDialogProps) => {
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (open) {
      setComment('');
    } else {
      setComment('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (comment.trim()) {
      onConfirm(comment);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle sx={{ fontWeight: 600, textAlign: 'center' }}>
        Manager Response
      </DialogTitle>
      <DialogContent>
        <Typography align='center' sx={{ mb: 2 }}>
          Add your comments or response for this leave request.
        </Typography>
        <TextField
          label='Manager Comments'
          value={comment}
          onChange={e => setComment(e.target.value)}
          fullWidth
          multiline
          minRows={4}
          sx={{ mt: 1 }}
          placeholder='Enter your comments about this leave request...'
          required
        />
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2, px: 3 }}>
        <Button onClick={onClose} variant='outlined' color='inherit'>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant='contained'
          disabled={!comment.trim()}
          sx={{
            backgroundColor: 'var(--primary-dark-color)',
            '&:hover': { backgroundColor: 'var(--primary-dark-color)' },
            textTransform: 'none',
          }}
        >
          Save Response
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManagerResponseDialog;
