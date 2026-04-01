import React, { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AppFormModal, { type FormField } from '../common/AppFormModal';
import AppInputField from '../common/AppInputField';
import AppTextarea from '../common/AppTextarea';
import AppDropdown from '../common/AppDropdown';

export interface BenefitFormValues {
  name: string;
  type: string;
  description: string;
  eligibilityCriteria:
    | 'All employees'
    | 'Full time employees only'
    | 'Part time employees only';
  status: 'Active' | 'Inactive';
}

interface BenefitFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BenefitFormValues) => void;
  benefit?: BenefitFormValues | null;
  isSubmitting?: boolean;
}

const schema = yup.object({
  name: yup.string().required('Benefit name is required'),
  type: yup.string().required('Benefit type is required'),
  description: yup.string().required('Description is required'),
  eligibilityCriteria: yup
    .string()
    .oneOf([
      'All employees',
      'Full time employees only',
      'Part time employees only',
    ] as const)
    .required('Eligibility is required'),
  status: yup
    .string()
    .oneOf(['Active', 'Inactive'] as const)
    .required('Status is required'),
});
const eligibilityOptions: BenefitFormValues['eligibilityCriteria'][] = [
  'All employees',
  'Full time employees only',
  'Part time employees only',
];
const statusOptions: BenefitFormValues['status'][] = ['Active', 'Inactive'];

const BenefitFormModal: React.FC<BenefitFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  benefit,
  isSubmitting: isSubmittingProp,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting: formIsSubmitting },
  } = useForm<BenefitFormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      type: '',
      description: '',
      eligibilityCriteria: 'All employees',
      status: 'Active',
    },
  });

  const initialValues = useMemo((): BenefitFormValues => {
    return benefit
      ? {
          name: benefit.name || '',
          type: benefit.type || '',
          description: benefit.description || '',
          eligibilityCriteria:
            eligibilityOptions.find(
              opt =>
                opt.toLowerCase() === benefit.eligibilityCriteria.toLowerCase()
            ) || 'All employees',
          status:
            statusOptions.find(
              opt => opt.toLowerCase() === benefit.status.toLowerCase()
            ) || 'Active',
        }
      : {
          name: '',
          type: '',
          description: '',
          eligibilityCriteria: 'All employees',
          status: 'Active',
        };
  }, [benefit]);

  useEffect(() => {
    if (open) {
      reset(initialValues);
    }
  }, [initialValues, open, reset]);

  const watchedValues = watch();

  // form validity is tracked by react-hook-form via `isValid` and change detection

  const isChanged = useMemo(() => {
    return (
      watchedValues.name !== initialValues.name ||
      watchedValues.type !== initialValues.type ||
      watchedValues.description !== initialValues.description ||
      watchedValues.eligibilityCriteria !== initialValues.eligibilityCriteria ||
      watchedValues.status !== initialValues.status
    );
  }, [watchedValues, initialValues]);

  const handleFormSubmit = (data: BenefitFormValues) => {
    onSubmit(data);
  };

  const submitWrapper = () => {
    // trigger RHF submit
    void handleSubmit(handleFormSubmit)();
  };

  const fields: FormField[] = [
    {
      name: 'name',
      label: 'Benefit Name',
      type: 'text',
      value: watchedValues.name || '',
      onChange: v => setValue('name', String(v)),
      error: errors.name?.message,
      // error: errors.name?.message,
      component: (
        <Controller
          name='name'
          control={control}
          render={({ field }) => (
            <AppInputField
              {...field}
              value={field.value}
              onChange={e => field.onChange(e.target.value)}
              label='Benefit Name'
              placeholder='Health Insurance'
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          )}
        />
      ),
    },
    {
      name: 'type',
      label: 'Benefit Type',
      type: 'text',
      value: watchedValues.type || '',
      onChange: v => setValue('type', String(v)),
      error: errors.type?.message,
      component: (
        <Controller
          name='type'
          control={control}
          render={({ field }) => (
            <AppInputField
              {...field}
              value={field.value}
              onChange={e => field.onChange(e.target.value)}
              label='Benefit Type'
              placeholder='Health, Allowance, Voucher...'
              error={!!errors.type}
              helperText={errors.type?.message}
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
              placeholder='Provide a brief description of the benefit'
              rows={2}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          )}
        />
      ),
    },
    {
      name: 'eligibilityCriteria',
      label: 'Eligibility',
      type: 'dropdown',
      value: watchedValues.eligibilityCriteria || 'All employees',
      onChange: v => setValue('eligibilityCriteria', String(v)),
      error: errors.eligibilityCriteria?.message,
      component: (
        <Controller
          name='eligibilityCriteria'
          control={control}
          render={({ field }) => (
            <AppDropdown
              label='Eligibility'
              options={eligibilityOptions.map(o => ({ value: o, label: o }))}
              value={field.value}
              onChange={e => field.onChange(e.target.value)}
              showLabel
            />
          )}
        />
      ),
    },
    {
      name: 'status',
      label: 'Status',
      type: 'dropdown',
      value: watchedValues.status || 'Active',
      onChange: v => setValue('status', String(v)),
      error: errors.status?.message,
      component: (
        <Controller
          name='status'
          control={control}
          render={({ field }) => (
            <AppDropdown
              label='Status'
              options={statusOptions.map(o => ({ value: o, label: o }))}
              value={field.value}
              onChange={e => field.onChange(e.target.value)}
              showLabel
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
      title={benefit ? 'Edit Benefit' : 'Create Benefit'}
      fields={fields}
      submitLabel={benefit ? 'Update' : 'Create'}
      cancelLabel='Cancel'
      isSubmitting={isSubmitting}
      submitDisabled={isSubmitting || !isChanged}
      hasChanges={isChanged}
      maxWidth='sm'
    />
  );
};

export default BenefitFormModal;
