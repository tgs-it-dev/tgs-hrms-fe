import React, { useState, useEffect } from 'react';
import {
  Box,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Chip,
  Skeleton,
  Alert,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  useTheme,
} from '@mui/material';
import {
  Person as PersonIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useLanguage } from '../../hooks/useLanguage';
import { teamApiService } from '../../api/teamApi';
import type { TeamMember } from '../../api/teamApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppButton from '../common/AppButton';
import UserAvatar from '../common/UserAvatar';
import AppTable from '../common/AppTable';
import { Icons } from '../../assets/icons';

interface TeamMemberListProps {
  teamId: string;
}

const TeamMemberList: React.FC<TeamMemberListProps> = ({ teamId }) => {
  const { snackbar, showSuccess, closeSnackbar } = useErrorHandler();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const { language } = useLanguage();
  const theme = useTheme();

  const labels = {
    en: {
      name: 'Name',
      email: 'Email',
      designation: 'Designation',
      department: 'Department',
      actions: 'Actions',
      removeMember: 'Remove Member',
      noMembers: 'No team members found',
      loading: 'Loading members...',
      error: 'Failed to load team members',
      confirmRemove: 'Are you sure you want to remove this member?',
      memberRemoved: 'Member removed successfully',
      search: 'Search members...',
    },
    ar: {
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      designation: 'المسمى الوظيفي',
      department: 'القسم',
      actions: 'الإجراءات',
      removeMember: 'إزالة العضو',
      noMembers: 'لم يتم العثور على أعضاء الفريق',
      loading: 'جاري تحميل الأعضاء...',
      error: 'فشل في تحميل أعضاء الفريق',
      confirmRemove: 'هل أنت متأكد من إزالة هذا العضو؟',
      memberRemoved: 'تم إزالة العضو بنجاح',
      search: 'البحث عن الأعضاء...',
    },
  };

  const lang = labels[language];

  // Load team members
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await teamApiService.getTeamMembers(teamId, page + 1);
        setMembers(response.items || []);
        setTotal(response.total || 0);
      } catch {
        setError(lang.error);
        setMembers([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [teamId, page, rowsPerPage, lang.error]);

  // Listen for team updates to refresh data
  useEffect(() => {
    const handleTeamUpdate = () => {
      // Trigger a re-fetch of members
      const loadMembers = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await teamApiService.getTeamMembers(
            teamId,
            page + 1
          );

          // Map members with proper department data
          const membersWithDepartment = (response.items || []).map(member => {
            let department = member.department;

            if (!department && member.designation?.title) {
              const designationToDepartment: { [key: string]: string } = {
                'Frontend Web Developer': 'Information Technology',
                'Backend .Net Developer': 'Information Technology',
                'UI/UX Designer': 'Information Technology',
                'QA Engineer': 'Information Technology',
                'DevOps Engineer': 'Information Technology',
                'HR Manager': 'Human Resources',
                'HR Specialist': 'Human Resources',
                'Financial Analyst': 'Finance & Accounting',
                Accountant: 'Finance & Accounting',
                'Marketing Manager': 'Marketing & Sales',
                'Sales Representative': 'Marketing & Sales',
                'Operations Manager': 'Operations & Logistics',
              };

              const mappedDepartmentName =
                designationToDepartment[member.designation.title];
              if (mappedDepartmentName) {
                department = {
                  id: '2',
                  name: mappedDepartmentName,
                };
              }
            }

            return {
              ...member,
              department: department || {
                id: '2',
                name: 'Information Technology',
              },
            };
          });

          setMembers(membersWithDepartment);
          setTotal(response.total || 0);
        } catch {
          // Handle error silently
        } finally {
          setLoading(false);
        }
      };

      loadMembers();
    };

    window.addEventListener('teamUpdated', handleTeamUpdate);
    return () => window.removeEventListener('teamUpdated', handleTeamUpdate);
  }, [teamId, page]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Filter members based on search term (starts with match for each word)
  const filteredMembers = members.filter(member => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    const fullName =
      `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.toLowerCase();
    const email = (member.user?.email || '').toLowerCase();
    const designation = (member.designation?.title || '').toLowerCase();
    const department = (
      member.designation?.department?.name || ''
    ).toLowerCase();

    // Check if any word in the field starts with the search term
    const checkStartsWith = (text: string) => {
      const words = text.split(/\s+/);
      return words.some(word => word.startsWith(searchLower));
    };

    return (
      checkStartsWith(fullName) ||
      checkStartsWith(email) ||
      checkStartsWith(designation) ||
      checkStartsWith(department)
    );
  });

  const handleRemoveMember = async (member: TeamMember) => {
    setMemberToDelete(member);
    setShowDeleteConfirmDialog(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToDelete) return;

    try {
      await teamApiService.removeMemberFromTeam(teamId, memberToDelete.id);
      setMembers(prev =>
        prev.filter(member => member.id !== memberToDelete.id)
      );
      setTotal(prev => prev - 1);
      showSuccess(lang.memberRemoved);

      // Trigger auto-render for other components
      window.dispatchEvent(new CustomEvent('teamUpdated'));
    } catch {
      snackbar.error(lang.error);
    } finally {
      setShowDeleteConfirmDialog(false);
      setMemberToDelete(null);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant='rectangular' height={400} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity='error' sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (members.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          color: theme.palette.text.secondary,
        }}
      >
        <PersonIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
        <Typography variant='h6'>{lang.noMembers}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size='small'
          placeholder={lang.search}
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon sx={{ color: theme.palette.text.secondary }} />
              </InputAdornment>
            ),
          }}
          sx={{
            backgroundColor: 'background.paper',
            borderRadius: 2,
            '& .MuiOutlinedInput-root': {
              color: theme.palette.text.primary,
              '& fieldset': {
                borderColor: 'divider',
              },
              '&:hover fieldset': {
                borderColor: 'divider',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#484c7f',
              },
            },
            '& .MuiInputBase-input::placeholder': {
              color: theme.palette.text.secondary,
              opacity: 1,
            },
          }}
        />
      </Box>
      <AppTable
        component={Paper}
        sx={{
          backgroundColor: 'background.paper',
          boxShadow: 'none',
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell
              sx={{ color: theme.palette.text.primary, fontWeight: 600 }}
            >
              {lang.name}
            </TableCell>
            <TableCell
              sx={{ color: theme.palette.text.primary, fontWeight: 600 }}
            >
              {lang.email}
            </TableCell>
            <TableCell
              sx={{ color: theme.palette.text.primary, fontWeight: 600 }}
            >
              {lang.designation}
            </TableCell>
            <TableCell
              sx={{ color: theme.palette.text.primary, fontWeight: 600 }}
            >
              {lang.department}
            </TableCell>
            <TableCell
              sx={{ color: theme.palette.text.primary, fontWeight: 600 }}
            >
              {lang.actions}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredMembers
            .filter(
              member => member?.user?.first_name && member?.user?.last_name
            )
            .map(member => (
              <TableRow key={member.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <UserAvatar
                      user={{
                        id: member.user?.id,
                        first_name: member.user?.first_name || '',
                        last_name: member.user?.last_name || '',
                        profile_pic: member.user?.profile_pic,
                      }}
                      size={32}
                      sx={{ mr: 2 }}
                    />
                    <Typography sx={{ color: theme.palette.text.primary }}>
                      {member.user?.first_name || 'Unknown'}{' '}
                      {member.user?.last_name || 'User'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ color: theme.palette.text.secondary }}>
                  {member.user?.email || 'N/A'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={member.designation?.title || 'N/A'}
                    size='small'
                    sx={{
                      backgroundColor: '#3083DC',
                      color: '#FFFFFF',
                      fontSize: '0.75rem',
                    }}
                  />
                </TableCell>
                <TableCell sx={{ color: theme.palette.text.secondary }}>
                  {member.designation?.department?.name || 'N/A'}
                </TableCell>
                <TableCell>
                  <IconButton
                    size='small'
                    onClick={() => handleRemoveMember(member)}
                    sx={{ padding: { xs: 0.5, sm: 1 } }}
                    title={lang.removeMember}
                  >
                    <Box
                      component='img'
                      src={Icons.delete}
                      alt='Delete'
                      sx={{
                        width: { xs: 18, sm: 20 },
                        height: { xs: 18, sm: 20 },
                      }}
                    />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </AppTable>

      <TablePagination
        component='div'
        count={searchTerm ? filteredMembers.length : total}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        sx={{
          color: theme.palette.text.primary,
          '& .MuiTablePagination-selectIcon': {
            color: theme.palette.text.primary,
          },
        }}
      />
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirmDialog}
        onClose={() => setShowDeleteConfirmDialog(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'background.paper',
            color: theme.palette.text.primary,
          },
        }}
      >
        <DialogTitle sx={{ color: theme.palette.text.primary }}>
          Confirm Remove Member
        </DialogTitle>
        <DialogContent>
          {memberToDelete && (
            <Box sx={{ mt: 2 }}>
              <Typography variant='body1' sx={{ mb: 2 }}>
                Are you sure you want to remove{' '}
                <strong>
                  {memberToDelete.user?.first_name}{' '}
                  {memberToDelete.user?.last_name}
                </strong>{' '}
                from the team?
              </Typography>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: 'background.default',
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant='body2'
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <strong>Employee:</strong> {memberToDelete.user?.first_name}{' '}
                  {memberToDelete.user?.last_name}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <strong>Email:</strong> {memberToDelete.user?.email}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <strong>Designation:</strong>{' '}
                  {memberToDelete.designation?.title}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <strong>Department:</strong>{' '}
                  {memberToDelete.designation?.department?.name}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <AppButton
            variantType='secondary'
            variant='outlined'
            text='Cancel'
            onClick={() => setShowDeleteConfirmDialog(false)}
          />
          <AppButton
            variantType='danger'
            variant='contained'
            text='Remove Member'
            onClick={handleConfirmRemoveMember}
          />
        </DialogActions>
      </Dialog>
      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      />
    </Box>
  );
};

export default TeamMemberList;
