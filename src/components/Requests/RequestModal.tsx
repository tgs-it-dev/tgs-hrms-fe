import { Box, useTheme, Typography } from '@mui/material';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AppFormModal, { type FormField } from '../common/AppFormModal';
import BasicDatePicker from '../common/BasicDatePicker';
import { useDirectionLabel } from '../../hooks/useDirectionLabel';
import type { Request } from '../../data/mock-requests';
import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import ErrorSnackbar from '../common/ErrorSnackbar';

dayjs.extend(customParseFormat);

function RequestModal({
  open,
  onClose,
  onSuccess,
  title,
  initialData,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
  title: string;
  initialData?: Request | null;
}) {
  const theme = useTheme();
  const getLabel = useDirectionLabel();

  // State variables
  const [titleVal, setTitleVal] = useState('');
  const [reqType, setReqType] = useState('wfh');
  const [reason, setReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);

  // Status/Feedback states
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Handle date change
  const handleFromDateChange = useCallback((date: Dayjs | null) => {
    setFromDate(date);
  }, []);

  const handleToDateChange = useCallback((date: Dayjs | null) => {
    setToDate(date);
  }, []);

  // Sync state when initialData or open status changes
  useEffect(() => {
    if (open) {
      // Reset snackbar on open
      setSnackbar({ open: false, message: '', severity: 'success' });

      if (initialData) {
        setTitleVal(initialData.title || '');
        setReqType(
          initialData.type?.toLowerCase() === 'wfh' ||
            initialData.type?.toLowerCase() === 'work from home'
            ? 'wfh'
            : 'leave'
        );
        // Convert string date to Dayjs (mock data uses DD/MM/YYYY)
        setFromDate(
          initialData.startDate
            ? dayjs(initialData.startDate, 'DD/MM/YYYY')
            : null
        );
        setToDate(
          initialData.endDate ? dayjs(initialData.endDate, 'DD/MM/YYYY') : null
        );

        // Try to match reason if it's one of the keys, otherwise leave empty or handle mapping
        const r = initialData.reason?.toLowerCase() || '';
        if (['personal', 'official', 'other'].includes(r)) {
          setReason(r);
        } else {
          setReason('other');
          setAdditionalDetails(initialData.reason || '');
        }
      } else {
        // Reset for new request
        setTitleVal('');
        setReqType('wfh');
        setFromDate(null);
        setToDate(null);
        setReason('');
        setAdditionalDetails('');
      }
    }
  }, [initialData, open]);

  // Memoize custom component nodes to avoid re-creation on every render
  const datesComponent = useMemo(
    () => (
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          width: '100%',
        }}
      >
        <BasicDatePicker
          label={getLabel('From Date', 'تاريخ البدء')}
          value={fromDate}
          labelClassName='label'
          onChange={handleFromDateChange}
          placeholder={getLabel('Select date', 'اختر التاريخ')}
        />
        <BasicDatePicker
          label={getLabel('To Date', 'تاريخ الانتهاء')}
          value={toDate}
          labelClassName='label'
          onChange={handleToDateChange}
          placeholder={getLabel('Select date', 'اختر التاريخ')}
        />
      </Box>
    ),
    [fromDate, toDate, handleFromDateChange, handleToDateChange, getLabel]
  );

  const wfhInfoComponent = useMemo(
    () => (
      <Box
        sx={{
          backgroundColor: 'background.default',
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          borderRadius: 'var(--border-radius-2xl)',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          mt: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 600,
            color: theme.palette.text.secondary,
          }}
        >
          {getLabel(
            'Your availability during WFH',
            'تواجدك خلال العمل من المنزل'
          )}
        </Typography>
        <Typography
          sx={{
            fontSize: '13px',
            color: theme.palette.text.primary,
            lineHeight: '1.4',
          }}
        >
          {getLabel(
            "You'll remain available on Slack, email, and video calls as per office hours (9 AM - 6 PM).",
            'ستبقى متاحاً على Slack والبريد الإلكتروني ومكالمات الفيديو حسب ساعات العمل (9 صباحاً - 6 مساءً).'
          )}
        </Typography>
      </Box>
    ),
    [
      theme.palette.primary.main,
      theme.palette.text.secondary,
      theme.palette.text.primary,
      getLabel,
    ]
  );

  const fields: FormField[] = useMemo(
    () => [
      {
        name: 'title',
        label: getLabel('Title', 'العنوان'),
        type: 'text',
        placeholder: getLabel('Title', 'العنوان'),
        value: titleVal,
        onChange: val => setTitleVal(String(val)),
        required: true,
      },
      {
        name: 'reqType',
        label: getLabel('Request Type', 'نوع الطلب'),
        type: 'dropdown',
        placeholder: getLabel('Select', 'اختر النوع'),
        options: [
          {
            value: 'wfh',
            label: getLabel('Work From Home', 'العمل من المنزل'),
          },
          { value: 'leave', label: getLabel('Leave', 'إجازة') },
        ],
        value: reqType,
        onChange: val => setReqType(String(val)),
        required: true,
      },
      {
        name: 'dates',
        label: '',
        component: datesComponent,
        value: '',
        onChange: () => {},
      },
      {
        name: 'reason',
        label: getLabel('Reason', 'السبب'),
        type: 'dropdown',
        placeholder: getLabel('Select', 'اختر السبب'),
        options: [
          { value: 'personal', label: getLabel('Personal', 'شخصي') },
          { value: 'official', label: getLabel('Official', 'رسمي') },
          { value: 'other', label: getLabel('Other', 'أخرى') },
        ],
        value: reason,
        onChange: (val: string | number) => setReason(String(val)),
        required: true,
      },
      {
        name: 'additionalDetails',
        label: getLabel(
          'Additional Details (Optional)',
          'تفاصيل إضافية (اختياري)'
        ),
        type: 'text',
        placeholder: getLabel(
          'Enter any additional details...',
          'أدخل أي تفاصيل إضافية...'
        ),
        value: additionalDetails,
        onChange: (val: string | number) => setAdditionalDetails(String(val)),
      },
      {
        name: 'wfhInfo',
        label: '',
        component: wfhInfoComponent,
        value: '',
        onChange: () => {},
      },
    ],
    [
      titleVal,
      reqType,
      datesComponent,
      reason,
      additionalDetails,
      wfhInfoComponent,
      getLabel,
    ]
  );

  const filterFields = useMemo(
    () =>
      reqType === 'leave' ? fields.filter(f => f.name !== 'wfhInfo') : fields,
    [reqType, fields]
  );

  const handleSubmit = useCallback(async () => {
    // Basic validation
    if (!titleVal || !fromDate || !toDate || !reason) {
      setSnackbar({
        open: true,
        message: getLabel(
          'Please fill all required fields.',
          'يرجى ملء جميع الحقول المطلوبة.'
        ),
        severity: 'error',
      });
      return;
    }

    // .isBefore() returns false for the same day, which is correct for single-day requests.
    // The null-check earlier (line 267) ensures fromDate and toDate are defined here.
    if (toDate.isBefore(fromDate)) {
      setSnackbar({
        open: true,
        message: getLabel(
          'End date cannot be before start date.',
          'لا يمكن أن يكون تاريخ الانتهاء قبل تاريخ البدء.'
        ),
        severity: 'error',
      });
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const msg = initialData
        ? getLabel('Request updated successfully!', 'تم تحديث الطلب بنجاح!')
        : getLabel('Request submitted successfully!', 'تم تقديم الطلب بنجاح!');

      if (onSuccess) {
        onSuccess(msg);
      } else {
        setSnackbar({
          open: true,
          message: msg,
          severity: 'success',
        });
        setTimeout(onClose, 500);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: getLabel('Something went wrong.', 'حدث خطأ ما.'),
        severity: 'error',
      });
      console.error(error);
    }
  }, [
    titleVal,
    fromDate,
    toDate,
    reason,
    initialData,
    onClose,
    onSuccess,
    getLabel,
  ]);

  return (
    <>
      <AppFormModal
        title={title}
        open={open}
        onClose={onClose}
        onSubmit={handleSubmit}
        fields={filterFields}
        submitLabel={
          initialData
            ? getLabel('Save Changes', 'حفظ التغييرات')
            : getLabel('Submit Request', 'إرسال الطلب')
        }
        cancelLabel={getLabel('Cancel', 'إلغاء')}
      />
      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      />
    </>
  );
}

export default RequestModal;
