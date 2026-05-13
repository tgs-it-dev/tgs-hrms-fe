import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Avatar,
  Stack,
  Divider,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import settings from '../../assets/dashboardIcon/ui-settings.svg';
import { useLanguage } from '../../hooks/useLanguage';

interface Employee {
  name_en: string;
  name_ar: string;
  email: string;
  role: 'Admin' | 'Member';
}

interface EmployeeInviteModalProps {
  open: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

const style = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  borderRadius: 2,
  boxShadow: 24,
  p: 2,
  bgcolor: 'background.paper',
  outline: 'none',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  width: 'calc(100% - 64px)',
  maxWidth: 700,
  maxHeight: 'calc(100% - 64px)',
  overflowY: 'auto',
};

const employees: Employee[] = [
  {
    name_en: 'Ali Raza',
    name_ar: 'علي رضا',
    email: 'ali@example.com',
    role: 'Admin',
  },
  {
    name_en: 'Fatima Khan',
    name_ar: 'فاطمة خان',
    email: 'fatima@example.com',
    role: 'Member',
  },
  {
    name_en: 'Fatima Khan',
    name_ar: 'فاطمة خان',
    email: 'fatima@example.com',
    role: 'Member',
  },
];

const labels = {
  en: {
    title: 'Employee Invitation',
    emailPlaceholder: 'Email Address',
    send: 'Send',
    employee: 'Employee',
    roleAdmin: 'Admin',
    roleMember: 'Member',
    done: 'Done',
    save: 'Save',
  },
  ar: {
    title: 'دعوة الموظف',
    emailPlaceholder: 'البريد الإلكتروني',
    send: 'إرسال',
    employee: 'الموظف',
    roleAdmin: 'مسؤول',
    roleMember: 'عضو',
    done: 'تم',
    save: 'حفظ',
  },
};

const EmployeeInviteModal: React.FC<EmployeeInviteModalProps> = ({
  open,
  onClose,
  darkMode = false,
}) => {
  const [email, setEmail] = useState<string>('');
  const { language } = useLanguage();
  const theme = useTheme();
  const lang = labels[language];

  const handleSend = () => {
    if (email.trim()) {
      setEmail('');
    }
  };

  const bgColor = theme.palette.background.paper;
  const fieldBg = theme.palette.background.default;
  const textColor = theme.palette.text.secondary;
  const cardBg = theme.palette.background.default;

  return (
    <Modal open={open} onClose={onClose} sx={{ overflowY: 'auto' }}>
      <Box sx={{ ...style, bgcolor: bgColor }}>
        {/* Header */}
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          mb={2}
        >
          <Typography
            variant='h6'
            sx={{
              fontSize: { xs: 18, md: 25 },
              fontWeight: 700,
              color: textColor,
            }}
          >
            {lang.title}
          </Typography>
          <IconButton
            onClick={onClose}
            aria-label='Close employee invitation modal'
            sx={{ color: textColor }}
          >
            <CloseIcon aria-hidden='true' />
          </IconButton>
        </Box>

        {/* Email input + Send button */}
        <Box display='flex' mb={3}>
          <TextField
            fullWidth
            size='small'
            label={lang.emailPlaceholder}
            value={email}
            onChange={e => setEmail(e.target.value)}
            sx={{
              backgroundColor: fieldBg,
              '& .MuiOutlinedInput-root': {
                borderRadius: '4px 1px 1px 4px',
                backgroundColor: fieldBg,
                '&.Mui-focused fieldset': {
                  borderColor: 'transparent',
                },
              },
            }}
            InputLabelProps={{
              sx: { color: textColor },
            }}
          />
          <Button
            variant='contained'
            sx={{
              fontSize: 14,
              backgroundColor: 'var(--dark-color)',
              whiteSpace: 'nowrap',
              px: 2,
              borderRadius: '0px 4px 4px 0px',
            }}
            onClick={handleSend}
          >
            {lang.send}
          </Button>
        </Box>

        {/* Employee List */}
        <Box>
          <Typography fontWeight={700} fontSize={16} mb={1} color={textColor}>
            {lang.employee}
          </Typography>

          {employees.map((emp, idx) => (
            <Box
              key={idx}
              bgcolor={cardBg}
              borderRadius={2}
              py={1.5}
              mb={1.2}
              display='flex'
              justifyContent='space-between'
              alignItems='center'
            >
              <Stack direction='row' spacing={2} alignItems='center'>
                <Avatar
                  sx={{
                    // Alternating avatar backgrounds: amber + error — amber not yet in tokens
                    bgcolor: idx % 2 === 0 ? '#ffcd38' : 'error.main',
                    color: 'common.white',
                  }}
                >
                  {(language === 'ar' ? emp.name_ar : emp.name_en)[0]}
                </Avatar>
                <Box>
                  <Typography fontWeight={700} fontSize={14} color={textColor}>
                    {language === 'ar' ? emp.name_ar : emp.name_en}
                  </Typography>
                  <Typography
                    sx={{ fontSize: { xs: 11, md: 13 } }}
                    color={textColor}
                  >
                    {emp.email}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction='row' spacing={1} alignItems='center'>
                <Typography fontSize={13} color={textColor}>
                  {emp.role === 'Admin' ? lang.roleAdmin : lang.roleMember}
                </Typography>
                <img
                  src={settings}
                  alt='settings'
                  style={{
                    width: 16,
                    height: 16,
                    filter: darkMode
                      ? 'invert(1) brightness(0.8)'
                      : 'grayscale(100%) brightness(55%)',
                  }}
                />
              </Stack>
            </Box>
          ))}
        </Box>

        {/* Bottom Buttons */}
        <Divider sx={{ my: 3, borderColor: 'divider' }} />
        <Box display='flex' justifyContent='end' gap={1}>
          <Button
            variant='outlined'
            sx={{
              color: 'common.white',
              backgroundColor: 'var(--background-dark)',
              borderColor: 'divider',
            }}
            onClick={onClose}
          >
            {lang.done}
          </Button>
          <Button
            variant='contained'
            sx={{ backgroundColor: 'var(--dark-color)' }}
          >
            {lang.save}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default EmployeeInviteModal;
