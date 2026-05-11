import React, { useState, useEffect } from 'react';
import {
  Stack,
  Box,
  Typography,
  Chip,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  TextField,
  InputAdornment,
  useTheme,
  SvgIcon,
} from '@mui/material';
import UserAvatar from '../common/UserAvatar';
import { Avatar } from '@mui/material';
import { Group as GroupIcon, Close as CloseIcon } from '@mui/icons-material';
import { teamApiService } from '../../api/teamApi';
import type { TeamMember } from '../../api/teamApi';
import { getUserRole, isAdmin } from '../../utils/auth';
import { ROLES } from '../../constants/roles';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import { useLanguage } from '../../hooks/useLanguage';
import { colorTokens } from '../../theme/tokens';

// Extended interface for admin team members with team info
interface AdminTeamMember extends TeamMember {
  team?: {
    id: string;
    name: string;
  };
}

const CustomSearchIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox='0 0 17 17' sx={{ fontSize: 18, ...props.sx }}>
    <path
      d='M16.0845 15.2001L12.1727 11.2891C13.3065 9.92798 13.8719 8.18211 13.7512 6.41472C13.6305 4.64733 12.8331 2.9945 11.5249 1.80006C10.2166 0.605618 8.49824 -0.038471 6.7272 0.00177892C4.95615 0.0420288 3.2688 0.763519 2.01616 2.01616C0.763519 3.2688 0.0420288 4.95615 0.00177892 6.7272C-0.038471 8.49824 0.605618 10.2166 1.80006 11.5249C2.9945 12.8331 4.64733 13.6305 6.41472 13.7512C8.18211 13.8719 9.92798 13.3065 11.2891 12.1727L15.2001 16.0845C15.2582 16.1425 15.3271 16.1886 15.403 16.22C15.4788 16.2514 15.5601 16.2676 15.6423 16.2676C15.7244 16.2676 15.8057 16.2514 15.8816 16.22C15.9575 16.1886 16.0264 16.1425 16.0845 16.0845C16.1425 16.0264 16.1886 15.9575 16.22 15.8816C16.2514 15.8057 16.2676 15.7244 16.2676 15.6423C16.2676 15.5601 16.2514 15.4788 16.22 15.403C16.1886 15.3271 16.1425 15.2582 16.0845 15.2001ZM1.26727 6.89227C1.26727 5.77975 1.59717 4.69221 2.21525 3.76719C2.83333 2.84216 3.71184 2.12119 4.73967 1.69545C5.76751 1.2697 6.89851 1.15831 7.98965 1.37535C9.0808 1.59239 10.0831 2.12812 10.8697 2.91479C11.6564 3.70146 12.1921 4.70374 12.4092 5.79489C12.6262 6.88603 12.5148 8.01703 12.0891 9.04486C11.6634 10.0727 10.9424 10.9512 10.0174 11.5693C9.09233 12.1874 8.00479 12.5173 6.89227 12.5173C5.40093 12.5156 3.97115 11.9225 2.91662 10.8679C1.86209 9.81339 1.26892 8.3836 1.26727 6.89227Z'
      fill='currentColor'
    />
  </SvgIcon>
);

interface TeamMembersAvatarProps {
  maxAvatars?: number;
  darkMode?: boolean;
}

