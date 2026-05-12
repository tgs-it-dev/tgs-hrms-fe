import React, { useState, useEffect } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import AppFormModal, { type FormField } from '../common/AppFormModal';
import { useLanguage } from '../../hooks/useLanguage';
import type { CreateTeamDto, Manager } from '../../api/teamApi';
import { teamApiService } from '../../api/teamApi';
interface CreateTeamFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTeamDto) => Promise<void>;
  darkMode?: boolean;
}
const CreateTeamForm: React.FC<CreateTeamFormProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateTeamDto>({
    name: '',
    description: '',
    manager_id: '',
  });
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    manager_id?: string;
  }>({});
  // Check if form has changes (for create, check if any field has content)
  const hasChanges =
    formData.name.trim() !== '' ||
    (formData.description?.trim() ?? '') !== '' ||
    formData.manager_id !== '';
  const { language } = useLanguage();
  const labels = {
    en: {
      title: 'Create New Team',
      name: 'Team Name',
      description: 'Description',
      manager: 'Manager',
      selectManager: 'Select a manager',
      create: 'Create Team',
      cancel: 'Cancel',
      loading: 'Creating team...',
      loadingManagers: 'Loading managers...',
      error: 'Failed to create team',
      nameRequired: 'Team name is required',
      managerRequired: 'Manager is required',
      noManagersAvailable: 'No managers available',
    },
    ar: {
      title: 'إنشاء فريق جديد',
      name: 'اسم الفريق',
      description: 'الوصف',
      manager: 'المدير',
      selectManager: 'اختر مدير',
      create: 'إنشاء الفريق',
      cancel: 'إلغاء',
      loading: 'جاري إنشاء الفريق...',
      loadingManagers: 'جاري تحميل المديرين...',
      error: 'فشل في إنشاء الفريق',
      nameRequired: 'اسم الفريق مطلوب',
      managerRequired: 'المدير مطلوب',
      noManagersAvailable: 'لا يوجد مديرين متاحين',
    },
  };
  const lang = labels[language];
  // Load managers from API
  useEffect(() => {
    const loadManagers = async () => {
      if (open) {
        try {
          setLoadingManagers(true);
          const managersData = await teamApiService.getAvailableManagers();
          setManagers(managersData);
        } catch {
          setManagers([]);
        } finally {
          setLoadingManagers(false);
        }
      }
    };
    loadManagers();
  }, [open]);
  const handleSubmit = async () => {
    // Per-field validation
    const nextFieldErrors: { name?: string; manager_id?: string } = {};
    if (!formData.name.trim()) {
      nextFieldErrors.name = lang.nameRequired;
    } else if (formData.name.trim().length > 100) {
      nextFieldErrors.name = 'Team name must be 100 characters or less';
    }
    if (!formData.manager_id || formData.manager_id === 'all') {
      nextFieldErrors.manager_id = lang.managerRequired;
    }
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }
    setFieldErrors({});
    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
      handleClose();
    } catch {
      setError(lang.error);
    } finally {
      setLoading(false);
    }
  };
  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      manager_id: '',
    });
    setError(null);
    setFieldErrors({});
    setLoading(false);
    onClose();
  };
  const fields: FormField[] = [
    {
      name: 'name',
      label: lang.name,
      type: 'text',
      required: true,
      value: formData.name,
      onChange: value => {
        setFormData(prev => ({ ...prev, name: String(value) }));
        if (fieldErrors.name)
          setFieldErrors(prev => ({ ...prev, name: undefined }));
      },
      placeholder: lang.name,
      maxLength: 100,
      error: fieldErrors.name,
    },
    {
      name: 'description',
      label: lang.description,
      type: 'textarea',
      value: formData.description || '',
      onChange: value =>
        setFormData(prev => ({ ...prev, description: String(value) })),
      placeholder: lang.description,
      maxLength: 500,
    },
    {
      name: 'manager_id',
      label: lang.manager,
      type: 'dropdown',
      value: formData.manager_id || 'all',
      onChange: value => {
        setFormData(prev => ({ ...prev, manager_id: String(value) }));
        if (fieldErrors.manager_id)
          setFieldErrors(prev => ({ ...prev, manager_id: undefined }));
      },
      error: fieldErrors.manager_id,
      placeholder: lang.selectManager,
      options: loadingManagers
        ? [{ value: 'all', label: lang.loadingManagers }]
        : managers.length === 0
          ? [{ value: 'all', label: lang.noManagersAvailable }]
          : [
              { value: 'all', label: lang.selectManager },
              ...managers.map(manager => ({
                value: manager.id,
                label: `${manager.first_name} ${manager.last_name} (${manager.email})`,
              })),
            ],
    },
  ];
  return (
    <AppFormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title={lang.title}
      fields={fields}
      submitLabel={lang.create}
      cancelLabel={lang.cancel}
      isSubmitting={loading}
      hasChanges={hasChanges}
      submitStartIcon={loading ? <CircularProgress size={16} /> : undefined}
      maxWidth='sm'
    >
      {error ? (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
    </AppFormModal>
  );
};
export default CreateTeamForm;
