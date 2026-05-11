import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { departments, designations } from '../../Data/userMock';
import {
  validateEmailAddress,
  validatePasswordStrength,
} from '../../utils/validation';

export interface User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role: string;
  department: string;
  designation: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: User) => void;
  userData?: User;
}

const roles = ['Admin', 'User'];

const UserForm: React.FC<Props> = ({ open, onClose, onSubmit, userData }) => {
  const [formData, setFormData] = useState<User>({
    name: '',
    email: '',
    password: '',
    role: '',
    department: '',
    designation: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [designationList, setDesignationList] = useState<string[]>([]);

  useEffect(() => {
    if (userData) {
      setFormData(userData);
      setDesignationList(designations[userData.department] || []);
    } else {
      resetForm();
    }
  }, [userData, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'department' && { designation: '' }),
    }));

    if (name === 'department') {
      setDesignationList(designations[value] || []);
    }

    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Full Name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else {
      const emailError = validateEmailAddress(formData.email);
      if (emailError) newErrors.email = emailError;
    }
    if (!userData && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (!userData && formData.password) {
      const pwdError = validatePasswordStrength(formData.password);
      if (pwdError) newErrors.password = pwdError;
    }
    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.designation)
      newErrors.designation = 'Designation is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(formData);
    onClose();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '',
      department: '',
      designation: '',
    });
    setDesignationList([]);
    setErrors({});
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {userData ? 'Edit User' : 'Create User'}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box display='flex' flexWrap='wrap' gap={2} mt={1}>
          <Box width={{ xs: '100%', sm: '48%' }}>
            <TextField
              label='Full Name'
              name='name'
              fullWidth
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
            />
          </Box>
          <Box width={{ xs: '100%', sm: '48%' }}>
            <TextField
              label='Email'
              name='email'
              fullWidth
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
            />
          </Box>
          {!userData && (
            <Box width={{ xs: '100%', sm: '48%' }}>
              <TextField
                label='Password'
                name='password'
                type='password'
                fullWidth
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
              />
            </Box>
          )}
          <Box width={{ xs: '100%', sm: '48%' }}>
            <TextField
              select
              label='Role'
              name='role'
              fullWidth
              value={formData.role}
              onChange={handleChange}
              error={!!errors.role}
              helperText={errors.role}
            >
              {roles.map(role => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Box width={{ xs: '100%', sm: '48%' }}>
            <TextField
              select
              label='Department'
              name='department'
              fullWidth
              value={formData.department}
              onChange={handleChange}
              error={!!errors.department}
              helperText={errors.department}
            >
              {departments.map(dept => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Box width={{ xs: '100%', sm: '48%' }}>
            <TextField
              select
              label='Designation'
              name='designation'
              fullWidth
              value={formData.designation}
              onChange={handleChange}
              disabled={!formData.department}
              error={!!errors.designation}
              helperText={errors.designation}
            >
              {designationList.map(des => (
                <MenuItem key={des} value={des}>
                  {des}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
        <DialogActions sx={{ justifyContent: 'flex-start', px: 0, pb: 2 }}>
          <Button variant='contained' onClick={handleSubmit}>
            {userData ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

export default UserForm;
