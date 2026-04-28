import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  IconButton,
  useTheme,
  Divider,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useOutletContext } from 'react-router-dom';
import type { AppOutletContext } from '../../types/outletContexts';
import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';

interface Employee {
  id: string;
  user_id?: string; // User ID for fetching profile pictures
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  departmentId: string;
  designationId: string;
  role_name?: string;
  status?: string;
  cnic_number?: string;
  profile_picture?: string;
  cnic_picture?: string;
  cnic_back_picture?: string;
  department: {
    id: string;
    name: string;
    description: string;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  designation: {
    id: string;
    title: string;
    tenantId: string;
    departmentId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

interface EmployeeViewModalProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
}
const getCnicDocuments = (
  employee: Employee, 
  images: { front: string; back: string }, 
  getLabel: (en: string, ar: string) => string
) => [
  {
    key: 'front',
    exists: !!employee.cnic_picture,
    url: images.front,
    label: getLabel('CNIC Front', 'الهوية الأمامية'),
    emptyText: getLabel('No CNIC Front Image', 'لا توجد صورة أمامية للهوية'),
  },
  {
    key: 'back',
    exists: !!employee.cnic_back_picture,
    url: images.back,
    label: getLabel('CNIC Back', 'الهوية الخلفية'),
    emptyText: getLabel('No CNIC Back Image', 'لا توجد صورة خلفية للهوية'),
  }
];

const EmployeeViewModal: React.FC<EmployeeViewModalProps> = ({
  open,
  onClose,
  employee,
}) => {
  const theme = useTheme();
  const direction = theme.direction;
  const { darkMode } = useOutletContext<AppOutletContext>();

  const bgColor = darkMode ? '#111' : '#fff';
  const textColor = darkMode ? '#8f8f8f' : '#000';
  const borderColor = darkMode ? '#333' : '#ddd';

  // State for images
  const [profileImage, setProfileImage] = useState<string>('');
  const [cnicFrontImage, setCnicFrontImage] = useState<string>('');
  const [cnicBackImage, setCnicBackImage] = useState<string>('');
  const [loadingImages, setLoadingImages] = useState(false);

  const getLabel = (en: string, ar: string) => (direction === 'rtl' ? ar : en);

  // Load images when modal opens
  useEffect(() => {
    if (open && employee) {
      setLoadingImages(true);

      try {
        const profileUrl = (employee.profile_picture) ?? '';
        const cnicFrontUrl = (employee.cnic_picture) ?? '';
        const cnicBackUrl = (employee.cnic_back_picture) ?? '';

        setProfileImage(profileUrl);
        setCnicFrontImage(cnicFrontUrl);
        setCnicBackImage(cnicBackUrl);
      } finally {
        setLoadingImages(false);
      }
    } else {
      // Reset images when modal closes
      setProfileImage('');
      setCnicFrontImage('');
      setCnicBackImage('');
      setLoadingImages(false);
    }
  }, [open, employee]);

  // Print functionality removed per request

  if (!employee) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: bgColor,
          color: textColor,
          direction: direction === 'rtl' ? 'rtl' : 'ltr',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: textColor,
        }}
      >
        {getLabel('Employee Details', 'تفاصيل الموظف')}
        <IconButton
          onClick={onClose}
          aria-label='Close employee details dialog'
          sx={{ color: theme.palette.text.primary }}
        >
          <CloseIcon aria-hidden='true' />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box id='employee-print-content'>
          <Divider sx={{ mb: 3 }} />

