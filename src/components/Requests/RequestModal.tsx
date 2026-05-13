import { Box, useTheme, Typography } from '@mui/material';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AppFormModal, { type FormField } from '../common/AppFormModal';
import BasicDatePicker from '../common/BasicDatePicker';
import { useDirectionLabel } from '../../hooks/useDirectionLabel';
import dayjs, { type Dayjs } from 'dayjs';

import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import wfhApi from '../../api/wfhApi';
import { leaveApi, type LeaveType } from '../../api/leaveApi';
import DocumentUpload from '../common/DocumentUpload';
import type { RequestData, WorkflowRequest } from '../../api/workflowApi';
import overtimeApi from '../../api/overtimeApi';
import { useFeatureToggles } from '../../context/FeatureToggleContext';
import { getDocumentUrl } from '../../utils/fileUtils';

function RequestModal({
  open,
  onClose,
  title,
  initialData,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  initialData?: Request | RequestData | WorkflowRequest | null;
  onSuccess?: () => void;
}) {
  const theme = useTheme();
  const getLabel = useDirectionLabel();
  const { showError, showSuccess, snackbar, closeSnackbar } = useErrorHandler();
  const { isFeatureEnabled } = useFeatureToggles();

  // State variables
  const [reqType, setReqType] = useState('wfh');
  const [reason, setReason] = useState('');
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [existingDocuments, setExistingDocuments] = useState<string[]>([]);
  const [newDocuments, setNewDocuments] = useState<File[]>([]);
  const [hours, setHours] = useState('');
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overtimeMode, setOvertimeMode] = useState<'hours' | 'range'>('range');
  // types dropdown
  const availableRequestTypes = useMemo(() => {
    const types = [];
    if (isFeatureEnabled('wfh_workflow_enabled')) {
      types.push({
        value: 'wfh',
        label: getLabel('Work From Home', 'العمل من المنزل'),
      });
    }
    if (isFeatureEnabled('leave_workflow_enabled')) {
      types.push({ value: 'leave', label: getLabel('Leave', 'إجازة') });
    }
    if (isFeatureEnabled('overtime_workflow_enabled')) {
      types.push({
        value: 'overtime',
        label: getLabel('Overtime', 'العمل الإضافي'),
      });
    }
    return types;
  }, [isFeatureEnabled, getLabel]);

  // Snapshot of initial values when edit modal opens — used to detect unchanged submissions
  const [initialSnapshot, setInitialSnapshot] = useState<{
    reason: string;
    fromDate: string | null;
    toDate: string | null;
    leaveTypeId: string;
    hours: string;
  } | null>(null);

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
      if (initialData) {
        // Narrowing logic
        let type = 'wfh';
        let data: Request | RequestData | WorkflowRequest = initialData;
        let format = 'YYYY-MM-DD';

        if ('request_data' in initialData) {
          // WorkflowRequest
          const wr = initialData as WorkflowRequest;
          type = wr.request_type;
          data = wr.request_data;
        } else if ('type' in initialData) {
          // Legacy Request
          const lr = initialData as Request;
          type = lr.type;
          data = lr;
          format = 'DD/MM/YYYY';
        } else {
          // RequestData
          data = initialData as RequestData;
          // type stays 'wfh' as fallback
        }

        setReqType(
          type === 'wfh' ? 'wfh' : type === 'overtime' ? 'overtime' : 'leave'
        );

        // Convert string date to Dayjs
        const start =
          format === 'YYYY-MM-DD' ? data.start_date : data.startDate;
        const end = format === 'YYYY-MM-DD' ? data.end_date : data.endDate;

        setFromDate(start ? dayjs(start, format) : null);
        setToDate(end ? dayjs(end, format) : null);

        // Set reason
        setReason(data.reason || '');

        // Set leave type if editing a leave
        if (type === 'leave') {
          setLeaveTypeId(data.leave_type_id || data.leaveTypeId || '');
        }

        // Set hours if editing overtime
        if (type === 'overtime') {
          if (data.hours && !data.end_date) {
            setOvertimeMode('hours');
            setHours(data.hours || '');
            setToDate(null);
          } else if (data.end_date && !data.hours) {
            setOvertimeMode('range');
            setHours('');
          }
        }

        // Capture initial snapshot so we can detect no-op edits
        setInitialSnapshot({
          reason: data.reason || '',
          fromDate:
            (format === 'YYYY-MM-DD' ? data.start_date : data.startDate) ??
            null,
          toDate:
            (format === 'YYYY-MM-DD' ? data.end_date : data.endDate) ?? null,
          leaveTypeId: data.leave_type_id || data.leaveTypeId || '',
          hours: data.hours || '',
        });
      } else {
        // Reset for new request
        setReqType(availableRequestTypes[0]?.value || 'wfh');
        setFromDate(null);
        setToDate(null);
        setReason('');
        setHours('');
        setLeaveTypeId('');
        setNewDocuments([]);
        setOvertimeMode('range');
        setInitialSnapshot(null);
      }
      // Initialize state when editing
      if (initialData) {
        // For WorkflowRequest the documents live inside request_data.attachments
        let docs: string[] = [];
        if ('request_data' in initialData) {
          // WorkflowRequest shape
          const wr = initialData as WorkflowRequest;
          docs = Array.isArray(wr.request_data?.attachments)
            ? (wr.request_data.attachments as string[])
            : [];
          const updatedDocs = docs.map(doc => getDocumentUrl(doc));
          docs = updatedDocs;
        } else {
          // Legacy Request / RequestData — attachments at the top level
          const topLevel = (initialData as Request | RequestData).attachments;
          docs = Array.isArray(topLevel) ? (topLevel as string[]) : [];
        }
        setExistingDocuments(docs);
        // New documents are empty on edit
        setNewDocuments([]);
      } else {
        // Reset for new request
        setReqType(availableRequestTypes[0]?.value || 'wfh');
        setFromDate(null);
        setToDate(null);
        setReason('');
        setHours('');
        setLeaveTypeId('');
        setExistingDocuments([]);
        setNewDocuments([]);
        setOvertimeMode('range');
      }
    }
  }, [initialData, open]);

  // Fetch leave types when switching to leave
  useEffect(() => {
    if (open && reqType === 'leave' && leaveTypes.length === 0) {
      const fetchLeaveTypes = async () => {
        try {
          const resp = await leaveApi.getLeaveTypes();
          setLeaveTypes(resp.items || []);
        } catch (err) {
          showError(err);
        }
      };
      fetchLeaveTypes();
    }
  }, [open, reqType, leaveTypes.length, showError]);

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
        {(reqType !== 'overtime' || overtimeMode === 'range') && (
          <BasicDatePicker
            label={getLabel('To Date', 'تاريخ الانتهاء')}
            value={toDate}
            labelClassName='label'
            onChange={handleToDateChange}
            placeholder={getLabel('Select date', 'اختر التاريخ')}
          />
        )}
      </Box>
    ),
    [
      fromDate,
      toDate,
      handleFromDateChange,
      handleToDateChange,
      getLabel,
      reqType,
      overtimeMode,
    ]
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
        name: 'reqType',
        label: getLabel('Request Type', 'نوع الطلب'),
        type: 'dropdown' as const,
        placeholder: getLabel('Select', 'اختر النوع'),
        options: availableRequestTypes,
        value: reqType,
        onChange: val => {
          const type = String(val);
          setReqType(type);
          if (type === 'overtime') {
            setOvertimeMode('range');
            setToDate(null);
          }
        },
        disabled: !!initialData,
        required: true,
      },
      // ...(reqType === 'overtime'
      //   ? [
      //     {
      //       name: 'overtimeMode',
      //       label: getLabel('Overtime Mode', 'وضع العمل الإضافي'),
      //       type: 'dropdown' as const,
      //       options: [
      //         {
      //           value: 'hours',
      //           label: getLabel(
      //             'Hours Mode (Single Day)',
      //             'وضع الساعات (يوم واحد)'
      //           ),
      //         },
      //         {
      //           value: 'range',
      //           label: getLabel(
      //             'Range Mode (Date Range)',
      //             'وضع النطاق (نطاق تاريخ)'
      //           ),
      //         },
      //       ],
      //       value: overtimeMode,
      //       onChange: (val: string | number) => {
      //         const mode = val as 'hours' | 'range';
      //         setOvertimeMode(mode);
      //         if (mode === 'hours') {
      //           setToDate(null);
      //         } else {
      //           setHours('');
      //         }
      //       },
      //       required: true,
      //     },
      //   ]
      //   : []),
      {
        name: 'dates',
        label: '',
        component: datesComponent,
        value: '',
        onChange: () => {},
      },
      ...(reqType === 'overtime' && overtimeMode === 'hours'
        ? [
            {
              name: 'hours',
              label: getLabel('Hours', 'الساعات'),
              type: 'text' as const,
              value: hours,
              onChange: (val: string | number) => setHours(String(val)),
              required: true,
            },
          ]
        : []),
      ...(reqType === 'leave'
        ? [
            {
              name: 'leaveTypeId',
              label: getLabel('Leave Type', 'نوع الإجازة'),
              type: 'dropdown' as const,
              placeholder: getLabel('Select', 'اختر النوع'),
              options: leaveTypes.map(lt => ({
                value: lt.id,
                label: lt.name.charAt(0).toUpperCase() + lt.name.slice(1),
              })),
              value: leaveTypeId,
              onChange: (val: string | number) => setLeaveTypeId(String(val)),
              required: true,
            },
          ]
        : []),
      {
        name: 'reason',
        label: getLabel('Reason', 'السبب'),
        type: 'textarea' as const,
        placeholder: getLabel('Enter reason', 'أدخل السبب'),
        value: reason,
        onChange: (val: string | number) => setReason(String(val)),
        required: true,
        minLength: 10,
      },
      {
        name: 'documents',
        label: getLabel('Attachments', 'المرفقات'),
        component: (
          <DocumentUpload
            existingDocuments={existingDocuments}
            newDocuments={newDocuments}
            onDocumentsChange={({ existing, new: docs }) => {
              // Preserve existing documents if the callback doesn't supply them
              setExistingDocuments(prev => existing ?? prev);
              setNewDocuments(docs ?? []);
            }}
            onDocumentRemove={async (type, index) => {
              if (type === 'existing') {
                const docUrl = existingDocuments[index];
                if (initialData) {
                  const id = initialData?.request_data?.id;

                  try {
                    if (reqType === 'wfh') {
                      await wfhApi.deleteDocument(String(id), docUrl);
                    } else if (reqType === 'leave') {
                      await leaveApi.deleteDocument(String(id), docUrl);
                    } else if (reqType === 'overtime') {
                      await overtimeApi.deleteDocument(String(id), docUrl);
                    }
                    showSuccess(
                      getLabel(
                        'Document removed successfully',
                        'تمت إزالة المستند بنجاح'
                      )
                    );
                  } catch {
                    showError(
                      getLabel(
                        'Failed to remove document',
                        'فشلت إزالة المستند'
                      )
                    );
                    return; // abort removing from UI if API fails
                  }
                }
                setExistingDocuments(prev =>
                  prev.filter((_, i) => i !== index)
                );
              } else {
                setNewDocuments(prev => prev.filter((_, i) => i !== index));
              }
            }}
          />
        ),
        value: '',
        onChange: () => {},
      },
      ...(reqType === 'wfh'
        ? [
            {
              name: 'wfhInfo',
              label: '',
              component: wfhInfoComponent,
              value: '',
              onChange: () => {},
            },
          ]
        : []),
    ],
    [
      // titleVal,
      reqType,
      datesComponent,
      reason,
      hours,
      leaveTypeId,
      leaveTypes,
      wfhInfoComponent,
      existingDocuments,
      newDocuments,
      getLabel,
      initialData,
      overtimeMode,
      showError,
      showSuccess,
    ]
  );

  const handleSubmit = useCallback(async () => {
    if (reqType === 'overtime') {
      const isWeekend = (date: dayjs.Dayjs) =>
        date.day() === 0 || date.day() === 6;

      if (!fromDate) {
        showError(
          getLabel('Please select a start date.', 'يرجى اختيار تاريخ البدء.')
        );
        return;
      }

      if (overtimeMode === 'hours') {
        if (!hours) {
          showError(
            getLabel(
              'Please specify the number of hours.',
              'يرجى تحديد عدد الساعات.'
            )
          );
          return;
        }
        if (!isWeekend(fromDate)) {
          showError(
            getLabel(
              'Overtime in hours mode must be on a Saturday or Sunday.',
              'العمل الإضافي في وضع الساعات يجب أن يكون يوم السبت أو الأحد.'
            )
          );
          return;
        }
      } else {
        if (!toDate) {
          showError(
            getLabel(
              'Please select an end date.',
              'يرجى اختيار تاريخ الانتهاء.'
            )
          );
          return;
        }
        if (toDate.isBefore(fromDate)) {
          showError(
            getLabel(
              'End date cannot be before start date.',
              'لا يمكن أن يكون تاريخ الانتهاء قبل تاريخ البدء.'
            )
          );
          return;
        }
        // Check all days in range
        let curr = fromDate;
        while (curr.isBefore(toDate) || curr.isSame(toDate, 'day')) {
          if (!isWeekend(curr)) {
            showError(
              getLabel(
                'All days in the range must be Saturday or Sunday.',
                'يجب أن تكون جميع الأيام في النطاق يوم السبت أو الأحد.'
              )
            );
            return;
          }
          curr = curr.add(1, 'day');
        }
      }
    } else {
      // WFH/Leave common validation
      if (!fromDate || !toDate) {
        showError(
          getLabel(
            'Please fill all required fields.',
            'يرجى ملء جميع الحقول المطلوبة.'
          )
        );
        return;
      }
      if (toDate.isBefore(fromDate)) {
        showError(
          getLabel(
            'End date cannot be before start date.',
            'لا يمكن أن يكون تاريخ الانتهاء قبل تاريخ البدء.'
          )
        );
        return;
      }
      if (reason?.length < 6) {
        showError(
          getLabel(
            'Reason must be at least 6 characters long.',
            'السبب يجب أن يكون 6 أحرف على الأقل.'
          )
        );
        return;
      }
    }

    if (!reason || (reqType === 'leave' && !leaveTypeId)) {
      showError(
        getLabel(
          'Please fill all required fields.',
          'يرجى ملء جميع الحقول المطلوبة.'
        )
      );
      return;
    }

    // In edit mode, bail out early if nothing changed
    if (initialData && initialSnapshot) {
      const currentFromDate = fromDate?.format('YYYY-MM-DD') ?? null;
      const currentToDate = toDate?.format('YYYY-MM-DD') ?? null;
      const initialFromDate = initialSnapshot.fromDate
        ? dayjs(initialSnapshot.fromDate).format('YYYY-MM-DD')
        : null;
      const initialToDate = initialSnapshot.toDate
        ? dayjs(initialSnapshot.toDate).format('YYYY-MM-DD')
        : null;

      const nothingChanged =
        reason === initialSnapshot.reason &&
        currentFromDate === initialFromDate &&
        currentToDate === initialToDate &&
        leaveTypeId === initialSnapshot.leaveTypeId &&
        hours === initialSnapshot.hours &&
        newDocuments.length === 0;

      if (nothingChanged) {
        showSuccess(
          getLabel(
            'No changes detected. Please update at least one field.',
            'لم يتم اكتشاف أي تغييرات. يرجى تحديث حقل واحد على الأقل.'
          )
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);

      if (initialData) {
        // EDIT MODE
        const id =
          'request_data' in initialData
            ? (initialData as WorkflowRequest).request_data.id
            : initialData.id;

        if (reqType === 'wfh') {
          const wfhPayload: Parameters<typeof wfhApi.updateWFHRequest>[1] = {};
          const snapFromDate = initialSnapshot?.fromDate
            ? dayjs(initialSnapshot.fromDate).format('YYYY-MM-DD')
            : null;
          const snapToDate = initialSnapshot?.toDate
            ? dayjs(initialSnapshot.toDate).format('YYYY-MM-DD')
            : null;

          const currentFrom = fromDate.format('YYYY-MM-DD');
          const currentTo = toDate!.format('YYYY-MM-DD');
          const datesChanged =
            currentFrom !== snapFromDate || currentTo !== snapToDate;
          if (datesChanged) {
            // Backend expects both dates for range updates, even if only one was edited
            wfhPayload.start_date = currentFrom;
            wfhPayload.end_date = currentTo;
          }
          if (reason !== initialSnapshot?.reason) wfhPayload.reason = reason;

          if (newDocuments.length > 0) wfhPayload.attachments = newDocuments;

          await wfhApi.updateWFHRequest(String(id), wfhPayload);
        } else if (reqType === 'leave') {
          const leavePayload: Parameters<typeof leaveApi.updateLeave>[1] = {};
          const snapFromDate = initialSnapshot?.fromDate
            ? dayjs(initialSnapshot.fromDate).format('YYYY-MM-DD')
            : null;
          const snapToDate = initialSnapshot?.toDate
            ? dayjs(initialSnapshot.toDate).format('YYYY-MM-DD')
            : null;
          // Resolve leaveTypeId — prefer current selection, fall back to original
          const resolvedLeaveTypeId =
            leaveTypeId || initialSnapshot?.leaveTypeId || undefined;

          if (fromDate.format('YYYY-MM-DD') !== snapFromDate)
            leavePayload.startDate = fromDate.format('YYYY-MM-DD');
          if (toDate!.format('YYYY-MM-DD') !== snapToDate)
            leavePayload.endDate = toDate!.format('YYYY-MM-DD');
          if (reason !== initialSnapshot?.reason) leavePayload.reason = reason;
          if (
            resolvedLeaveTypeId &&
            resolvedLeaveTypeId !== initialSnapshot?.leaveTypeId
          )
            leavePayload.leaveTypeId = resolvedLeaveTypeId;
          if (newDocuments.length > 0) leavePayload.documents = newDocuments;

          await leaveApi.updateLeave(String(id), leavePayload);
        } else if (reqType === 'overtime') {
          const overtimePayload: Parameters<
            typeof overtimeApi.updateOvertimeRequest
          >[1] = {};
          const snapFromDate = initialSnapshot?.fromDate
            ? dayjs(initialSnapshot.fromDate).format('YYYY-MM-DD')
            : null;
          const snapToDate = initialSnapshot?.toDate
            ? dayjs(initialSnapshot.toDate).format('YYYY-MM-DD')
            : null;

          const currentFrom = fromDate.format('YYYY-MM-DD');
          const currentTo = toDate?.format('YYYY-MM-DD') ?? null;
          const datesChanged =
            currentFrom !== snapFromDate ||
            (overtimeMode === 'range' && currentTo !== snapToDate);

          if (overtimeMode === 'range' && datesChanged) {
            // Backend expects both dates for range updates, even if only one was edited
            overtimePayload.start_date = currentFrom;
            overtimePayload.end_date = currentTo ?? undefined;
          } else if (overtimeMode === 'hours') {
            overtimePayload.start_date = currentFrom;
          }
          if (overtimeMode === 'hours' && hours !== initialSnapshot?.hours)
            overtimePayload.hours = Number(hours);
          if (reason !== initialSnapshot?.reason)
            overtimePayload.reason = reason;
          if (newDocuments.length > 0)
            overtimePayload.attachments = newDocuments;

          await overtimeApi.updateOvertimeRequest(String(id), overtimePayload);
        }
      } else {
        // CREATE MODE
        if (reqType === 'wfh') {
          await wfhApi.createWFHRequest({
            start_date: fromDate.format('YYYY-MM-DD'),
            end_date: toDate!.format('YYYY-MM-DD'),
            reason: reason,
            attachments: newDocuments,
          });
        } else if (reqType === 'leave') {
          await leaveApi.createLeave({
            leaveTypeId: leaveTypeId,
            startDate: fromDate.format('YYYY-MM-DD'),
            endDate: toDate!.format('YYYY-MM-DD'),
            reason: reason,
            documents: newDocuments,
          });
        } else if (reqType === 'overtime') {
          await overtimeApi.createOvertimeRequest({
            start_date: fromDate.format('YYYY-MM-DD'),
            end_date:
              overtimeMode === 'range'
                ? toDate?.format('YYYY-MM-DD')
                : undefined,
            hours: overtimeMode === 'hours' ? Number(hours) : undefined,
            reason: reason,
            attachments: newDocuments,
          });
        }
      }

      showSuccess(
        initialData
          ? getLabel('Request updated successfully!', 'تم تحديث الطلب بنجاح!')
          : getLabel('Request submitted successfully!', 'تم تقديم الطلب بنجاح!')
      );

      // Close modal after success
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    } catch (error) {
      showError(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    fromDate,
    toDate,
    reason,
    reqType,
    leaveTypeId,
    newDocuments,
    initialData,
    initialSnapshot,
    onClose,
    onSuccess,
    getLabel,
    showError,
    showSuccess,
    hours,
  ]);

  return (
    <>
      <AppFormModal
        title={title}
        open={open}
        onClose={onClose}
        onSubmit={handleSubmit}
        fields={fields}
        isSubmitting={isSubmitting}
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
        onClose={closeSnackbar}
      />
    </>
  );
}

export default RequestModal;
