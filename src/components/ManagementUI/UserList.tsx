// // src/components/Users/UserList.tsx
import React, { useState } from 'react';
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  MenuItem,
  TextField,
  useTheme,
} from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import UserForm from './UserForm';
import AddIcon from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import type { User } from './UserForm';
import {
  departments,
  designations,
  users as mockUsers,
} from '../../Data/userMock';
import AppButton from '../common/AppButton';
import { COLORS } from '../../constants/appConstants';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | undefined>(undefined);
  const [filters, setFilters] = useState({ department: '', designation: '' });
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const theme = useTheme();

  const filteredUsers = users.filter(user => {
    return (
      (!filters.department || user.department === filters.department) &&
      (!filters.designation || user.designation === filters.designation)
    );
  });

  const handleOpen = (user?: User) => {
    setEditUser(user);
    setOpen(true);
  };

  const handleClose = () => {
    setEditUser(undefined);
    setOpen(false);
  };

  const handleSubmit = (userData: User) => {
    if (editUser?.id) {
      setUsers(prev =>
        prev.map(user =>
          user.id === editUser.id ? { ...user, ...userData } : user
        )
      );
    } else {
      setUsers(prev => [...prev, { ...userData, id: Date.now() }]);
    }
  };

  const handleDelete = (id: number) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  };
  return (
    <Box p={0}>
      <Typography
        variant='h5'
        gutterBottom
        sx={{ color: darkMode ? COLORS.DARK_TEXT : COLORS.LIGHT_TEXT }}
      >
        User Management UI
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          flexWrap: 'wrap',
          gap: 2,
          mb: 2,
          alignItems: { xs: 'stretch', sm: 'center' },
          color: theme.palette.text.primary,
          width: '100%',
        }}
      >
        <TextField
          select
          size='small'
          label=' Department'
          value={filters.department}
          onChange={e =>
            setFilters({
              ...filters,
              department: e.target.value,
              designation: '',
            })
          }
          sx={{ width: { xs: '100%', sm: 180 } }}
        >
          <MenuItem value=''>All</MenuItem>
          {departments.map(dept => (
            <MenuItem key={dept} value={dept}>
              {dept}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size='small'
          label='Designation'
          value={filters.designation}
          onChange={e =>
            setFilters({ ...filters, designation: e.target.value })
          }
          sx={{ width: { xs: '100%', sm: 180 } }}
          disabled={!filters.department}
        >
          <MenuItem value=''>All</MenuItem>
          {(designations[filters.department] || []).map(des => (
            <MenuItem key={des} value={des}>
              {des}
            </MenuItem>
          ))}
        </TextField>

        <AppButton
          variant='contained'
          text='Add User'
          onClick={() => handleOpen()}
          startIcon={<AddIcon />}
          sx={{
            minHeight: '36px',
            paddingX: 2,
            fontSize: '14px',
            borderRadius: '4px',
            backgroundColor: '#484c7f',
            color: '#fff',
            textTransform: 'none',
            marginLeft: { xs: '0', sm: 'auto' },
          }}
        >
          Create User
        </AppButton>
      </Box>
      <Box
        sx={{
          overflowX: 'auto',
          bgcolor: theme.palette.background.paper,
          width: '100%',
        }}
      >
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Designation</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.department}</TableCell>
                <TableCell>{user.designation}</TableCell>
                <TableCell>
                  <Button onClick={() => handleOpen(user)}>
                    <Edit />
                  </Button>
                  {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- id is present for all persisted users */}
                  <Button color='error' onClick={() => handleDelete(user.id!)}>
                    <Delete />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <UserForm
        open={open}
        onClose={handleClose}
        onSubmit={handleSubmit}
        userData={editUser}
      />
    </Box>
  );
};

export default UserList;
