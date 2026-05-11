import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  TextField,
  InputAdornment,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Group as GroupIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import UserAvatar from '../common/UserAvatar';
import { teamApiService } from '../../api/teamApi';
import type { TeamMember } from '../../api/teamApi';
import { useLanguage } from '../../hooks/useLanguage';
import { getUserRole, isAdmin } from '../../utils/auth';
import { ROLES } from '../../constants/roles';

// Extended interface for admin team members with team info
interface AdminTeamMember extends TeamMember {
  team?: {
    id: string;
    name: string;
  };
}

interface TeamMembersModalProps {
  open: boolean;
  onClose: () => void;
  onOpenInviteModal: () => void;
  darkMode?: boolean;
}

const TeamMembersModal: React.FC<TeamMembersModalProps> = ({
  open,
  onClose,
  onOpenInviteModal,
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [adminTeamMembers, setAdminTeamMembers] = useState<AdminTeamMember[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { language } = useLanguage();
  const theme = useTheme();

  // Check if user is a manager
  const checkIsManager = (): boolean => {
    const userRole = getUserRole();
    return userRole === ROLES.MANAGER || userRole === 'Manager';
  };

  const labels = {
    en: {
      title: 'Team Members',
      allTeamMembers: 'All Team Members',
      noMembers: 'No team members found',
      addMember: 'Add Member',
      loading: 'Loading team members...',
      error: 'Failed to load team members',
      team: 'Team',
      search: 'Search members...',
    },
    ar: {
      title: 'أعضاء الفريق',
      allTeamMembers: 'جميع أعضاء الفريق',
      noMembers: 'لا يوجد أعضاء في الفريق',
      addMember: 'إضافة عضو',
      loading: 'جاري تحميل الأعضاء...',
      error: 'فشل في تحميل الأعضاء',
      team: 'الفريق',
      search: 'البحث عن الأعضاء...',
    },
  };

  const lang = labels[language];

  // Load team members
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        setLoading(true);
        setError(null);

        if (checkIsManager()) {
          // Load manager's team members
          const response = await teamApiService.getMyTeamMembers(1);
          setTeamMembers(response.items || []);
          setAdminTeamMembers([]);
        } else if (isAdmin()) {
          // Load all team members across all teams for admin
          const response = await teamApiService.getAllTeamMembers(1);
          setAdminTeamMembers(response.items || []);
          setTeamMembers([]);
        } else {
          // For other roles, don't load any team members
          setTeamMembers([]);
          setAdminTeamMembers([]);
        }
      } catch {
        setError(lang.error);
        setTeamMembers([]);
        setAdminTeamMembers([]);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadTeamMembers();
    }
  }, [open, lang.error]);

  const handleAddMember = () => {
    onClose();
    onOpenInviteModal();
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Filter members based on search term (starts with match for each word)
  const filterMembers = (members: TeamMember[]) => {
    if (!searchTerm.trim()) return members;
    const searchLower = searchTerm.toLowerCase().trim();

    // Check if any word in the field starts with the search term
    const checkStartsWith = (text: string) => {
      const words = text.split(/\s+/);
      return words.some(word => word.startsWith(searchLower));
    };

    return members.filter(member => {
      const fullName =
        `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.toLowerCase();
      const email = (member.user?.email || '').toLowerCase();
      const designation = (member.designation?.title || '').toLowerCase();
      const department = (member.department?.name || '').toLowerCase();

      return (
        checkStartsWith(fullName) ||
        checkStartsWith(email) ||
        checkStartsWith(designation) ||
        checkStartsWith(department)
      );
    });
  };

  // Separate filter for admin members so we can include team name safely
  const filterAdminMembers = (members: AdminTeamMember[]) => {
    if (!searchTerm.trim()) return members;
    const searchLower = searchTerm.toLowerCase().trim();

    const checkStartsWith = (text: string) => {
      const words = text.split(/\s+/);
      return words.some(word => word.startsWith(searchLower));
    };

    return members.filter(member => {
      const fullName =
        `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.toLowerCase();
      const email = (member.user?.email || '').toLowerCase();
      const designation = (member.designation?.title || '').toLowerCase();
      const department = (member.department?.name || '').toLowerCase();
      const teamName = (member.team?.name || '').toLowerCase();

      return (
        checkStartsWith(fullName) ||
        checkStartsWith(email) ||
        checkStartsWith(designation) ||
        checkStartsWith(department) ||
        checkStartsWith(teamName)
      );
    });
  };

  const filteredTeamMembers = filterMembers(teamMembers);
  const filteredAdminTeamMembers = filterAdminMembers(adminTeamMembers);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2,
          color: theme.palette.text.primary,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupIcon sx={{ color: theme.palette.text.secondary }} />

          <Typography
            variant='h6'
            component='div'
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {isAdmin() ? lang.allTeamMembers : lang.title}

            <Box
              component='span'
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: '12px',
                backgroundColor: 'var(--primary-dark-color)',
                color: theme.palette.text.primary,
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                minWidth: 'fit-content',
              }}
            >
              {isAdmin()
                ? searchTerm
                  ? filteredAdminTeamMembers.length
                  : adminTeamMembers.length
                : searchTerm
                  ? filteredTeamMembers.length
                  : teamMembers.length}
            </Box>
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          sx={{ color: theme.palette.text.secondary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          p: 0,
          minHeight: 400,
        }}
      >
        {loading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CircularProgress />
            <Typography
              variant='body2'
              sx={{ mt: 1, color: theme.palette.text.secondary }}
            >
              {lang.loading}
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity='error'>{error}</Alert>
          </Box>
        ) : (
            isAdmin() ? adminTeamMembers.length === 0 : teamMembers.length === 0
          ) ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <GroupIcon
              sx={{
                fontSize: 48,
                mb: 2,
                opacity: 0.5,
                color: theme.palette.text.secondary,
              }}
            />
            <Typography
              variant='body2'
              sx={{ color: theme.palette.text.secondary, mb: 2 }}
            >
              {lang.noMembers}
            </Typography>
            <IconButton
              onClick={handleAddMember}
              sx={{
                backgroundColor: 'var(--primary-dark-color)',
                color: 'common.white',
                '&:hover': {
                  backgroundColor: 'var(--primary-dark-color)',
                  opacity: 0.9,
                },
              }}
            >
              <AddIcon />
            </IconButton>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                flexShrink: 0,
              }}
            >
              <TextField
                fullWidth
                size='small'
                placeholder={lang.search}
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon
                        sx={{ color: theme.palette.text.secondary }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': {
                    color: theme.palette.text.primary,
                    '& fieldset': {
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor:
                        theme.palette.mode === 'dark'
                          ? theme.palette.text.secondary
                          : theme.palette.text.secondary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--primary-dark-color)',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: theme.palette.text.secondary,
                    opacity: 1,
                  },
                }}
              />
            </Box>
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {(searchTerm &&
                isAdmin() &&
                filteredAdminTeamMembers.length === 0) ||
              (searchTerm && !isAdmin() && filteredTeamMembers.length === 0) ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography
                    variant='body2'
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    {lang.noMembers}
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    px: 2.5,
                    pt: 0,
                    pb: 2.5,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <List sx={{ p: 0, m: 0, width: '100%', flex: 1 }}>
                    {isAdmin()
                      ? filteredAdminTeamMembers
                          .filter(
                            member =>
                              member?.user?.first_name &&
                              member?.user?.last_name
                          )
                          .map(member => (
                            <React.Fragment key={member.id}>
                              <ListItem
                                sx={{
                                  borderBottom: `1px solid ${theme.palette.divider}`,
                                  '&:last-child': { borderBottom: 'none' },
                                }}
                              >
                                <ListItemAvatar>
                                  <UserAvatar
                                    user={{
                                      id: member.user?.id,
                                      first_name: member.user?.first_name || '',
                                      last_name: member.user?.last_name || '',
                                      profile_pic: member.user?.profile_pic,
                                    }}
                                    size={40}
                                    clickable={false}
                                  />
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Typography
                                      variant='subtitle1'
                                      sx={{
                                        fontWeight: 600,
                                        color: theme.palette.text.primary,
                                      }}
                                    >
                                      {member.user?.first_name}{' '}
                                      {member.user?.last_name}
                                    </Typography>
                                  }
                                  secondary={
                                    <Box sx={{ mt: 0.5 }}>
                                      <Typography
                                        variant='body2'
                                        sx={{
                                          color: theme.palette.text.secondary,
                                          mb: 0.5,
                                        }}
                                      >
                                        {member.user?.email}
                                      </Typography>
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          gap: 1,
                                          flexWrap: 'wrap',
                                        }}
                                      >
                                        <Chip
                                          label={
                                            member.designation?.title || 'N/A'
                                          }
                                          size='small'
                                          sx={{
                                            backgroundColor:
                                              'var(--primary-dark-color)',
                                            color: 'white',
                                            fontSize: '0.7rem',
                                            height: 20,
                                          }}
                                        />
                                        <Chip
                                          label={
                                            member.department?.name || 'N/A'
                                          }
                                          size='small'
                                          variant='outlined'
                                          sx={{
                                            borderColor: theme.palette.divider,
                                            color: theme.palette.text.secondary,
                                            fontSize: '0.7rem',
                                            height: 20,
                                          }}
                                        />
                                      </Box>
                                    </Box>
                                  }
                                />
                              </ListItem>
                            </React.Fragment>
                          ))
                      : filteredTeamMembers
                          .filter(
                            member =>
                              member?.user?.first_name &&
                              member?.user?.last_name
                          )
                          .map(member => (
                            <React.Fragment key={member.id}>
                              <ListItem
                                sx={{
                                  borderBottom: `1px solid ${theme.palette.divider}`,
                                  '&:last-child': { borderBottom: 'none' },
                                }}
                              >
                                <ListItemAvatar>
                                  <UserAvatar
                                    user={{
                                      id: member.user?.id,
                                      first_name: member.user?.first_name || '',
                                      last_name: member.user?.last_name || '',
                                      profile_pic: member.user?.profile_pic,
                                    }}
                                    size={40}
                                    clickable={false}
                                  />
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Typography
                                      variant='subtitle1'
                                      sx={{
                                        fontWeight: 600,
                                        color: theme.palette.text.primary,
                                      }}
                                    >
                                      {member.user?.first_name}{' '}
                                      {member.user?.last_name}
                                    </Typography>
                                  }
                                  secondary={
                                    <Box sx={{ mt: 0.5 }}>
                                      <Typography
                                        variant='body2'
                                        sx={{
                                          color: theme.palette.text.secondary,
                                          mb: 0.5,
                                        }}
                                      >
                                        {member.user?.email}
                                      </Typography>
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          gap: 1,
                                          flexWrap: 'wrap',
                                        }}
                                      >
                                        <Chip
                                          label={
                                            member.designation?.title || 'N/A'
                                          }
                                          size='small'
                                          sx={{
                                            backgroundColor:
                                              'var(--primary-dark-color)',
                                            color: 'white',
                                            fontSize: '0.7rem',
                                            height: 20,
                                          }}
                                        />
                                        <Chip
                                          label={
                                            member.department?.name || 'N/A'
                                          }
                                          size='small'
                                          variant='outlined'
                                          sx={{
                                            borderColor: theme.palette.divider,
                                            color: theme.palette.text.secondary,
                                            fontSize: '0.7rem',
                                            height: 20,
                                          }}
                                        />
                                      </Box>
                                    </Box>
                                  }
                                />
                              </ListItem>
                            </React.Fragment>
                          ))}
                  </List>
                  <Divider sx={{ my: 1, borderColor: theme.palette.divider }} />
                </Box>
              )}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TeamMembersModal;
