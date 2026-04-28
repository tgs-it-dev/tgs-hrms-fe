import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  useMediaQuery,
  useTheme,
  InputAdornment,
  Typography,
  Dialog,
  DialogContent,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import '../UserProfile/PhoneInput.css';
import { useOutletContext } from 'react-router-dom';
import type { AppOutletContext } from '../../types/outletContexts';
import { env } from '../../config/env';
import type { EmployeeDto } from '../../api/employeeApi';
import {
  departmentApiService,
  type BackendDepartment,
} from '../../api/departmentApi';
import {
  designationApiService,
  type BackendDesignation,
} from '../../api/designationApi';
import { rolesApiService, type Role } from '../../api/rolesApi';
import { validateEmailAddress } from '../../utils/validation';
import AppButton from '../common/AppButton';
import AppInputField from '../common/AppInputField';
import AppDropdown from '../common/AppDropdown';
import type { SelectChangeEvent } from '@mui/material/Select';

// Types
type FormValues = EmployeeDto & {
  departmentId?: string;
  gender: string;
  role: string;
  role_name?: string;
  role_id?: string;
  team_id?: string;
  cnicFrontPicture?: File | null;
  cnicBackPicture?: File | null;
};

type Errors = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  designationId?: string;
  departmentId?: string;
  gender?: string;
  role?: string;
  role_name?: string;
  role_id?: string;
  team_id?: string;
  cnicNumber?: string;
  general?: string;
  profilePicture?: string;
  cnicFrontPicture?: string;
  cnicBackPicture?: string;
};

interface AddEmployeeFormProps {
  onSubmit?: (
    data: Partial<EmployeeDto> & {
      departmentId?: string;
      designationId?: string;
      role?: string;
      role_name?: string;
      role_id?: string;
      team_id?: string;
    }
  ) => Promise<{ success: boolean; errors?: Record<string, string> }>;
  initialData?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone: string;
    designationId: string;
    departmentId?: string;
    gender?: string;
    role?: string;
    role_name?: string;
    role_id?: string;
    team_id?: string;
    cnicNumber?: string;
    profilePicture?: string; // URL or path to existing image
    cnicFrontPicture?: string; // URL or path to existing image
    cnicBackPicture?: string; // URL or path to existing image
  } | null;
  submitting?: boolean;
  onDeleteDocument?: (type: 'profile' | 'cnicFront' | 'cnicBack', url: string) => Promise<void>;
}


