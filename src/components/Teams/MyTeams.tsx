import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Tooltip,
} from '@mui/material';

import {
  Group as GroupIcon,
  Add as AddIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useLanguage } from '../../hooks/useLanguage';
import type { Team } from '../../api/teamApi';
import { colorTokens } from '../../theme';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import { isAdmin, isManager } from '../../utils/auth';
import TeamMemberList from './TeamMemberList';
import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';
import AvailableEmployees from './AvailableEmployees';

interface MyTeamsProps {
  teams: Team[];
}

const MyTeams: React.FC<MyTeamsProps> = ({ teams }) => {
  const { snackbar, closeSnackbar } = useErrorHandler();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const { language } = useLanguage();
  const theme = useTheme();

  const labels = {
    en: {
      noTeams: 'You are not managing any teams yet.',
      teamMembers: 'Team Members',
      addMember: 'Add Member',
      removeMember: 'Remove Member',
      manager: 'Manager',
      members: 'Members',
      viewMembers: 'View Members',
      addMemberToTeam: 'Add Member to Team',
      selectEmployee: 'Select Employee',
      cancel: 'Cancel',
      add: 'Add',
      remove: 'Remove',
      confirmRemove: 'Are you sure you want to remove this member?',
      memberAdded: 'Member added successfully',
      memberRemoved: 'Member removed successfully',
      error: 'An error occurred',
    },
    ar: {
      noTeams: 'أنت لا تدير أي فرق بعد.',
      teamMembers: 'أعضاء الفريق',
      addMember: 'إضافة عضو',
      removeMember: 'إزالة عضو',
      manager: 'مدير',
      members: 'الأعضاء',
      viewMembers: 'عرض الأعضاء',
      addMemberToTeam: 'إضافة عضو للفريق',
      selectEmployee: 'اختر الموظف',
      cancel: 'إلغاء',
      add: 'إضافة',
      remove: 'إزالة',
      confirmRemove: 'هل أنت متأكد من إزالة هذا العضو؟',
      memberAdded: 'تم إضافة العضو بنجاح',
      memberRemoved: 'تم إزالة العضو بنجاح',
      error: 'حدث خطأ',
    },
  };

  const lang = labels[language];

  // Generate for avatar

  // Generate avatar color
  const generateAvatarColor = (name: string): string => {
    const colors = [...colorTokens.avatar];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleViewMembers = (team: Team) => {
    setSelectedTeam(team);
    setShowMemberDialog(true);
  };

  const handleAddMember = (team: Team) => {
    setSelectedTeam(team);
    setShowAddMemberDialog(true);
  };

  if (teams.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          color: theme.palette.text.secondary,
        }}
      >
        <GroupIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
        <Typography variant='h6' gutterBottom>
          {lang.noTeams}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(2, 1fr)',
          },
          gap: 3,
        }}
      >
        {teams.map(team => (
          <AppCard
            key={team.id}
            sx={{
              backgroundColor: 'background.paper',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease-in-out',
              },
              p: 3,
            }}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    backgroundColor: generateAvatarColor(team.name),
                    mr: 2,
                  }}
                >
                  <GroupIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography
                    variant='h6'
                    sx={{ color: theme.palette.text.primary, fontWeight: 600 }}
                  >
                    {team.name}
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    {team.manager?.first_name} {team.manager?.last_name}
                  </Typography>
                </Box>
              </Box>

              {team.description && (
                <Tooltip title={team.description} placement='top' arrow>
                  <Typography
                    variant='body2'
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: 'var(--body-font-size)',
                      mb: 2,
                      lineHeight: 1.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {team.description.length > 80
                      ? `${team.description.slice(0, 80).trim()}...`
                      : team.description}
                  </Typography>
                </Tooltip>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip
                  label={`${team.teamMembers?.length || 0} ${lang.members}`}
                  size='small'
                  icon={<PersonIcon />}
                  sx={{
                    backgroundColor: 'primary.main',
                    color: 'common.white',
                    fontSize: '0.75rem',
                    '& .MuiChip-icon': {
                      color: 'common.white',
                    },
                  }}
                />
              </Box>

              <Stack direction='row' spacing={1} sx={{ mt: 'auto' }}>
                <AppButton
                  variant='outlined'
                  variantType='secondary'
                  size='small'
                  startIcon={
                    <GroupIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                  }
                  onClick={() => handleViewMembers(team)}
                  sx={{
                    flex: 1,
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    backgroundColor: 'transparent',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 0.75, sm: 1 },
                    px: { xs: 1, sm: 1.5 },
                    minWidth: 0,
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'rgba(48, 131, 220, 0.1)',
                    },
                  }}
                >
                  {lang.viewMembers}
                </AppButton>
                {(isAdmin() || isManager()) && (
                  <AppButton
                    variant='outlined'
                    variantType='secondary'
                    size='small'
                    startIcon={
                      <AddIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                    }
                    onClick={() => handleAddMember(team)}
                    sx={{
                      flex: 1,
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      backgroundColor: 'transparent',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      py: { xs: 0.75, sm: 1 },
                      px: { xs: 1, sm: 1.5 },
                      minWidth: 0,
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'rgba(48, 131, 220, 0.1)',
                      },
                    }}
                  >
                    {lang.addMember}
                  </AppButton>
                )}
              </Stack>
            </Box>
          </AppCard>
        ))}
      </Box>

      {/* Team Members Dialog */}
      <Dialog
        open={showMemberDialog}
        onClose={() => setShowMemberDialog(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle sx={{ color: theme.palette.text.primary }}>
          {selectedTeam?.name} - {lang.teamMembers}
        </DialogTitle>
        <DialogContent>
          {selectedTeam && <TeamMemberList teamId={selectedTeam.id} />}
        </DialogContent>
        <DialogActions>
          <AppButton
            onClick={() => setShowMemberDialog(false)}
            variantType='secondary'
            variant='outlined'
          >
            {lang.cancel}
          </AppButton>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog
        open={showAddMemberDialog}
        onClose={() => setShowAddMemberDialog(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle sx={{ color: theme.palette.text.primary }}>
          {selectedTeam?.name} - {lang.addMemberToTeam}
        </DialogTitle>
        <DialogContent>
          {selectedTeam && (
            <AvailableEmployees
              teamId={selectedTeam.id}
              teamName={selectedTeam.name}
              teamDescription={selectedTeam.description}
            />
          )}
        </DialogContent>
        <DialogActions>
          <AppButton
            onClick={() => setShowAddMemberDialog(false)}
            variantType='secondary'
            variant='outlined'
          >
            {lang.cancel}
          </AppButton>
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

export default MyTeams;
