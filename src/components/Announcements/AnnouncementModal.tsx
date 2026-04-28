import React, { useEffect, useMemo, useState } from 'react';
import { Box, Checkbox, FormControlLabel, useTheme } from '@mui/material';
import AppFormModal from '../common/AppFormModal';
import DateTimePickerField from '../common/DateTimePickerField';
import AppInputField from '../common/AppInputField';
import AppTextarea from '../common/AppTextarea';
import AppDropdown from '../common/AppDropdown';
import {
  announcementsApiService,
  type Announcement,
  type AnnouncementPriority,
  type UpdateAnnouncementDto,
} from '../../api/announcementsApi';

type DatetimeLocalString = string; // "YYYY-MM-DDTHH:mm"

const MIN_TITLE_LENGTH = 5;
const MAX_TITLE_LENGTH = 70;
const MIN_CONTENT_LENGTH = 10;

const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'general', label: 'General' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'event', label: 'Event' },
  { value: 'policy', label: 'Policy' },
  { value: 'urgent', label: 'Urgent' },
];

const PRIORITY_OPTIONS: Array<{ value: AnnouncementPriority; label: string }> =
  [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

function isoToDatetimeLocal(value: string): DatetimeLocalString | '' {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function datetimeLocalToIso(value: DatetimeLocalString): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export interface AnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  isRtl?: boolean;
  announcement?: Announcement | null;
  onCreated?: (created: Announcement) => void;
  onUpdated?: (updated: Announcement) => void;
  showError: (error: unknown) => void;
  showSuccess: (message: string) => void;
}

export default function AnnouncementModal({
  open,
  onClose,
  isRtl = false,
  announcement = null,
  onCreated,
  onUpdated,
  showError,
  showSuccess,
}: AnnouncementModalProps) {
  const theme = useTheme();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState<AnnouncementPriority>('medium');
  const [sendNow, setSendNow] = useState(true);
  const [scheduledAt, setScheduledAt] = useState<DatetimeLocalString>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleApiError, setTitleApiError] = useState<string | null>(null);
  const [titleTouched, setTitleTouched] = useState(false);
  const [contentTouched, setContentTouched] = useState(false);
  const [scheduledAtTouched, setScheduledAtTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const isEditing = Boolean(announcement?.id);
  const isSent = Boolean(
    announcement && (announcement.status === 'sent' || Boolean(announcement.sent_at))
  );

  const [initial, setInitial] = useState<{
    title: string;
    content: string;
    category: string;
    priority: AnnouncementPriority;
    sendNow: boolean;
    scheduledAt: DatetimeLocalString;
  }>({
    title: '',
    content: '',
    category: 'general',
    priority: 'medium',
    sendNow: true,
    scheduledAt: '',
  });

  useEffect(() => {
    if (!open) return;

    if (announcement) {
      const initTitle = announcement.title ?? '';
      const initContent = announcement.content ?? '';
      const initCategory = announcement.category ?? 'general';
      const initPriority = (announcement.priority ?? 'medium') as AnnouncementPriority;

      const initSendNow = isSent ? true : !announcement.scheduled_at;
      const initScheduledAt = announcement.scheduled_at
        ? isoToDatetimeLocal(announcement.scheduled_at)
        : '';

      setTitle(initTitle);
      setContent(initContent);
      setCategory(initCategory);
      setPriority(initPriority);
      setSendNow(initSendNow);
      setScheduledAt(initScheduledAt);

      setInitial({
        title: initTitle,
        content: initContent,
        category: initCategory,
        priority: initPriority,
        sendNow: initSendNow,
        scheduledAt: initScheduledAt,
      });
      setTitleApiError(null);
    } else {
      setTitle('');
      setContent('');
      setCategory('general');
      setPriority('medium');
      setSendNow(true);
      setScheduledAt('');
      setInitial({
        title: '',
        content: '',
        category: 'general',
        priority: 'medium',
        sendNow: true,
        scheduledAt: '',
      });
    }
    setTitleTouched(false);
    setContentTouched(false);
    setScheduledAtTouched(false);
    setSubmitAttempted(false);
  }, [open, announcement, isSent]);

  const titleError = useMemo(() => {
    const trimmed = title.trim();
    if (!trimmed) return isRtl ? 'العنوان مطلوب' : 'Title is required';
    if (trimmed.length < MIN_TITLE_LENGTH) {
      return isRtl ? 'العنوان 5 أحرف على الأقل' : 'Title must be at least 5 characters';
    }
    if (trimmed.length > MAX_TITLE_LENGTH) {
      return isRtl
        ? `العنوان بحد أقصى ${MAX_TITLE_LENGTH} حرف`
        : `Title must be at most ${MAX_TITLE_LENGTH} characters`;
    }
    return undefined;
  }, [title, isRtl]);

  const contentError = useMemo(() => {
    const trimmed = content.trim();
    if (!trimmed) return isRtl ? 'المحتوى مطلوب' : 'Content is required';
    if (trimmed.length < MIN_CONTENT_LENGTH) {
      return isRtl
        ? `يجب أن يكون المحتوى ${MIN_CONTENT_LENGTH} أحرف على الأقل`
        : `Content must be at least ${MIN_CONTENT_LENGTH} characters`;
    }
    return undefined;
  }, [content, isRtl]);

  const scheduledAtError = useMemo(() => {
    if (isSent) return undefined;
    if (sendNow) return undefined;
    if (!scheduledAt.trim()) {
      return isRtl ? 'تاريخ الجدولة مطلوب' : 'Schedule date is required';
    }
    if (!datetimeLocalToIso(scheduledAt)) {
      return isRtl ? 'تاريخ جدولة غير صالح' : 'Invalid schedule date';
    }
    return undefined;
  }, [sendNow, scheduledAt, isRtl, isSent]);

  const hasChanges = useMemo(() => {
    if (!isEditing) {
      return (
        title.trim() !== '' ||
        content.trim() !== '' ||
        category.trim() !== '' ||
        priority.trim() !== '' ||
        sendNow !== true ||
        scheduledAt.trim() !== ''
      );
    }
    return (
      title !== initial.title ||
      content !== initial.content ||
      category !== initial.category ||
      priority !== initial.priority ||
      sendNow !== initial.sendNow ||
      scheduledAt !== initial.scheduledAt
    );
  }, [title, content, category, priority, sendNow, scheduledAt, isEditing, initial]);

  const isFormValid = useMemo(() => {
    if (titleError) return false;
    if (contentError) return false;
    if (!category.trim()) return false;
    if (!priority.trim()) return false;
    if (scheduledAtError) return false;
    return true;
  }, [titleError, contentError, category, priority, scheduledAtError]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    if (!isFormValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (isEditing && announcement) {
        const payload: UpdateAnnouncementDto = {
          title: title.trim(),
          content: content.trim(),
          category: category.trim(),
          priority,
          ...(isSent
            ? {}
            : {
                scheduled_at: sendNow
                  ? new Date().toISOString()
                  : (datetimeLocalToIso(scheduledAt) ?? null),
              }),
        };

        const updated = await announcementsApiService.updateAnnouncement(
          announcement.id,
          payload
        );
        showSuccess(isRtl ? 'تم تحديث الإعلان بنجاح' : 'Announcement updated.');
        onUpdated?.(updated);
        handleClose();
      } else {
        const scheduled_at = sendNow ? undefined : datetimeLocalToIso(scheduledAt);
        const created = await announcementsApiService.createAnnouncement({
          title: title.trim(),
          content: content.trim(),
          category: category.trim(),
          priority,
          scheduled_at,
          send_now: sendNow,
        });
        showSuccess(
          isRtl ? 'تم إنشاء الإعلان بنجاح' : 'Announcement created successfully.'
        );
        onCreated?.(created);
        handleClose();
      }
    } catch (err: unknown) {
      const axiosData = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { errors?: Array<{ field?: string; message?: string }> } } }).response?.data
        : undefined;
      const errors = axiosData?.errors;
      const titleErr = Array.isArray(errors) && errors.length > 0
        ? errors.find(e => (e.field || '').toLowerCase() === 'title')
        : undefined;
      if (titleErr?.message) {
        setTitleApiError(titleErr.message);
        return;
      }
      showError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppFormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title={
        isEditing
          ? isRtl
            ? 'تحديث إعلان'
            : 'Update Announcement'
          : isRtl
            ? 'إنشاء إعلان'
            : 'Create Announcement'
      }
      submitLabel={
        isEditing ? (isRtl ? 'تحديث' : 'Update') : isRtl ? 'إنشاء' : 'Create'
      }
      cancelLabel={isRtl ? 'إلغاء' : 'Cancel'}
      submitDisabled={!hasChanges || !isFormValid || isSubmitting}
      isSubmitting={isSubmitting}
      hasChanges={hasChanges}
      paperSx={{
        direction: isRtl ? 'rtl' : 'ltr',
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
      maxWidth='sm'
      isRtl={isRtl}
    >
      <AppInputField
        label={isRtl ? 'العنوان' : 'Title'}
        name='title'
        value={title}
        placeholder={isRtl ? 'اكتب عنوان الإعلان' : 'Enter announcement title'}
        required
        inputProps={{ maxLength: MAX_TITLE_LENGTH }}
        error={Boolean((titleTouched || submitAttempted) && (titleError || titleApiError))}
        helperText={
          (titleTouched || submitAttempted) && (titleError || titleApiError)
            ? (titleError || titleApiError)
            : undefined
        }
        onBlur={() => setTitleTouched(true)}
        onChange={(e: unknown) => {
          const raw =
            typeof e === 'string'
              ? e
              : (e as React.ChangeEvent<HTMLInputElement>).target?.value ?? '';
          setTitle(raw.slice(0, MAX_TITLE_LENGTH));
          setTitleApiError(null);
        }}
        inputBackgroundColor={
          theme.palette.mode === 'dark' ? theme.palette.background.default : '#F8F8F8'
        }
      />

      <AppTextarea
        label={isRtl ? 'المحتوى' : 'Content'}
        name='content'
        value={content}
        placeholder={isRtl ? 'اكتب محتوى الإعلان' : 'Enter announcement content'}
        required
        error={Boolean((contentTouched || submitAttempted) && contentError)}
        helperText={(contentTouched || submitAttempted) ? contentError : undefined}
        onBlur={() => setContentTouched(true)}
        rows={4}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setContent(e.target.value)
        }
        inputBackgroundColor={
          theme.palette.mode === 'dark' ? theme.palette.background.default : '#F8F8F8'
        }
      />

      <AppDropdown
        label={isRtl ? 'الفئة' : 'Category'}
        options={CATEGORY_OPTIONS}
        value={category}
        onChange={e => setCategory(String(e.target.value))}
        placeholder={isRtl ? 'اختر فئة' : 'Select category'}
        inputBackgroundColor={
          theme.palette.mode === 'dark' ? theme.palette.background.default : '#F8F8F8'
        }
      />

      <AppDropdown
        label={isRtl ? 'الأولوية' : 'Priority'}
        options={PRIORITY_OPTIONS}
        value={priority}
        onChange={e => setPriority(String(e.target.value) as AnnouncementPriority)}
        placeholder={isRtl ? 'اختر أولوية' : 'Select priority'}
        inputBackgroundColor={
          theme.palette.mode === 'dark' ? theme.palette.background.default : '#F8F8F8'
        }
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0.5 }}>
        <FormControlLabel
          sx={{ m: 0, color: theme.palette.text.primary }}
          control={
            <Checkbox
              checked={sendNow}
              onChange={e => setSendNow(e.target.checked)}
              disabled={isSent}
            />
          }
          label={isRtl ? 'إرسال الآن' : 'Send now'}
        />

        {!sendNow && !isSent && (
          <DateTimePickerField
            label={isRtl ? 'جدولة الإرسال' : 'Schedule at'}
            value={scheduledAt}
            onChange={setScheduledAt}
            required
            error={Boolean((scheduledAtTouched || submitAttempted) && scheduledAtError)}
            helperText={(scheduledAtTouched || submitAttempted) ? scheduledAtError : undefined}
          />
        )}
      </Box>
    </AppFormModal>
  );
}

