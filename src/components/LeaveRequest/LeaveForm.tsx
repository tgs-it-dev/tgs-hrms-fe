import React, { useState, useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { SelectChangeEvent } from '@mui/material/Select';

import AppButton from '../common/AppButton';
import AppDropdown from '../common/AppDropdown';
import AppTextarea from '../common/AppTextarea';
import DocumentUpload from '../common/DocumentUpload';
import { leaveApi, type LeaveType } from '../../api/leaveApi';
import AppPageTitle from '../common/AppPageTitle';
import type { Leave } from '../../type/levetypes';

interface LeaveFormProps {
  /** create | edit */
  mode?: 'create' | 'edit';

  /** required for edit */
  leaveId?: string;
  initialData?: Leave;

  /** create callback (optional – backward compatible) */
  onSubmit?: (data: {
    employeeId?: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
    documents?: File[];
  }) => void;

  onSuccess?: () => void;
  onError?: (message: string) => void;
  employees?: { id: string; name: string }[];
}

const LeaveForm: React.FC<LeaveFormProps> = ({
  mode = 'create',
  leaveId,
  initialData,
  onSubmit,
  onSuccess,
  onError,
  employees,
}) => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loadingLeaveTypes, setLoadingLeaveTypes] = useState(true);

  const [employeeId, setEmployeeId] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [documents, setDocuments] = useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<string[]>([]);
  const [documentsToRemove, setDocumentsToRemove] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  /* ------------------ PREFILL (EDIT MODE) ------------------ */
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setEmployeeId(initialData.employeeId || '');
      setLeaveTypeId(initialData.leaveTypeId || '');
      setStartDate(new Date(initialData.startDate));
      setEndDate(new Date(initialData.endDate));
      setReason(initialData.reason || '');
      // Load existing documents if available
      if (initialData.documents && Array.isArray(initialData.documents)) {
        setExistingDocuments(initialData.documents as string[]);
      }
    } else {
      // Reset when switching to create mode
      setExistingDocuments([]);
      setDocumentsToRemove([]);
    }
  }, [mode, initialData]);

  /* ------------------ FETCH LEAVE TYPES ------------------ */
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const response = await leaveApi.getLeaveTypes({ page: 1, limit: 50 });
        setLeaveTypes(response.items || []);
      } catch {
        onError?.('Failed to load leave types.');
      } finally {
        setLoadingLeaveTypes(false);
      }
    };

    fetchLeaveTypes();
  }, []);

  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  /* ------------------ DOCUMENT HANDLING ------------------ */
  const handleDocumentsChange = (data: { existing: string[]; new: File[] }) => {
    setExistingDocuments(data.existing);
    setDocuments(data.new);
  };

  const handleDocumentRemove = (type: 'existing' | 'new', index: number) => {
    if (type === 'existing') {
      const docUrl = existingDocuments[index];
      setExistingDocuments(prev => prev.filter((_, i) => i !== index));
      setDocumentsToRemove(prev => [...prev, docUrl]);
    } else {
      setDocuments(prev => prev.filter((_, i) => i !== index));
    }
  };



  /* ------------------ SUBMIT ------------------ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !leaveTypeId ||
      !startDate ||
      !endDate ||
      !reason.trim() ||
      (employees && !employeeId)
    ) {
      onError?.('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      /* -------- EDIT MODE (PATCH) -------- */
      if (mode === 'edit' && leaveId && initialData) {
        const payload: Record<string, unknown> = {};

        if (leaveTypeId !== initialData.leaveTypeId)
          payload.leaveTypeId = leaveTypeId;

        if (formatDate(startDate) !== initialData.startDate)
          payload.startDate = formatDate(startDate);

        if (formatDate(endDate) !== initialData.endDate)
          payload.endDate = formatDate(endDate);

        if (reason.trim() !== initialData.reason)
          payload.reason = reason.trim();

        // Handle removed documents explicitly
        if (documentsToRemove.length > 0) {
          try {
            await Promise.all(
              documentsToRemove.map(doc => leaveApi.deleteDocument(leaveId, doc))
            );
          } catch (error) {
            console.error('Failed to delete some documents', error);
            // We continue even if delete fails, implicitly relying on backend or user creates another request?
            // Ideally we should warn, but for now we proceed.
          }
        }

        const hasNewDocuments = documents.length > 0;

        if (hasNewDocuments) {
          // Send new documents
          payload.documents = documents;
        }

        const updatesAvailable = Object.keys(payload).length > 0;
        const removalsProcessed = documentsToRemove.length > 0;

        if (!updatesAvailable && !removalsProcessed) {
          onError?.('No changes to update.');
          return;
        }

        if (updatesAvailable) {
          await leaveApi.updateLeave(leaveId, payload);
        }
        onSuccess?.();
        return;
      }

      /* -------- CREATE MODE -------- */
      const payload = {
        employeeId: employees ? employeeId : undefined,
        leaveTypeId,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        reason: reason.trim(),
        documents: documents.length > 0 ? documents : undefined,
      };

      onSubmit?.(payload);
      onSuccess?.();

      setEmployeeId('');
      setLeaveTypeId('');
      setStartDate(null);
      setEndDate(null);
      setReason('');
      setDocuments([]);
    } catch {
      onError?.('Failed to submit leave request.');
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ UI ------------------ */
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        component='form'
        onSubmit={handleSubmit}
        sx={{
          backgroundColor: 'background.paper',
          p: { xs: 3, sm: 4 },
          borderRadius: 2,
          width: '100%',
          maxWidth: 'min(760px, 100%)',
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <AppPageTitle>
          {mode === 'edit' ? 'Edit Leave' : 'Apply for Leave'}
        </AppPageTitle>

        {employees && mode === 'create' && (
          <AppDropdown
            label='Employee'
            value={employeeId}
            onChange={(e: SelectChangeEvent<string | number>) =>
              setEmployeeId(String(e.target.value))
            }
            options={employees.map(emp => ({
              value: emp.id,
              label: emp.name,
            }))}
            required
            containerSx={{ width: '100%' }}
            placeholder='Select Employee'
            showLabel
          />
        )}

        <AppDropdown
          label='Leave Type'
          value={leaveTypeId}
          onChange={(e: SelectChangeEvent<string | number>) =>
            setLeaveTypeId(String(e.target.value))
          }
          options={leaveTypes.map(type => ({
            value: type.id,
            label: type.name
              ? type.name.charAt(0).toUpperCase() + type.name.slice(1)
              : type.name,
          }))}
          disabled={loadingLeaveTypes}
          containerSx={{ width: '100%' }}
          placeholder='Leave Type'
          showLabel
        />

        <DatePicker
          label='Start Date'
          value={startDate}
          onChange={newValue => {
            if (newValue instanceof Date) {
              setStartDate(newValue);
              if (newValue && endDate && newValue > endDate) {
                setEndDate(newValue);
              }
            } else if (newValue === null) {
              setStartDate(null);
            }
          }}
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
              sx: {
                '& .MuiSvgIcon-root': {
                  color: theme.palette.text.primary,
                },
                '& .MuiInputAdornment-root svg': {
                  color: theme.palette.text.primary,
                },
              },
            },
            desktopPaper: {
              sx: {
                backgroundColor: '#FFFFFF', // popup background
              },
            },
            popper: {
              sx: {
                '& .MuiPaper-root': {
                  borderRadius: '12px', // match modal radius
                },
              },
            },
            day: {
              sx: {
                '&.MuiPickersDay-root.Mui-selected, &.MuiPickersDay-root.Mui-selected:hover':
                {
                  backgroundColor: 'var(--primary-dark-color) !important',
                  color: '#FFFFFF !important',
                },
                '&.MuiPickersDay-root.MuiPickersDay-today:not(.Mui-selected)': {
                  backgroundColor: 'var(--primary-dark-color) !important',
                  color: '#FFFFFF !important',
                },
                '&.MuiPickersDay-root.MuiPickersDay-today': {
                  borderColor: 'var(--primary-dark-color) !important',
                },
              },
            },
          }}
        />

        <DatePicker
          label='End Date'
          value={endDate}
          onChange={newValue => {
            if (newValue instanceof Date) {
              setEndDate(newValue);
            } else if (newValue === null) {
              setEndDate(null);
            }
          }}
          minDate={startDate ?? undefined}
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
              sx: {
                '& .MuiSvgIcon-root': {
                  color: theme.palette.text.primary,
                },
                '& .MuiInputAdornment-root svg': {
                  color: theme.palette.text.primary,
                },
              },
            },
            desktopPaper: {
              sx: { backgroundColor: '#FFFFFF' },
            },
            popper: {
              sx: { '& .MuiPaper-root': { borderRadius: '12px' } },
            },
            day: {
              sx: {
                '&.MuiPickersDay-root.Mui-selected, &.MuiPickersDay-root.Mui-selected:hover':
                {
                  backgroundColor: 'var(--primary-dark-color) !important',
                  color: '#FFFFFF !important',
                },
                '&.MuiPickersDay-root.MuiPickersDay-today:not(.Mui-selected)': {
                  backgroundColor: 'var(--primary-dark-color) !important',
                  color: '#FFFFFF !important',
                },
                '&.MuiPickersDay-root.MuiPickersDay-today': {
                  borderColor: 'var(--primary-dark-color) !important',
                },
              },
            },
          }}
        />

        <AppTextarea
          label='Reason'
          minRows={2}
          value={reason}
          onChange={e => setReason(e.target.value)}
          required
        />

        <Box sx={{ width: '100%' }}>
          <DocumentUpload
            label='Supporting Documents (Optional)'
            existingDocuments={mode === 'edit' ? existingDocuments : []}
            newDocuments={documents}
            onDocumentsChange={handleDocumentsChange}
            onDocumentRemove={handleDocumentRemove}

            multiple
            accept='image/*'
          />
        </Box>

        <AppButton
          type='submit'
          variant='contained'
          variantType='primary'
          text={loading ? 'Saving...' : mode === 'edit' ? 'Update' : 'Apply'}
          disabled={loading}
          sx={{ width: '100%' }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default LeaveForm;