          {/* Profile Picture */}
          {(employee.profile_picture || employee.user_id) && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              {loadingImages ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 120,
                  }}
                >
                  <CircularProgress size={40} />
                </Box>
              ) : profileImage ? (
                <Avatar
                  src={profileImage}
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    border: '1px solid #000',
                  }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    backgroundColor: darkMode ? '#555' : '#ccc',
                    border: '1px solid #000',
                  }}
                >
                  {employee.name.charAt(0).toUpperCase()}
                </Avatar>
              )}
            </Box>
          )}

          {/* Employee Information */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 3,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <AppCard
                sx={{ backgroundColor: darkMode ? '#1e1e1e' : '#f5f5f5' }}
              >
                <Box sx={{ p: 2 }}>
                <Typography variant='h6' sx={{ color: textColor, mb: 2 }}>
                  {getLabel('Personal Information', 'المعلومات الشخصية')}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  {[
                    { label: getLabel('Name', 'الاسم'), value: employee.name },
                    { label: getLabel('Email', 'البريد الإلكتروني'), value: employee.email },
                    { label: getLabel('Phone', 'رقم الهاتف'), value: employee.phone },
                    { label: getLabel('CNIC Number', 'رقم الهوية'), value: employee.cnic_number || 'N/A' },
                  ].map((item, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        width: { xs: '100%', md: 'calc(50% - 8px)' }, 
                        mb: 1,
                        // Increased to 80px to handle very long wrapped emails/names
                        minHeight: '80px', 
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Typography
                        variant='body2'
                        sx={{ fontWeight: 'bold', color: textColor }}
                      >
                        {item.label}:
                      </Typography>
                      <Typography 
                        variant='body1' 
                        sx={{ 
                          color: textColor, 
                          wordBreak: 'break-all', // Forces long emails to break so they don't overflow the card
                          lineHeight: 1.2 
                        }}
                      >
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              </AppCard>
            </Box>

            <Box sx={{ flex: 1 }}>
              <AppCard
                sx={{ backgroundColor: darkMode ? '#1e1e1e' : '#f5f5f5' }}
              >
                <Box sx={{ p: 2 }}>
                <Typography variant='h6' sx={{ color: textColor, mb: 2 }}>
                  {getLabel('Work Information', 'معلومات العمل')}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  {[
                    { label: getLabel('Department', 'القسم'), value: employee.department?.name || 'N/A' },
                    { label: getLabel('Designation', 'الوظيفة'), value: employee.designation?.title || 'N/A' },
                    { label: getLabel('Role', 'الدور'), value: employee.role_name || 'N/A' },
                    { label: getLabel('Status', 'الحالة'), value: employee.status || 'N/A' },
                  ].map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        width: { xs: '100%', md: 'calc(50% - 8px)' },
                        mb: 1,
                        minHeight: '80px', 
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Typography
                        variant='body2'
                        sx={{ fontWeight: 'bold', color: textColor }}
                      >
                        {item.label}:
                      </Typography>
                      <Typography 
                        variant='body1' 
                        sx={{ 
                          color: textColor,
                          lineHeight: 1.2,
                          wordBreak: 'break-word' 
                        }}
                      >
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              </AppCard>
            </Box>
          </Box>

          {/* CNIC Images */}
          {(employee.cnic_picture || employee.cnic_back_picture) && (
            <Box sx={{ mt: 3 }}>
              <Typography variant='h6' sx={{ color: textColor }}>
                {getLabel('CNIC Documents', 'وثائق الهوية')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 2,
                }}
              >
                {getCnicDocuments(employee, { front: cnicFrontImage, back: cnicBackImage }, getLabel)
                  .filter(doc => doc.exists)
                  .map((doc) => (
                    <Box key={doc.key} sx={{ flex: 1 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        {/* This Wrapper Box ensures identical height/width for both images */}
                        <Box
                          sx={{
                            width: '100%',
                            height: '220px', 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px solid ${borderColor}`,
                            borderRadius: '8px',
                            backgroundColor: darkMode ? '#1e1e1e' : '#f5f5f5',
                            overflow: 'hidden',
                            mb: 1
                          }}
                        >
                          {loadingImages ? (
                            <CircularProgress size={40} />
                          ) : doc.url ? (
                            <img
                              src={doc.url}
                              alt={doc.label}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain', // Keeps aspect ratio perfect
                                padding: '10px'       // Matches the "look" of your screenshot
                              }}
                            />
                          ) : (
                            <Typography variant='body2' sx={{ color: textColor }}>
                              {doc.emptyText}
                            </Typography>
                          )}
                        </Box>
                        
                        <Typography variant='body2' sx={{ color: textColor }}>
                          {doc.label}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-end', p: 3 }}>
        <AppButton
          onClick={onClose}
          variant='outlined'
          variantType='secondary'
          sx={{
            color: 'var(--primary-dark-color)',
            borderColor: 'var(--primary-dark-color)',
            textTransform: 'none',
            '&:hover': {
              borderColor: 'var(--primary-dark-color)',
              backgroundColor: 'action.hover',
            },
          }}
        >
          {getLabel('Close', 'إغلاق')}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeViewModal;