// Generate avatar color based on name — uses design-token avatar palette
const generateAvatarColor = (name: string): string => {
  const colors = [...colorTokens.avatar];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

const TeamMembersAvatar: React.FC<TeamMembersAvatarProps> = ({
  darkMode = false,
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [adminTeamMembers, setAdminTeamMembers] = useState<AdminTeamMember[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [showAllMembersDialog, setShowAllMembersDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();
  const { language } = useLanguage();

  const labels = {
    en: {
      teamMembers: 'Team Members',
      noMembers: 'No team members',
      addMember: 'Add Member',
      manager: 'Manager',
      employee: 'Employee',
      department: 'Department',
      designation: 'Designation',
      team: 'Team',
      allTeamMembers: 'All Team Members',
      viewAllTeamMembers: 'View all {count} team members',
      searchMember: 'Search member...',
    },
    ar: {
      teamMembers: 'أعضاء الفريق',
      noMembers: 'لا يوجد أعضاء في الفريق',
      addMember: 'إضافة عضو',
      manager: 'مدير',
      employee: 'موظف',
      department: 'القسم',
      designation: 'المسمى الوظيفي',
      team: 'الفريق',
      allTeamMembers: 'جميع أعضاء الفريق',
      viewAllTeamMembers: 'عرض جميع {count} أعضاء الفريق',
      searchMember: 'بحث عن عضو...',
    },
  };

  const lang = labels[language];

  // Generate from name
  const generateInitials = (firstName: string, lastName: string): string => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}`;
  };

  // Check if user is a manager
  const isManager = (): boolean => {
    const userRole = getUserRole();
    return userRole === ROLES.MANAGER || userRole === 'Manager';
  };

  // Load team members for avatar display
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        setLoading(true);

        if (isManager()) {
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
        setTeamMembers([]);
        setAdminTeamMembers([]);
      } finally {
        setLoading(false);
      }
    };

    loadTeamMembers();
  }, []);

  // Render admin team member avatar with team info in tooltip
  const renderAdminAvatar = (
    member: AdminTeamMember,
    canOpenDialog = false
  ) => {
    try {
      // Add null checks to prevent errors
      if (!member?.user || !member.user.first_name || !member.user.last_name) {
        return null;
      }

      return (
        <UserAvatar
          key={member.id}
          user={{
            id: member.user.id,
            first_name: member.user.first_name,
            last_name: member.user.last_name,
            profile_pic: member.user.profile_pic,
          }}
          size={38}
          clickable={true}
          onClick={
            canOpenDialog ? () => setShowAllMembersDialog(true) : undefined
          }
          sx={{
            border: '2px solid white',
            cursor: 'pointer',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)',
              border: '2px solid',
              borderColor: 'common.black',
            },
          }}
        />
      );
    } catch {
      return null;
    }
  };

  // Render avatar with tooltip
  const renderAvatar = (member: TeamMember, canOpenDialog = false) => {
    try {
      // Add null checks to prevent errors
      if (!member?.user || !member.user.first_name || !member.user.last_name) {
        return null;
      }

      // Generate initials and avatar color for styling
      generateInitials(member.user.first_name, member.user.last_name);
      generateAvatarColor(member.user.first_name);
      return (
        <UserAvatar
          key={member.id}
          user={{
            id: member.user.id,
            first_name: member.user.first_name,
            last_name: member.user.last_name,
            profile_pic: member.user.profile_pic,
          }}
          size={38}
          clickable={true}
          onClick={
            canOpenDialog ? () => setShowAllMembersDialog(true) : undefined
          }
          sx={{
            border: '2px solid white',
            cursor: 'pointer',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)',
              border: '2px solid',
              borderColor: 'common.black',
            },
          }}
        />
      );
    } catch {
      return null;
    }
  };

  // Show loading skeletons
  if (loading) {
    return (
      <Stack direction='row' spacing={-1}>
        {[...Array(3)].map((_, _index) => (
          <Skeleton
            key={_index}
            variant='circular'
            width={38}
            height={38}
            sx={{
              backgroundColor: darkMode
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(0,0,0,0.1)',
            }}
          />
        ))}
      </Stack>
    );
  }

  // Show team members avatars for managers
  if (isManager() && teamMembers.length > 0) {
    // Filter out invalid members
    const validMembers = teamMembers.filter(
      member => member?.user?.first_name && member?.user?.last_name
    );

    if (validMembers.length === 0) {
      // No valid members, show default without plus button
      return (
        <>
          <Stack direction='row' spacing={-1} sx={{ display: 'flex' }}>
            <Avatar
              sx={{
                width: 38,
                height: 38,
                backgroundColor: 'var(--primary-dark-color)',
                cursor: 'pointer',
                border: '2px solid white',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  backgroundColor: 'var(--primary-light-color)',
                  border: '2px solid',
                  borderColor: 'common.black',
                },
              }}
            >
              <GroupIcon fontSize='medium' />
            </Avatar>
          </Stack>
        </>
      );
    }

    const displayMembers = validMembers.slice(0, 2);
    const remainingCount = Math.max(0, validMembers.length - 2);
    return (
      <>
        <Stack
          direction='row'
          spacing={-1}
          sx={{ display: 'flex', borderRadius: '16px' }}
        >
          {displayMembers
            .map(member => renderAvatar(member, remainingCount === 0))
            .filter(Boolean)}

          {remainingCount > 0 && (
            <Avatar
              onClick={() => setShowAllMembersDialog(true)}
              sx={{
                width: 38,
                height: 38,
                backgroundColor: 'var(--primary-dark-color)',
                color: theme.palette.common.white,
                fontSize: '0.8rem',
                fontWeight: 700,
                border: '2px solid white',
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  backgroundColor: 'var(--primary-dark-color)',
                  transform: 'scale(1.05)',
                  border: '2px solid',
                  borderColor: 'common.black',
                  boxShadow: '0 4px 12px rgba(48, 131, 220, 0.3)',
                },
              }}
            >
              +{remainingCount}
            </Avatar>
          )}
        </Stack>

        {/* All Team Members Dialog */}
        <Dialog
          open={showAllMembersDialog}
          onClose={() => setShowAllMembersDialog(false)}
          maxWidth='xs'
          PaperProps={{
            sx: {
              backgroundColor: 'background.paper',
              color: theme.palette.text.primary,
              borderRadius: '30px',
              // Figma: 527x693, but responsive to viewport on small/short screens
              width: { xs: 'calc(100vw - 32px)', sm: 'var(--dialog-width)' },
              maxWidth: 'var(--dialog-width)',
              maxHeight: {
                xs: 'calc(100vh - ${theme.spacing(4)})',
                sm: 'min(calc(100vh)',
              },
              // Prevent the dialog itself from scrolling (we scroll the list only)
              overflow: 'hidden',
            },
          }}
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: '30px',
              m: { xs: 2, sm: 3 },
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              // Figma padding: 32px top, 20px sides
              pt: 4,
              px: 2.5,
              pb: 0,
            }}
          >
            <Typography
              variant='h6'
              sx={{ fontWeight: 600, color: theme.palette.text.primary }}
            >
              {lang.allTeamMembers}{' '}
              <Box
                component='span'
                sx={{ color: theme.palette.text.secondary }}
              >
                (
                {(() => {
                  const validMembers = teamMembers.filter(
                    member =>
                      member?.user?.first_name && member?.user?.last_name
                  );
                  const filteredMembers = validMembers.filter(member => {
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase();
                    const fullName =
                      `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.toLowerCase();
                    const email = (member.user?.email || '').toLowerCase();
                    const designation = (
                      member.designation?.title || ''
                    ).toLowerCase();
                    const department = (
                      member.department?.name || ''
                    ).toLowerCase();
                    return (
                      fullName.includes(query) ||
                      email.includes(query) ||
                      designation.includes(query) ||
                      department.includes(query)
                    );
                  });
                  return filteredMembers.length;
                })()}
                )
              </Box>
            </Typography>
            <IconButton
              onClick={() => {
                setShowAllMembersDialog(false);
                setSearchQuery('');
              }}
              sx={{ color: theme.palette.text.secondary, p: 0 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent
            sx={{
              // Figma padding: 32px bottom, 20px sides
              px: 2.5,
              pt: 3,
              pb: 4,
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
              // Avoid an extra scroll container from DialogContent (scroll only the list)
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                mb: 3, // ~24px gap below search
              }}
            >
              <TextField
                fullWidth
                size='small'
                placeholder={lang.searchMember}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <CustomSearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  borderRadius: '12px',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.default',
                    color: theme.palette.text.primary,
                    borderRadius: '12px',
                    '& fieldset': {
                      borderColor: theme.palette.divider,
                      borderWidth: 1,
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.divider,
                    },
                    '&.Mui-focused fieldset': {
                      // Mid-grey focus ring — between tokens grey500/grey400, no exact match
                      borderColor: '#a0a0a0',
                      boxShadow: '0 0 0 2px rgba(0,0,0,0.02)',
                    },
                  },
                  '& .MuiInputBase-input': {
                    padding: '9px 0px',
                    fontSize: '0.9rem',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'var(--Dark-Grey, var( --dark-grey-color))',
                    opacity: 1,
                  },
                }}
              />
            </Box>
            {(() => {
              const validMembers = teamMembers.filter(
                member => member?.user?.first_name && member?.user?.last_name
              );

              const filteredMembers = validMembers.filter(member => {
                if (!searchQuery.trim()) return true;
                const query = searchQuery.toLowerCase();
                const fullName =
                  `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.toLowerCase();
                const email = (member.user?.email || '').toLowerCase();
                const designation = (
                  member.designation?.title || ''
                ).toLowerCase();
                const department = (
                  member.department?.name || ''
                ).toLowerCase();
                return (
                  fullName.includes(query) ||
                  email.includes(query) ||
                  designation.includes(query) ||
                  department.includes(query)
                );
              });

              if (filteredMembers.length === 0) {
                return (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography
                      variant='body2'
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {searchQuery ? 'No members found' : lang.noMembers}
                    </Typography>
                  </Box>
                );
              }

              return (
                <List
                  sx={{
                    p: 0,
                    px: 0,
                    // Taller scroll area so ~4 members are visible at once
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    '&::-webkit-scrollbar': {
                      width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: theme.palette.action.disabled,
                      borderRadius: '4px',
                      '&:hover': {
                        // Scrollbar hover — neutral grey, no exact token match
                        background: '#9e9e9e',
                      },
                    },
                    scrollbarWidth: 'thin',
                    // Firefox scrollbar color — no exact token match
                    scrollbarColor: '#bdbdbd transparent',
                  }}
                >
                  {filteredMembers.map(member => (
                    <ListItem
                      key={member.id}
                      sx={{
                        // CSS variable with fallback; #DCDCDC is the Light Grey CSS var value
                        borderBottom: '0.5px solid var(--Light-Grey, #DCDCDC)',
                        py: 1.5,
                        px: 0,
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 48 }}>
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
                        sx={{ minWidth: 0 }}
                        primary={
                          <Typography
                            variant='subtitle1'
                            sx={{
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              mb: 0,
                              lineHeight: '18px',
                            }}
                          >
                            {member.user?.first_name} {member.user?.last_name}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant='body2'
                              sx={{
                                color: theme.palette.text.secondary,
                                mb: 0.75,
                                fontSize: '0.875rem',
                              }}
                            >
                              {member.user?.email}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 0.75,
                                flexWrap: 'wrap',
                                maxWidth: '100%',
                                mt: 0.5,
                              }}
                            >
                              {member.department?.name && (
                                <Chip
                                  label={member.department.name}
                                  size='small'
                                  sx={{
                                    backgroundColor: 'transparent',
                                    borderRadius: '999px',
                                    border: `0.5px solid ${theme.palette.divider}`,
                                    color: 'var(--dark-grey-color)',
                                    fontSize: '0.7rem',
                                    height: 22,
                                    fontWeight: 500,
                                    px: 2,
                                    py: 0.5,
                                  }}
                                />
                              )}
                              {member.designation?.title && (
                                <Chip
                                  label={member.designation.title}
                                  size='small'
                                  sx={{
                                    // Designation chip — Figma indigo brand color, not yet in tokens
                                    backgroundColor: '#6155F5',
                                    color: 'common.white',
                                    borderRadius: '999px',
                                    fontSize: '0.7rem',
                                    height: 22,
                                    fontWeight: 500,
                                    px: 2,
                                    py: 0.5,
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              );
            })()}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Show all team members avatars for admins
  if (isAdmin() && adminTeamMembers.length > 0) {
    // Filter out invalid members
    const validMembers = adminTeamMembers.filter(
      member => member?.user?.first_name && member?.user?.last_name
    );

    if (validMembers.length === 0) {
      // No valid members, show default
      return (
        <>
          <Stack direction='row' spacing={-1} sx={{ display: 'flex' }}>
            <Avatar
              sx={{
                width: 38,
                height: 38,
                backgroundColor: 'var(--primary-dark-color)',
                cursor: 'pointer',
                border: '2px solid white',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  backgroundColor: 'var(--primary-light-olor)',
                  border: '2px solid',
                  borderColor: 'common.black',
                },
              }}
            >
              <GroupIcon fontSize='medium' />
            </Avatar>
          </Stack>
        </>
      );
    }

    const displayMembers = validMembers.slice(0, 2);
    const remainingCount = Math.max(0, validMembers.length - 2);

    return (
      <>
        <Stack
          direction='row'
          spacing={-1}
          sx={{ display: 'flex', borderRadius: '16px' }}
        >
          {displayMembers
            .map(member => renderAdminAvatar(member, remainingCount === 0))
            .filter(Boolean)}

          {remainingCount > 0 && (
            <Avatar
              onClick={() => setShowAllMembersDialog(true)}
              sx={{
                width: 38,
                height: 38,
                backgroundColor: 'var(--primary-dark-color)',
                color: theme.palette.common.white,
                fontSize: '0.8rem',
                fontWeight: 700,
                border: '2px solid white',
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  backgroundColor: 'var(--primary-dark-color)',
                  transform: 'scale(1.05)',
                  border: '2px solid',
                  borderColor: 'common.black',
                  boxShadow: '0 4px 12px rgba(48, 131, 220, 0.3)',
                },
              }}
            >
              +{remainingCount}
            </Avatar>
          )}
        </Stack>

        {/* All Team Members Dialog for Admin */}
        <Dialog
          open={showAllMembersDialog}
          onClose={() => setShowAllMembersDialog(false)}
          maxWidth='xs'
          PaperProps={{
            sx: {
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'background.paper',
              color: theme.palette.text.primary,
              borderRadius: '24px',
              width: '100%',
              maxWidth: 'var(--dialog-width)',
            },
          }}
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: '24px',
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: '16px 15px',
            }}
          >
            <Typography
              variant='h6'
              sx={{ fontWeight: 600, color: theme.palette.text.primary }}
            >
              {lang.allTeamMembers}{' '}
              <Box
                component='span'
                sx={{ color: theme.palette.text.secondary }}
              >
                (
                {(() => {
                  const validMembers = adminTeamMembers.filter(
                    member =>
                      member?.user?.first_name && member?.user?.last_name
                  );
                  const filteredMembers = validMembers.filter(member => {
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase();
                    const fullName =
                      `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.toLowerCase();
                    const email = (member.user?.email || '').toLowerCase();
                    const designation = (
                      member.designation?.title || ''
                    ).toLowerCase();
                    const department = (
                      member.department?.name || ''
                    ).toLowerCase();
                    const teamName = (member.team?.name || '').toLowerCase();
                    return (
                      fullName.includes(query) ||
                      email.includes(query) ||
                      designation.includes(query) ||
                      department.includes(query) ||
                      teamName.includes(query)
                    );
                  });
                  return filteredMembers.length;
                })()}
                )
              </Box>
            </Typography>
            <IconButton
              onClick={() => {
                setShowAllMembersDialog(false);
                setSearchQuery('');
              }}
              sx={{ color: theme.palette.text.secondary, p: 0 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent
            sx={{
              p: 0,
              '&::-webkit-scrollbar': {
                display: 'none',
              },
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <Box
              sx={{
                px: 2.5,
                pt: 3,
                pb: 4,

                display: 'flex',
                flexDirection: 'column',

                flex: 1,
                minHeight: 0,

                overflow: 'hidden', // ok
              }}
            >
              <TextField
                fullWidth
                size='small'
                placeholder={lang.searchMember}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <CustomSearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  borderRadius: '12px',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.default',
                    color: theme.palette.text.primary,
                    borderRadius: '12px',
                    '& fieldset': {
                      borderColor: theme.palette.divider,
                      borderWidth: 1,
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.divider,
                    },
                    '&.Mui-focused fieldset': {
                      // Mid-grey focus ring — between tokens grey500/grey400, no exact match
                      borderColor: '#a0a0a0',
                      boxShadow: '0 0 0 2px rgba(0,0,0,0.02)',
                    },
                  },
                  '& .MuiInputBase-input': {
                    padding: '10px 14px',
                    fontSize: '0.9rem',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'var(--Dark-Grey, var( --dark-grey-color))',
                    opacity: 1,
                  },
                }}
              />
            </Box>
            {(() => {
              const validMembers = adminTeamMembers.filter(
                member => member?.user?.first_name && member?.user?.last_name
              );

              const filteredMembers = validMembers.filter(member => {
                if (!searchQuery.trim()) return true;
                const query = searchQuery.toLowerCase();
                const fullName =
                  `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.toLowerCase();
                const email = (member.user?.email || '').toLowerCase();
                const designation = (
                  member.designation?.title || ''
                ).toLowerCase();
                const department = (
                  member.department?.name || ''
                ).toLowerCase();
                const teamName = (member.team?.name || '').toLowerCase();
                return (
                  fullName.includes(query) ||
                  email.includes(query) ||
                  designation.includes(query) ||
                  department.includes(query) ||
                  teamName.includes(query)
                );
              });

              if (filteredMembers.length === 0) {
                return (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography
                      variant='body2'
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {searchQuery ? 'No members found' : lang.noMembers}
                    </Typography>
                  </Box>
                );
              }

              return (
                <List
                  sx={{
                    p: 0,
                    px: 2,
                    maxHeight: '320px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    '&::-webkit-scrollbar': {
                      width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: theme.palette.action.disabled,
                      borderRadius: '4px',
                      '&:hover': {
                        // Scrollbar hover — neutral grey, no exact token match
                        background: '#9e9e9e',
                      },
                    },
                    scrollbarWidth: 'thin',
                    // Firefox scrollbar color — no exact token match
                    scrollbarColor: '#bdbdbd transparent',
                  }}
                >
                  {filteredMembers.map(member => (
                    <ListItem
                      key={member.id}
                      sx={{
                        // CSS variable with fallback; #DCDCDC is the Light Grey CSS var value
                        borderBottom: '0.5px solid var(--Light-Grey, #DCDCDC)',
                        py: 1.5,
                        px: 0,
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 48 }}>
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
                        sx={{ minWidth: 0 }}
                        primary={
                          <Typography
                            variant='subtitle1'
                            sx={{
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              mb: 0.25,
                            }}
                          >
                            {member.user?.first_name} {member.user?.last_name}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant='body2'
                              sx={{
                                color: theme.palette.text.secondary,
                                mb: 0.75,
                                fontSize: '0.875rem',
                              }}
                            >
                              {member.user?.email}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 0.75,
                                flexWrap: 'wrap',
                                maxWidth: '100%',
                                mt: 0.5,
                              }}
                            >
                              {member.department?.name && (
                                <Chip
                                  label={member.department.name}
                                  size='small'
                                  sx={{
                                    backgroundColor: 'transparent',
                                    borderRadius: '999px',
                                    border: `0.5px solid ${theme.palette.divider}`,
                                    color: 'var( --dark-grey-color)',
                                    fontSize: '0.7rem',
                                    height: 22,
                                    fontWeight: 500,
                                    px: '10px',
                                    py: '16px',
                                  }}
                                />
                              )}
                              {member.designation?.title && (
                                <Chip
                                  label={member.designation.title}
                                  size='small'
                                  sx={{
                                    // Designation chip — Figma indigo brand color, not yet in tokens
                                    backgroundColor: '#6155F5',
                                    color: 'common.white',
                                    borderRadius: '999px',
                                    fontSize: '0.7rem',
                                    height: 22,
                                    fontWeight: 500,
                                    px: '10px',
                                    py: '16px',
                                  }}
                                />
                              )}
                              {member.team?.name && (
                                <Chip
                                  label={member.team.name}
                                  size='small'
                                  sx={{
                                    // Team chip — Figma teal brand color, not yet in tokens
                                    backgroundColor: '#008C95',
                                    color: 'common.white',
                                    borderRadius: '999px',
                                    fontSize: '0.7rem',
                                    height: 22,
                                    fontWeight: 500,
                                    px: '10px',
                                    py: '16px',
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              );
            })()}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Show default avatars for managers when no team members
  if (isManager()) {
    return (
      <>
        <Stack direction='row' spacing={-1} sx={{ display: 'flex' }}>
          <Avatar
            sx={{
              width: 38,
              height: 38,
              backgroundColor: 'var(--primary-dark-color)',
              cursor: 'pointer',
              border: '2px solid white',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                backgroundColor: 'var(--primary-light-color)',
                border: '2px solid',
                borderColor: 'common.black',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
            }}
          >
            <GroupIcon fontSize='medium' />
          </Avatar>
        </Stack>
      </>
    );
  }

  // Show default avatar for admins when no team members
  if (isAdmin()) {
    return (
      <>
        <Stack direction='row' spacing={-1} sx={{ display: 'flex' }}>
          <Avatar
            sx={{
              width: 38,
              height: 38,
              backgroundColor: 'var(--primary-dark-color)',
              cursor: 'pointer',
              border: '2px solid white',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                backgroundColor: 'var(--primary-light-color)',
                border: '2px solid',
                borderColor: 'common.black',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
            }}
          >
            <GroupIcon fontSize='medium' />
          </Avatar>
        </Stack>
      </>
    );
  }

  // Return null for other roles (user, etc.)
  return null;
};

export default TeamMembersAvatar;