// Component
const AddEmployeeForm: React.FC<AddEmployeeFormProps> = ({
  onSubmit,
  initialData,
  submitting = false,
  onDeleteDocument,
}) => {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));
  const { language } = useOutletContext<AppOutletContext>();

  const API_BASE_URL = env.apiBaseUrl;
  const toAbsoluteUrl = (path?: string | null) => {
    if (!path) return '';
    const trimmed = path.trim();
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('blob:')) return trimmed;
    const base = API_BASE_URL.replace(/\/$/, '');
    return `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}?t=${Date.now()}`;
  };

  const [values, setValues] = useState<FormValues>({
    first_name: initialData?.firstName ?? '',
    last_name: initialData?.lastName ?? '',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
    designationId: initialData?.designationId ?? '',
    departmentId: initialData?.departmentId ?? '',
    gender: initialData?.gender ?? '',
    role: initialData?.role ?? 'Employee', // Default to employee
    role_name: initialData?.role_name ?? '',
    //role_id: initialData?.role_id ?? '',
    team_id: initialData?.team_id ?? '',
    cnicNumber: initialData?.cnicNumber ?? '',
    profilePicture: null, // Will be set when user uploads new image
    cnicFrontPicture: null, // Will be set when user uploads new image
    cnicBackPicture: null, // Will be set when user uploads new image
  });

  const [originalValues] = useState<FormValues>({
    first_name: initialData?.firstName ?? '',
    last_name: initialData?.lastName ?? '',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
    designationId: initialData?.designationId ?? '',
    departmentId: initialData?.departmentId ?? '',
    gender: initialData?.gender ?? '',
    role: initialData?.role ?? 'Employee',
    role_name: initialData?.role_name ?? '',
    //role_id: initialData?.role_id ?? '',
    team_id: initialData?.team_id ?? '',
    cnicNumber: initialData?.cnicNumber ?? '',
    profilePicture: null,
    cnicFrontPicture: null,
    cnicBackPicture: null,
  });

  const [errors, setErrors] = useState<Errors>({});
  const [departments, setDepartments] = useState<BackendDepartment[]>([]);
  const [designations, setDesignations] = useState<BackendDesignation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    title: string;
  } | null>(null);
  const [deletingType, setDeletingType] = useState<'profile' | 'cnicFront' | 'cnicBack' | null>(null);
  const [hasDeletedDocument, setHasDeletedDocument] = useState(false);
  // Track initialization to avoid clearing designation on first prefill
  const isInitializingRef = useRef<boolean>(true);

  const roleOptions = React.useMemo(() => {
    const allowedRoles = ['Employee', 'Manager', 'hr-admin', 'network-admin'];

    return (roles || [])
      .map(r => (r.name || '').trim())
      .filter(name => allowedRoles.includes(name));
  }, [roles]);

  // Load departments and roles on component mount
  useEffect(() => {
    (async () => {
      await Promise.all([loadDepartments(), loadRoles()]);
      // If we have initial department and designation, ensure options include them
      if (initialData?.departmentId) {
        await loadDesignations(initialData.departmentId);
      }
      isInitializingRef.current = false;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefill from initialData when it changes
  useEffect(() => {
    if (initialData) {
      setValues(prev => ({
        ...prev,
        first_name: initialData.firstName ?? '',
        last_name: initialData.lastName ?? '',
        email: initialData.email,
        phone: initialData.phone,
        designationId: initialData.designationId,
        departmentId: initialData.departmentId ?? prev.departmentId,
        gender: initialData.gender ?? prev.gender,
        role: initialData.role ?? prev.role,
        role_name: initialData.role_name ?? prev.role_name,
        // role_id: initialData.role_id ?? prev.role_id,
        team_id: initialData.team_id ?? prev.team_id,
        cnicNumber: initialData.cnicNumber ?? prev.cnicNumber,
      }));
      if (initialData.departmentId) {
        // Load designations for department; keep designationId as provided
        (async () => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- departmentId is truthy (checked by `if (initialData.departmentId)` above)
          await loadDesignations(initialData.departmentId!);
          isInitializingRef.current = false;
        })();
      } else {
        isInitializingRef.current = false;
      }
    } else {
      isInitializingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.id]);

  // Check if form has changes
  const hasChanges = initialData
    ? values.first_name !== originalValues.first_name ||
    values.last_name !== originalValues.last_name ||
    values.email !== originalValues.email ||
    values.phone !== originalValues.phone ||
    values.designationId !== originalValues.designationId ||
    values.departmentId !== originalValues.departmentId ||
    values.gender !== originalValues.gender ||
    values.role !== originalValues.role ||
    values.role_name !== originalValues.role_name ||
    // values.role_id !== originalValues.role_id ||
    values.team_id !== originalValues.team_id ||
    values.cnicNumber !== originalValues.cnicNumber ||
    values.profilePicture !== null ||
    values.cnicFrontPicture !== null ||
    values.cnicBackPicture !== null ||
    hasDeletedDocument
    : values.first_name.trim() !== '' ||
    values.last_name.trim() !== '' ||
    values.email.trim() !== '' ||
    values.phone.trim() !== '' ||
    values.designationId !== '' ||
    values.departmentId !== '' ||
    values.gender !== '' ||
    values.role !== 'Employee' ||
    values.role_name !== '' ||
    // values.role_id !== '' ||
    values.team_id !== '' ||
    values.cnicNumber !== '' ||
    values.profilePicture !== null ||
    values.cnicFrontPicture !== null ||
    values.cnicBackPicture !== null;

  // Remove filtering: always show all designations in the dropdown
  // const filteredDesignations = designations;

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const data = await departmentApiService.getAllDepartments();
      setDepartments(data);
    } catch {
      // Handle error silently
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadDesignations = async (departmentId: string) => {
    try {
      setLoadingDesignations(true);
      const response = await designationApiService.getDesignationsByDepartment(
        departmentId,
        null
      ); // Pass null to get all designations for dropdown
      setDesignations(response.items);
    } catch {
      setDesignations([]);
    } finally {
      setLoadingDesignations(false);
    }
  };

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const data = await rolesApiService.getAllRoles();
      setRoles(data);
    } catch {
      // Handle error silently; role dropdown will just have no options
    } finally {
      setLoadingRoles(false);
    }
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const label = (en: string, ar: string) => (language === 'ar' ? ar : en);

  //Handlers
  const setFieldValue = (field: keyof FormValues, rawValue: string) => {
    const value = (rawValue ?? '').toString();

    // Special handling for role field
    if (field === 'role') {
      const normalized = value.trim();
      setValues(prev => ({
        ...prev,
        role: normalized,
        role_id: normalized, // Use role name as ID since roles don't have separate IDs
        role_name: normalized,
      }));
    } else {
      setValues(prev => ({ ...prev, [field]: value }));
    }

    // For email: show error in real time when @ or dot is missing
    setErrors(prev => {
      const newErrors = { ...prev };
      if (field === 'email') {
        if (value.trim()) {
          const emailError = validateEmailAddress(value);
          if (emailError) newErrors.email = emailError;
          else delete newErrors.email;
        } else {
          delete newErrors.email;
        }
      } else {
        delete newErrors[field];
        if (field === 'role') {
          delete newErrors.role_id;
          delete newErrors.role_name;
        }
      }
      delete newErrors.general;
      return newErrors;
    });
  };

  const handleChange =
    (field: keyof FormValues) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFieldValue(field, (e.target.value ?? '').toString());
      };

  const handlePhoneChange = (value: string | undefined) => {
    const phoneValue = value || '';
    setValues({ ...values, phone: phoneValue });
    // Clear phone validation error when user starts typing
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.phone;
      delete newErrors.general;
      return newErrors;
    });
  };

  // Handle image uploads
  const handleImageUpload =
    (type: 'profile' | 'cnicFront' | 'cnicBack') =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
          // Validate file type
          if (!file.type.startsWith('image/')) {
            setErrors(prev => ({
              ...prev,
              general: 'Please select a valid image file',
            }));
            return;
          }

          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({
              ...prev,
              general: 'Image size should not exceed 5MB',
            }));
            return;
          }

          setValues(prev => ({
            ...prev,
            [type === 'profile'
              ? 'profilePicture'
              : type === 'cnicFront'
                ? 'cnicFrontPicture'
                : 'cnicBackPicture']: file,
          }));

          // Clear errors
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.general;
            // Clear the specific picture error
            if (type === 'profile') {
              delete newErrors.profilePicture;
            } else if (type === 'cnicFront') {
              delete newErrors.cnicFrontPicture;
            } else if (type === 'cnicBack') {
              delete newErrors.cnicBackPicture;
            }
            return newErrors;
          });
        }
      };

  // Handle CNIC number formatting
  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

    // Format CNIC: 12345-1234567-1
    if (value.length > 5) {
      value = value.substring(0, 5) + '-' + value.substring(5);
    }
    if (value.length > 13) {
      value = value.substring(0, 13) + '-' + value.substring(13);
    }
    if (value.length > 15) {
      value = value.substring(0, 15);
    }

    setValues({ ...values, cnicNumber: value });

    // Clear CNIC validation error when user starts typing
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.cnicNumber;
      delete newErrors.general;
      return newErrors;
    });
  };

  // Handle image preview click
  const handleImagePreviewClick = (src: string, title: string) => {
    setPreviewImage({ src, title });
  };

  // Close image preview
  const handleClosePreview = () => {
    setPreviewImage(null);
  };

  const handleDeleteExistingDocument = async (type: 'profile' | 'cnicFront' | 'cnicBack', url: string) => {
    if (!onDeleteDocument) return;
    try {
      setDeletingType(type);
      await onDeleteDocument(type, url);
      setHasDeletedDocument(true);
    } finally {
      setDeletingType(null);
    }
  };

  // Clear newly uploaded picture (show cross on image, click to remove)
  const handleClearUploadedPicture = (type: 'profile' | 'cnicFront' | 'cnicBack') => {
    const field = type === 'profile' ? 'profilePicture' : type === 'cnicFront' ? 'cnicFrontPicture' : 'cnicBackPicture';
    setValues(prev => ({ ...prev, [field]: null }));
    setErrors(prev => {
      const next = { ...prev };
      delete (next as Record<string, unknown>)[field];
      return next;
    });
  };

  // When department is selected, load only that department's designations
  const handleDepartmentChange = (e: SelectChangeEvent<string | number>) => {
    const departmentId = String(e.target.value ?? '').replace(/^all$/, '');
    setValues(prev => ({
      ...prev,
      departmentId,
      designationId: '', // clear designation when department changes
    }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.departmentId;
      delete newErrors.designationId;
      delete newErrors.general;
      return newErrors;
    });
    if (departmentId) {
      loadDesignations(departmentId);
    } else {
      setDesignations([]);
    }
  };

  const handleDesignationChange = (e: SelectChangeEvent<string | number>) => {
    const selectedDesignationId = String(e.target.value ?? '').replace(/^all$/, '');
    setValues(prev => ({ ...prev, designationId: selectedDesignationId }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.designationId;
      delete newErrors.general;
      return newErrors;
    });
  };

  const validate = (): boolean => {
    const newErrors: Errors = {};
    if (!values.first_name)
      newErrors.first_name = label(
        'First name is required',
        'الاسم الأول مطلوب'
      );
    if (!values.last_name)
      newErrors.last_name = label('Last name is required', 'اسم العائلة مطلوب');
    if (values.email.trim()) {
      const emailError = validateEmailAddress(values.email);
      if (emailError) {
        newErrors.email = emailError;
      }
    } else {
      newErrors.email = 'Email is required';
    }
    const phoneDigits = (values.phone || '').replace(/\D/g, '');
    if (phoneDigits.length < 10)
      newErrors.phone = label('Phone is required', 'رقم الهاتف مطلوب');
    else if (values.phone && values.phone.trim()) {
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(values.phone)) {
        newErrors.phone = label(
          'Please enter a valid phone number',
          'يرجى إدخال رقم هاتف صحيح'
        );
      }
    }
    if (!values.designationId)
      newErrors.designationId = label(
        'Please select a designation',
        'يرجى اختيار المسمى الوظيفي'
      );
    // CNIC validation
    if (!values.cnicNumber) {
      newErrors.cnicNumber = label(
        'CNIC Number is required',
        'رقم الهوية الوطنية مطلوب'
      );
    } else {
      const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
      if (!cnicRegex.test(values.cnicNumber)) {
        newErrors.cnicNumber = label(
          'Please enter a valid CNIC number (12345-1234567-1)',
          'يرجى إدخال رقم هوية وطنية صحيح (12345-1234567-1)'
        );
      }
    }

    // Picture validation only when creating new employee
    if (!initialData) {
      if (!values.profilePicture) {
        newErrors.profilePicture = label(
          'Profile picture is required',
          'الصورة الشخصية مطلوبة'
        );
      }
      if (!values.cnicFrontPicture) {
        newErrors.cnicFrontPicture = label(
          'CNIC front picture is required',
          'صورة الهوية الأمامية مطلوبة'
        );
      }
      if (!values.cnicBackPicture) {
        newErrors.cnicBackPicture = label(
          'CNIC back picture is required',
          'صورة الهوية الخلفية مطلوبة'
        );
      }
    }

    // Only require gender when creating new employee, not when editing
    if (!initialData && !values.gender) newErrors.gender = 'Gender is required';
    // Only require role when creating new employee, not when editing
    if (!initialData && !values.role) newErrors.role = 'Role is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setValues({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      designationId: '',
      departmentId: '',
      gender: '',
      role: 'Employee', // Reset to default
      role_name: '',
      role_id: '',
      team_id: '',
      cnicNumber: '',
      profilePicture: null,
      cnicFrontPicture: null,
      cnicBackPicture: null,
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const result = await onSubmit?.(values);
      if (result && result.success) {
        // Reset form on successful submission
        resetForm();
      } else if (result && !result.success && result.errors) {
        // Set backend validation errors
        setErrors(result.errors);
      }
    } catch {
      /* Error handled silently */
    }
  };

  // Phone has actual number digits (not just country code). Require at least 10 digits.
  const hasPhoneNumber = (phone: string) => {
    const digits = (phone || '').replace(/\D/g, '');
    return digits.length >= 10;
  };

  // Helper to check if all required fields are filled
  const isFormComplete = () => {
    if (!values.first_name.trim()) return false;
    if (!values.last_name.trim()) return false;
    if (!values.email.trim()) return false;
    if (validateEmailAddress(values.email)) return false;
    if (!hasPhoneNumber(values.phone)) return false;
    if (!values.designationId) return false;
    if (!values.departmentId) return false;
    if (!values.cnicNumber) return false;
    if (!initialData && !values.gender) return false;
    if (!initialData && !values.role) return false;

    // Require pictures only for create; for edit they are optional
    if (!initialData) {
      if (!values.profilePicture) return false;
      if (!values.cnicFrontPicture) return false;
      if (!values.cnicBackPicture) return false;
    }

    return true;
  };

  // Keep dropdown control sizing aligned with AppInputField (same height/padding/typography)
  const dropdownControlSx = {
    '& .MuiOutlinedInput-root': {
      height: { xs: 40, sm: 44 },
      minHeight: { xs: 40, sm: 44 },
    },
    '& .MuiSelect-select': {
      padding: { xs: '8px 12px !important', sm: '10px 16px !important' },
      fontSize: { xs: '16px', sm: '14px' },
      lineHeight: 1.2,
      display: 'flex',
      alignItems: 'center',
    },
    '& .MuiInputBase-input': {
      padding: { xs: '8px 12px !important', sm: '10px 16px !important' },
      fontSize: { xs: '16px', sm: '14px' },
      lineHeight: 1.2,
    },
  } as const;

  // Match the common form control background used across modals (e.g., Designation modal/AppFormModal)
  const controlBg =
    theme.palette.mode === 'dark'
      ? theme.palette.background.default
      : '#F8F8F8';

  return (
    <Box component='form' onSubmit={handleSubmit} dir={dir}>
      {/* General Error Display */}
      {errors.general && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            bgcolor: 'error.light',
            color: 'error.contrastText',
            borderRadius: 1,
          }}
        >
          {errors.general}
        </Box>
      )}

      <Box display='flex' flexWrap='wrap' gap={2} sx={{ mt: 1 }}>
        {/* First Name */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <AppInputField
            label={label('First Name', 'الاسم الأول')}
            value={values.first_name}
            onChange={handleChange('first_name')}
            error={!!errors.first_name}
            helperText={errors.first_name}
            placeholder={label('Enter first name', 'أدخل الاسم الأول')}
            inputBackgroundColor={controlBg}
          />
        </Box>

        {/* Last Name */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <AppInputField
            label={label('Last Name', 'اسم العائلة')}
            value={values.last_name}
            onChange={handleChange('last_name')}
            error={!!errors.last_name}
            helperText={errors.last_name}
            placeholder={label('Enter last name', 'أدخل اسم العائلة')}
            inputBackgroundColor={controlBg}
          />
        </Box>

        {/* Email */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'} sx={{ minWidth: 0 }}>
          <AppInputField
            label={label('Email', 'البريد الإلكتروني')}
            value={values.email}
            onChange={handleChange('email')}
            error={!!errors.email}
            helperText={errors.email}
            placeholder={label('Enter email address', 'أدخل البريد الإلكتروني')}
            inputBackgroundColor={controlBg}
            containerSx={{ minWidth: 0, maxWidth: '100%' }}
            sx={{
              '& .MuiInputBase-input': {
                minWidth: 0,
                maxWidth: '100%',
              },
            }}
          />
        </Box>

        {/* Phone */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <AppInputField
            label={label('Phone', 'رقم الهاتف')}
            value={values.phone}
            onChange={e => handlePhoneChange(e.target.value)}
            error={!!errors.phone}
            helperText={errors.phone}
            placeholder={label('Enter phone number', 'أدخل رقم الهاتف')}
            InputProps={{
              startAdornment: (
                <InputAdornment
                  position='start'
                  sx={{ margin: 0, padding: '28px 0px' }}
                >
                  <PhoneInput
                    defaultCountry='pk'
                    value={values.phone}
                    onChange={handlePhoneChange}
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      width: '100%',
                    }}
                    inputStyle={{
                      border: 'none',
                      outline: 'none',
                      padding: '0',
                      margin: '0',
                      fontSize: '0.8rem',
                      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                      backgroundColor: 'transparent',
                      width: '100%',
                      boxSizing: 'border-box',
                      flex: 1,
                      height: '100%',
                      color: theme.palette.text.primary,
                    }}
                    countrySelectorStyleProps={{
                      buttonStyle: {
                        border: 'none',
                        background: 'transparent',
                        padding: '0',
                        margin: '0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: theme.palette.text.primary,
                      },
                    }}
                    className='phone-input-textfield-adornment'
                  />
                </InputAdornment>
              ),
            }}
            inputBackgroundColor={controlBg}
          />
        </Box>

        {/* CNIC Number */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <AppInputField
            label={label('CNIC Number', 'رقم الهوية الوطنية')}
            value={values.cnicNumber}
            onChange={handleCnicChange}
            error={!!errors.cnicNumber}
            helperText={errors.cnicNumber}
            placeholder='12345-1234567-1'
            inputBackgroundColor={controlBg}
          />
        </Box>

        {/* Gender - Only show when creating new employee, not when editing */}
        {!initialData && (
          <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
            <AppDropdown
              label={label('Gender', 'الجنس')}
              value={values.gender || 'all'}
              onChange={e =>
                setFieldValue('gender', String(e.target.value ?? ''))
              }
              error={!!errors.gender}
              helperText={errors.gender}
              inputBackgroundColor={controlBg}
              placeholder={label('Select gender', 'اختر الجنس')}
              sx={dropdownControlSx}
              options={[
                { value: 'all', label: label('Select Gender', 'اختر الجنس') },
                { value: 'male', label: label('Male', 'ذكر') },
                { value: 'female', label: label('Female', 'أنثى') },
              ]}
            />
          </Box>
        )}

        {/* Role Selection */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <AppDropdown
            label={label('Role', 'الدور')}
            value={(values.role || '').trim() || 'all'}
            onChange={e => setFieldValue('role', String(e.target.value ?? ''))}
            error={!!errors.role}
            helperText={errors.role}
            disabled={loadingRoles}
            inputBackgroundColor={controlBg}
            placeholder={label('Select role', 'اختر الدور')}
            sx={dropdownControlSx}
            options={[
              {
                value: 'all',
                label: loadingRoles
                  ? label('Loading roles...', 'جاري تحميل الأدوار...')
                  : label('Select role', 'اختر الدور'),
              },
              ...(roleOptions.length === 0
                ? []
                : roleOptions.map(name => ({
                  value: name,
                  label: name.charAt(0).toUpperCase() + name.slice(1),
                }))),
            ]}
          />
        </Box>

        {/* Department - select first; designations will show for this department only */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <AppDropdown
            label={label('Department', 'القسم')}
            value={values.departmentId || 'all'}
            onChange={handleDepartmentChange}
            error={!!errors.departmentId}
            helperText={errors.departmentId}
            disabled={loadingDepartments}
            inputBackgroundColor={controlBg}
            placeholder={label('Select department', 'اختر القسم')}
            sx={dropdownControlSx}
            options={[
              {
                value: 'all',
                label:
                  departments.length === 0
                    ? label('No departments', 'لا توجد أقسام')
                    : label('Select department', 'اختر القسم'),
              },
              ...departments.map(dept => ({
                value: dept.id,
                label: dept.name,
              })),
            ]}
          />
        </Box>

        {/* Designation - only designations of selected department */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <AppDropdown
            label={label('Designation', 'المسمى الوظيفي')}
            value={values.designationId || 'all'}
            onChange={handleDesignationChange}
            error={!!errors.designationId}
            helperText={errors.designationId}
            disabled={loadingDesignations || !values.departmentId}
            inputBackgroundColor={controlBg}
            placeholder={
              !values.departmentId
                ? label('Select department first', 'اختر القسم أولاً')
                : label('Select designation', 'اختر المسمى الوظيفي')
            }
            sx={dropdownControlSx}
            options={[
              {
                value: 'all',
                label:
                  designations.length === 0
                    ? !values.departmentId
                      ? label('Select department first', 'اختر القسم أولاً')
                      : label('No designations', 'لا توجد مسميات')
                    : label('Select designation', 'اختر المسمى الوظيفي'),
              },
              ...designations.map(des => ({
                value: des.id,
                label: des.title,
              })),
            ]}
          />
        </Box>

        {/* Profile Picture Upload */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <AppInputField
            label={label('Profile Picture', 'الصورة الشخصية')}
            value={values.profilePicture ? values.profilePicture.name : ''}
            error={!!errors.profilePicture}
            helperText={errors.profilePicture}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position='end'>
                  <input
                    accept=".jpg,.jpeg,.png,.gif,.webp"
                    style={{ display: 'none' }}
                    id='profile-picture-upload'
                    type='file'
                    onChange={handleImageUpload('profile')}
                  />
                  <label
                    htmlFor='profile-picture-upload'
                    style={{
                      display: 'flex',
                      height: '100%',
                      alignItems: 'center',
                    }}
                  >
                    <AppButton
                      variant='contained'
                      variantType='primary'
                      component='span'
                      size='medium'
                      text={label('Upload', 'رفع')}
                      sx={{
                        textTransform: 'none',
                        borderRadius: '0px 10px 10px 0px',
                        height: '100%',
                        boxShadow: 'none',
                        minWidth: '84px',
                        color: theme.palette.common.white,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&:hover': {
                          backgroundColor: 'primary.main',
                          boxShadow: 'none',
                        },
                      }}
                    />
                  </label>
                </InputAdornment>
              ),
            }}
            placeholder={label('Select profile picture', 'اختر الصورة الشخصية')}
            inputBackgroundColor={controlBg}
            sx={{
              '& .MuiOutlinedInput-root': {
                paddingRight: 0,
                '& .MuiInputAdornment-positionEnd': {
                  margin: 0,
                  height: '100%',
                  maxHeight: '100%',
                },
              },
            }}
          />
        </Box>

        {/* CNIC Front Picture Upload */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <AppInputField
            label={label('CNIC Front Side', 'الوجه الأمامي للهوية')}
            value={values.cnicFrontPicture ? values.cnicFrontPicture.name : ''}
            error={!!errors.cnicFrontPicture}
            helperText={errors.cnicFrontPicture}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position='end'>
                  <input
                    accept=".jpg,.jpeg,.png,.gif,.webp"
                    style={{ display: 'none' }}
                    id='cnic-front-upload'
                    type='file'
                    onChange={handleImageUpload('cnicFront')}
                  />
                  <label
                    htmlFor='cnic-front-upload'
                    style={{
                      display: 'flex',
                      height: '100%',
                      alignItems: 'center',
                    }}
                  >
                    <AppButton
                      variant='contained'
                      variantType='primary'
                      component='span'
                      size='medium'
                      text={label('Upload', 'رفع')}
                      sx={{
                        textTransform: 'none',
                        borderRadius: '0px 10px 10px 0px',
                        height: '100%',
                        boxShadow: 'none',
                        minWidth: '84px',
                        color: theme.palette.common.white,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&:hover': {
                          backgroundColor: 'primary.main',
                          boxShadow: 'none',
                        },
                      }}
                    />
                  </label>
                </InputAdornment>
              ),
            }}
            placeholder={label(
              'Select CNIC front side',
              'اختر الوجه الأمامي للهوية'
            )}
            inputBackgroundColor={controlBg}
            sx={{
              '& .MuiOutlinedInput-root': {
                paddingRight: 0,
                '& .MuiInputAdornment-positionEnd': {
                  margin: 0,
                  height: '100%',
                  maxHeight: '100%',
                },
              },
            }}
          />
        </Box>

        {/* CNIC Back Picture Upload */}
        <Box flex={isSm ? '1 1 100%' : '1 1 48%'}>
          <AppInputField
            label={label('CNIC Back Side', 'الوجه الخلفي للهوية')}
            value={values.cnicBackPicture ? values.cnicBackPicture.name : ''}
            error={!!errors.cnicBackPicture}
            helperText={errors.cnicBackPicture}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position='end'>
                  <input
                    accept=".jpg,.jpeg,.png,.gif,.webp"
                    style={{ display: 'none' }}
                    id='cnic-back-upload'
                    type='file'
                    onChange={handleImageUpload('cnicBack')}
                  />
                  <label
                    htmlFor='cnic-back-upload'
                    style={{
                      display: 'flex',
                      height: '100%',
                      alignItems: 'center',
                    }}
                  >
                    <AppButton
                      variant='contained'
                      variantType='primary'
                      component='span'
                      size='medium'
                      text={label('Upload', 'رفع')}
                      sx={{
                        textTransform: 'none',
                        height: '100%',
                        boxShadow: 'none',
                        minWidth: '84px',
                        borderRadius: '0px 10px 10px 0px',
                        color: theme.palette.common.white,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&:hover': {
                          backgroundColor: 'primary.main',
                          boxShadow: 'none',
                        },
                      }}
                    />
                  </label>
                </InputAdornment>
              ),
            }}
            placeholder={label(
              'Select CNIC back side',
              'اختر الوجه الخلفي للهوية'
            )}
            inputBackgroundColor={controlBg}
            sx={{
              '& .MuiOutlinedInput-root': {
                paddingRight: 0,
                '& .MuiInputAdornment-positionEnd': {
                  margin: 0,
                  height: '100%',
                  maxHeight: '100%',
                },
              },
            }}
          />
        </Box>

        {/* Image Previews - Show uploaded or existing (when editing) */}
        {(values.profilePicture ||
          values.cnicFrontPicture ||
          values.cnicBackPicture ||
          initialData?.profilePicture ||
          initialData?.cnicFrontPicture ||
          initialData?.cnicBackPicture) && (
            <Box flex='1 1 100%' sx={{ mt: 2 }}>
              <Box display='flex' flexWrap='wrap' gap={2} justifyContent='center'>
                {(values.profilePicture || initialData?.profilePicture) && (
                  <Box sx={{ textAlign: 'center', position: 'relative' }}>
                    <Box
                      sx={{
                        position: 'relative',
                        width: 150,
                        height: 150,
                        mb: 1,
                      }}
                    >
                      <Box
                        component='img'
                        src={
                          values.profilePicture
                            ? URL.createObjectURL(values.profilePicture)
                            : toAbsoluteUrl(initialData?.profilePicture)
                        }
                        alt='Profile Preview'
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: 'primary.main',
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.8,
                            transform: 'scale(1.05)',
                            transition: 'all 0.3s ease',
                          },
                        }}
                        onClick={() =>
                          handleImagePreviewClick(
                            values.profilePicture
                              ? URL.createObjectURL(values.profilePicture)
                              : toAbsoluteUrl(initialData?.profilePicture ?? ''),
                            'Profile Picture'
                          )
                        }
                      />
                      <IconButton
                        size='small'
                        onClick={(e) => {
                          e.stopPropagation();
                          if (values.profilePicture) {
                            handleClearUploadedPicture('profile');
                          } else if (initialData?.profilePicture) {
                            handleDeleteExistingDocument('profile', initialData.profilePicture);
                          }
                        }}
                        disabled={deletingType === 'profile'}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                          color: 'error.main',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 1)',
                            transform: 'scale(1.1)',
                          },
                        }}
                      >
                        {deletingType === 'profile' ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <CloseIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                    <Typography variant='caption' sx={{ display: 'block' }}>
                      {label('Profile Picture', 'الصورة الشخصية')}
                    </Typography>
                  </Box>
                )}

                {(values.cnicFrontPicture || initialData?.cnicFrontPicture) && (
                  <Box sx={{ textAlign: 'center', position: 'relative' }}>
                    <Box
                      sx={{
                        position: 'relative',
                        width: 150,
                        height: 150,
                        mb: 1,
                      }}
                    >
                      <Box
                        component='img'
                        src={
                          values.cnicFrontPicture
                            ? URL.createObjectURL(values.cnicFrontPicture)
                            : toAbsoluteUrl(initialData?.cnicFrontPicture)
                        }
                        alt='CNIC Front Preview'
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: 'primary.main',
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.8,
                            transform: 'scale(1.1)',
                            transition: 'all 0.3s ease',
                          },
                        }}
                        onClick={() =>
                          handleImagePreviewClick(
                            values.cnicFrontPicture
                              ? URL.createObjectURL(values.cnicFrontPicture)
                              : toAbsoluteUrl(initialData?.cnicFrontPicture ?? ''),
                            'CNIC Front'
                          )
                        }
                      />
                      <IconButton
                        size='small'
                        onClick={(e) => {
                          e.stopPropagation();
                          if (values.cnicFrontPicture) {
                            handleClearUploadedPicture('cnicFront');
                          } else if (initialData?.cnicFrontPicture) {
                            handleDeleteExistingDocument('cnicFront', initialData.cnicFrontPicture);
                          }
                        }}
                        disabled={deletingType === 'cnicFront'}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                          color: 'error.main',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 1)',
                            transform: 'scale(1.1)',
                          },
                        }}
                      >
                        {deletingType === 'cnicFront' ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <CloseIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                    <Typography variant='caption' sx={{ display: 'block' }}>
                      {label('CNIC Front', 'الوجه الأمامي للهوية')}
                    </Typography>
                  </Box>
                )}

                {(values.cnicBackPicture || initialData?.cnicBackPicture) && (
                  <Box sx={{ textAlign: 'center', position: 'relative' }}>
                    <Box
                      sx={{
                        position: 'relative',
                        width: 150,
                        height: 150,
                        mb: 1,
                      }}
                    >
                      <Box
                        component='img'
                        src={
                          values.cnicBackPicture
                            ? URL.createObjectURL(values.cnicBackPicture)
                            : toAbsoluteUrl(initialData?.cnicBackPicture)
                        }
                        alt='CNIC Back Preview'
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: 'primary.main',
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.8,
                            transform: 'scale(1.1)',
                            transition: 'all 0.3s ease',
                          },
                        }}
                        onClick={() =>
                          handleImagePreviewClick(
                            values.cnicBackPicture
                              ? URL.createObjectURL(values.cnicBackPicture)
                              : toAbsoluteUrl(initialData?.cnicBackPicture ?? ''),
                            'CNIC Back'
                          )
                        }
                      />
                      <IconButton
                        size='small'
                        onClick={(e) => {
                          e.stopPropagation();
                          if (values.cnicBackPicture) {
                            handleClearUploadedPicture('cnicBack');
                          } else if (initialData?.cnicBackPicture) {
                            handleDeleteExistingDocument('cnicBack', initialData.cnicBackPicture);
                          }
                        }}
                        disabled={deletingType === 'cnicBack'}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                          color: 'error.main',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 1)',
                            transform: 'scale(1.1)',
                          },
                        }}
                      >
                        {deletingType === 'cnicBack' ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <CloseIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                    <Typography variant='caption' sx={{ display: 'block' }}>
                      {label('CNIC Back', 'الوجه الخلفي للهوية')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}

        {/* Password reset info - show only on create (no initialData) */}
        {!initialData && (
          <Box flex='1 1 100%'>
            <Box
              sx={{
                p: 2,
                bgcolor: theme.palette.primary.main,
                color: theme.palette.common.white,
                borderRadius: 1,
                textAlign: 'center',
              }}
            >
              {label(
                "A temporary password will be generated and sent to the employee's email for password reset.",
                'سيتم إنشاء كلمة مرور مؤقتة وإرسالها إلى بريد الموظف الإلكتروني لإعادة تعيين كلمة المرور.'
              )}
            </Box>
          </Box>
        )}

        {/* Submit */}
        <Box
          flex='1 1 100%'
          display='flex'
          justifyContent={
            isSm ? 'center' : language === 'ar' ? 'flex-start' : 'flex-end'
          }
        >
          <AppButton
            variant='contained'
            variantType='primary'
            type='submit'
            disabled={!hasChanges || submitting || !isFormComplete()}
            startIcon={
              submitting ? (
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              ) : null
            }
            sx={{
              fontSize: 'var(--body-font-size)',
              lineHeight: 'var(--body-line-height)',
              letterSpacing: 'var(--body-letter-spacing)',
              boxShadow: 'none',
              minWidth: { xs: 'auto', sm: 200 },
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.75, sm: 1 },
              '& .MuiButton-startIcon': {
                marginRight: { xs: 0.5, sm: 1 },
                '& > *:nth-of-type(1)': {
                  fontSize: { xs: '18px', sm: '20px' },
                },
              },
            }}
            text={
              submitting
                ? label(
                  initialData
                    ? 'Updating...'
                    : values.role === 'manager'
                      ? 'Adding Manager...'
                      : 'Adding Employee...',
                  initialData
                    ? 'جاري التحديث...'
                    : values.role === 'manager'
                      ? 'جاري إضافة المدير...'
                      : 'جاري إضافة الموظف...'
                )
                : label(
                  initialData
                    ? 'Update Employee'
                    : values.role === 'manager'
                      ? 'Add Manager'
                      : 'Add Employee',
                  initialData
                    ? 'تحديث الموظف'
                    : values.role === 'manager'
                      ? 'إضافة مدير'
                      : 'إضافة موظف'
                )
            }
          />
        </Box>
      </Box>

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onClose={handleClosePreview}
        maxWidth='md'
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
        }}
      >
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0,
            position: 'relative',
          }}
        >
          <IconButton
            onClick={handleClosePreview}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              zIndex: 1,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            ✕
          </IconButton>
          {previewImage && (
            <>
              <Box
                component='img'
                src={previewImage.src}
                alt={previewImage.title}
                sx={{
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
              />
              <Typography
                variant='h6'
                sx={{
                  mt: 2,
                  color: 'white',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                }}
              >
                {previewImage.title}
              </Typography>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AddEmployeeForm;
