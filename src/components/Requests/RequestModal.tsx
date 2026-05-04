import { Box, useTheme, Typography } from '@mui/material';
import { useState, useEffect } from 'react';
import AppFormModal, { type FormField } from '../common/AppFormModal';
import BasicDatePicker from '../common/BasicDatePicker';

interface Request {
  id: number;
  title: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  reason: string;
}

function RequestModal({
  open,
  onClose,
  title,
  initialData,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  initialData?: Request | null;
}) {
  const theme = useTheme();

  const direction = theme.direction;

  // State variables
  const [titleVal, setTitleVal] = useState('');
  const [reqType, setReqType] = useState('wfh');
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');

  // Sync state when initialData or open status changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitleVal(initialData.title || '');
        setReqType(
          initialData.type?.toLowerCase() === 'wfh' ||
            initialData.type?.toLowerCase() === 'work from home'
            ? 'wfh'
            : 'leave'
        );
        setFromDate(initialData.startDate);
        setToDate(initialData.endDate);

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

  const getLabel = (en: string, ar: string) => (direction === 'rtl' ? ar : en);

  const fields: FormField[] = [
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
      component: (
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
            onChange={date => setFromDate(date)}
            placeholder={getLabel('Select date', 'اختر التاريخ')}
            required
          />
          <BasicDatePicker
            label={getLabel('To Date', 'تاريخ الانتهاء')}
            value={toDate}
            labelClassName='label'
            onChange={date => setToDate(date)}
            placeholder={getLabel('Select date', 'اختر التاريخ')}
            required
          />
        </Box>
      ),
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
      onChange: (val: string) => setReason(String(val)),
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
      onChange: (val: string) => setAdditionalDetails(String(val)),
    },
    {
      name: 'wfhInfo',
      label: '',
      component:
        reqType === 'wfh' ? (
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
        ) : null,
      value: '',
      onChange: () => {},
    },
  ];

  const handleSubmit = () => {
    onClose();
  };

  return (
    <AppFormModal
      title={title}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      fields={fields}
      submitLabel={
        initialData
          ? getLabel('Save Changes', 'حفظ التغييرات')
          : getLabel('Submit Request', 'إرسال الطلب')
      }
      cancelLabel={getLabel('Cancel', 'إلغاء')}
    />
  );
}

export default RequestModal;
