import React, { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppFormModal, { type FormField } from '../common/AppFormModal';
import AppInputField from '../common/AppInputField';
import AppTextarea from '../common/AppTextarea';

export interface LeaveTypeFormValues {
  name: string;
  description: string;
  maxDaysPerYear: number;
  carryForward: boolean;
  isPaid: boolean;
}

type LeaveTypeFormRawValues = {
  name: string;
  description: string;
  maxDaysPerYear: number | string;
  carryForward: 'true' | 'false';
  isPaid: 'true' | 'false';
};

interface LeaveTypeFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LeaveTypeFormValues) => void;
  initialValues?: Partial<LeaveTypeFormValues> | null;
  isSubmitting?: boolean;
}

const schema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be 100 characters or less'),
  description: z
    .string()
    .min(5, 'Description must be at least 5 characters')
    .max(500, 'Description must be 500 characters or less'),
  maxDaysPerYear: z
    .union([z.string(), z.number()])
    .refine(v => v !== '' && v !== null && v !== undefined, {
      message: 'Max days per year is required',
    })
    .transform(v => Number(v))
    .refine(v => Number.isInteger(v), {
      message: 'Max days per year must be a whole number',
    })
    .refine(v => v >= 1, { message: 'Max days per year must be at least 1' })
    .refine(v => v <= 365, { message: 'Max days per year cannot exceed 365' }),
  carryForward: z.enum(['true', 'false'], {
    errorMap: () => ({
      message: 'Please select if days can be carried forward',
    }),
  }),
  isPaid: z.enum(['true', 'false'], {
    errorMap: () => ({ message: 'Please select if this leave is paid' }),
  }),
});

const LeaveTypeFormModal: React.FC<LeaveTypeFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialValues,
  isSubmitting: isSubmittingProp,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting: formIsSubmitting },
  } = useForm<LeaveTypeFormRawValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      maxDaysPerYear: '',
      carryForward: 'true',
      isPaid: 'true',
    },
  });

  const initialRawValues = useMemo<LeaveTypeFormRawValues>(() => {
    const safeValues = initialValues ?? {};
    return {
      name: safeValues.name ?? '',
      description: safeValues.description ?? '',
      maxDaysPerYear:
        typeof safeValues.maxDaysPerYear === 'number'
          ? safeValues.maxDaysPerYear
          : '',
      carryForward: safeValues.carryForward === false ? 'false' : 'true',
      isPaid: safeValues.isPaid === false ? 'false' : 'true',
    };
  }, [initialValues]);

  useEffect(() => {
    if (open) {
      reset(initialRawValues);
    }
  }, [initialRawValues, open, reset]);

  const watchedValues = watch();

  const isChanged = useMemo(() => {
    return (
      watchedValues.name !== initialRawValues.name ||
      watchedValues.description !== initialRawValues.description ||
      String(watchedValues.maxDaysPerYear ?? '') !==
        String(initialRawValues.maxDaysPerYear ?? '') ||
      watchedValues.carryForward !== initialRawValues.carryForward ||
      watchedValues.isPaid !== initialRawValues.isPaid
    );
  }, [watchedValues, initialRawValues]);

  const handleFormSubmit = (data: LeaveTypeFormRawValues) => {
    const maxDaysNumeric =
      typeof data.maxDaysPerYear === 'number'
        ? data.maxDaysPerYear
        : Number(data.maxDaysPerYear);

    onSubmit({
      name: data.name.trim(),
      description: data.description.trim(),
      maxDaysPerYear: maxDaysNumeric,
      carryForward: data.carryForward === 'true',
      isPaid: data.isPaid === 'true',
    });
  };

  const submitWrapper = () => {
    void handleSubmit(handleFormSubmit)();
  };

  const fields: FormField[] = [
    {
      name: 'name',
      label: 'Leave Type Name',
      type: 'text',
      value: watchedValues.name || '',
      onChange: v => setValue('name', String(v)),
      error: errors.name?.message,
      component: (
        <Controller
          name='name'
          control={control}
          render={({ field }) => (
            <AppInputField
              {...field}
              value={field.value}
              onChange={e => field.onChange(e.target.value)}
              label='Leave Type Name'
              placeholder='Office Leave'
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          )}
        />
      ),
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      value: watchedValues.description || '',
      onChange: v => setValue('description', String(v)),
      error: errors.description?.message,
      component: (
        <Controller
          name='description'
          control={control}
          render={({ field }) => (
            <AppTextarea
              {...field}
              value={field.value}
              onChange={e => field.onChange(e.target.value)}
              label='Description'
              placeholder='Paid time off for annual vacations'
              rows={2}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          )}
        />
      ),
    },
    {
      name: 'maxDaysPerYear',
      label: 'Max Days Per Year',
      type: 'text',
      value: watchedValues.maxDaysPerYear ?? '',
      onChange: v => setValue('maxDaysPerYear', v),
      error: errors.maxDaysPerYear?.message,
      component: (
        <Controller
          name='maxDaysPerYear'
          control={control}
          render={({ field }) => (
            <AppInputField
              {...field}
              value={field.value}
              onChange={e => field.onChange(e.target.value)}
              label='Max Days Per Year'
              placeholder='24'
              type='number'
              error={!!errors.maxDaysPerYear}
              helperText={errors.maxDaysPerYear?.message}
            />
          )}
        />
      ),
    },
  ];

  const isSubmitting = isSubmittingProp ?? formIsSubmitting;

  return (
    <AppFormModal
      open={open}
      onClose={onClose}
      onSubmit={submitWrapper}
      title={initialValues ? 'Edit Leave Type' : 'Create Leave Type'}
      fields={fields}
      submitLabel={initialValues ? 'Update' : 'Create'}
      cancelLabel='Cancel'
      isSubmitting={isSubmitting}
      submitDisabled={isSubmitting || !isChanged}
      hasChanges={isChanged}
      maxWidth='sm'
    />
  );
};

export default LeaveTypeFormModal;
