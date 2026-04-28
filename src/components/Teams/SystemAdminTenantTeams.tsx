import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Tooltip,
  useTheme,
} from '@mui/material';
import AppButton from '../common/AppButton';
import AppTable from '../common/AppTable';
import AppDropdown from '../common/AppDropdown';

import {
  Group as GroupIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useLanguage } from '../../hooks/useLanguage';
import type { AllTenantsTeamsResponse, TenantTeam } from '../../api/teamApi';
import type { SystemTenant } from '../../api/systemTenantApi';

interface SystemAdminTenantTeamsProps {
  data: AllTenantsTeamsResponse;
  darkMode?: boolean;
}

const SystemAdminTenantTeams: React.FC<SystemAdminTenantTeamsProps> = ({
  data,
  darkMode = false,
}) => {
  const theme = useTheme();
  const [selectedTeam, setSelectedTeam] = useState<TenantTeam | null>(null);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all');
  const [allTenants, setAllTenants] = useState<SystemTenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const { language } = useLanguage();

  const bgColor = darkMode ? '#111' : '#fff';
  const borderColor = darkMode ? '#252525' : '#f0f0f0';

  useEffect(() => {
    // Extract tenant list from GET:/teams/all-tenants API response
    try {
      setLoadingTenants(true);
      // Extract unique tenants from the teams API response
      const uniqueTenantsMap = new Map<string, SystemTenant>();
      data.tenants.forEach(tenant => {
        if (!uniqueTenantsMap.has(tenant.tenant_id)) {
          uniqueTenantsMap.set(tenant.tenant_id, {
            id: tenant.tenant_id,
            name: tenant.tenant_name,
            status: tenant.tenant_status as 'active' | 'suspended' | 'delelted',
            isDeleted: false,
            created_at: '',
            updated_at: '',
            deleted_at: null,
          });
        }
      });
      setAllTenants(Array.from(uniqueTenantsMap.values()));
    } catch {
      // Leave tenants list empty on failure
    } finally {
      setLoadingTenants(false);
    }
  }, [data.tenants]);

  const allTenantsFromData = useMemo(() => data.tenants, [data.tenants]);

  const selectedTenantTeams = useMemo(() => {
    if (selectedTenantId === 'all' || !selectedTenantId) {
      return allTenantsFromData.flatMap(tenant => tenant.teams || []);
    }
    const tenant = allTenantsFromData.find(
      t => t.tenant_id === selectedTenantId
    );
    return tenant?.teams || [];
  }, [selectedTenantId, allTenantsFromData]);

  const selectedTenant = useMemo(() => {
    if (selectedTenantId === 'all' || !selectedTenantId) return null;
    return (
      allTenantsFromData.find(t => t.tenant_id === selectedTenantId) || null
    );
  }, [selectedTenantId, allTenantsFromData]);

  const labels = {
    en: {
      selectTenant: 'Select Tenant',
      allTenants: 'All Tenants',
      noTenants: 'No tenants with teams found.',
      noTeams: 'No teams found for this tenant.',
      tenantName: 'Tenant',
      tenantStatus: 'Status',
      teams: 'Teams',
      teamMembers: 'Team Members',
      manager: 'Manager',
      members: 'Members',
      viewMembers: 'View Members',
      cancel: 'Cancel',
      active: 'Active',
      suspended: 'Suspended',
      description: 'Description',
      designation: 'Designation',
      department: 'Department',
      email: 'Email',
      status: 'Status',
    },
    ar: {
      selectTenant: 'اختر المستأجر',
      allTenants: 'جميع المستأجرين',
      noTenants: 'لم يتم العثور على مستأجرين بفرق.',
      noTeams: 'لم يتم العثور على فرق لهذا المستأجر.',
      tenantName: 'المستأجر',
      tenantStatus: 'الحالة',
      teams: 'الفرق',
      teamMembers: 'أعضاء الفريق',
      manager: 'مدير',
      members: 'الأعضاء',
      viewMembers: 'عرض الأعضاء',
      cancel: 'إلغاء',
      active: 'نشط',
      suspended: 'معلق',
      description: 'الوصف',
      designation: 'المنصب',
      department: 'القسم',
      email: 'البريد الإلكتروني',
      status: 'الحالة',
    },
  };

  const lang = labels[language];

  const generateAvatarColor = (name: string): string => {
    const colors = [
      '#1976d2',
      '#388e3c',
      '#f57c00',
      '#d32f2f',
      '#7b1fa2',
      '#303f9f',
      '#ff6f00',
      '#388e3c',
      '#c2185b',
      '#0097a7',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleViewMembers = (team: TenantTeam) => {
    setSelectedTeam(team);
    setShowMemberDialog(true);
  };

  const handleTenantChange = (value: string | number) => {
    setSelectedTenantId(value ? String(value) : 'all');
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' => {
    if (status.toLowerCase() === 'active') return 'success';
    if (status.toLowerCase() === 'suspended') return 'error';
    return 'warning';
  };

  if (allTenants.length === 0 && !loadingTenants) {
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
        <BusinessIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
        <Typography variant='h6' gutterBottom>
          {lang.noTenants}
        </Typography>
      </Box>
    );
  }

  if (loadingTenants) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height={400}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box
            sx={{
              minWidth: { xs: '100%', sm: '200px' },
              maxWidth: { xs: '100%', sm: '400px' },
            }}
          >
            <AppDropdown
              showLabel={false}
              value={selectedTenantId}
              onChange={e => handleTenantChange(e.target.value)}
              placeholder={lang.selectTenant}
              inputBackgroundColor={bgColor}
              options={[
                { value: 'all', label: lang.allTenants },
                ...allTenants.map((tenant: SystemTenant) => ({
                  value: tenant.id,
                  label: tenant.name,
                })),
              ]}
              sx={{
                '& .MuiSelect-select': {
                  color: theme.palette.text.primary,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: borderColor,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: borderColor,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: borderColor,
                },
              }}
            />
          </Box>
        </Box>

        {/* Selected Tenant Info */}
        {selectedTenant && selectedTenantId !== 'all' && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar
                sx={{
                  backgroundColor: generateAvatarColor(
                    selectedTenant.tenant_name
                  ),
                  width: 48,
                  height: 48,
                }}
              >
                <BusinessIcon />
              </Avatar>
              <Box>
                <Typography
                  variant='h6'
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                  }}
                >
                  {selectedTenant.tenant_name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  <Chip
                    label={selectedTenant.tenant_status}
                    size='small'
                    color={getStatusColor(selectedTenant.tenant_status)}
                    sx={{ fontSize: '0.7rem', height: 22 }}
                  />
                  <Chip
                    label={`${selectedTenant.teams.length} ${lang.teams}`}
                    size='small'
                    icon={<GroupIcon sx={{ fontSize: 14 }} />}
                    sx={{ fontSize: '0.7rem', height: 22 }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {selectedTenantTeams.length > 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              flexWrap: 'wrap',
              gap: { xs: 2, sm: 3, md: 4 },
              maxWidth: '100%',
              mx: 'auto',
              justifyContent: { xs: 'center', sm: 'flex-start' },
              '& > *': {
                width: {
                  xs: '100%',
                  sm: 'calc(50% - 12px)',
                  md: 'calc(50% - 16px)',
                  lg: 'calc(33.333% - 21px)',
                },
                maxWidth: { xs: '100%', sm: '350px', md: '380px', lg: '400px' },
                minWidth: { xs: '280px', sm: '300px' },
              },
            }}
          >
            {selectedTenantTeams.map((team: TenantTeam) => {
              const teamDescription = (team.description || '').trim();
              return (
                <Card
                  key={team.id}
                  sx={{
                    backgroundColor: theme => theme.palette.background.paper,
                    height: { xs: 'auto', sm: 'auto', md: 'auto' },
                    minHeight: {
                      xs: '200px',
                      sm: '220px',
                      md: '240px',
                      lg: '260px',
                    },
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    borderRadius: 2,
                  }}
                >
                  <CardContent
                    sx={{
                      flexGrow: 1,
                      p: { xs: 2.5, sm: 3.5 },
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar
                        sx={{
                          backgroundColor: generateAvatarColor(team.name),
                          mr: 2,
                          width: { xs: 40, sm: 48 },
                          height: { xs: 40, sm: 48 },
                          flexShrink: 0,
                        }}
                      >
                        <GroupIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                      </Avatar>
                      <Box
                        sx={{ flexGrow: 1, minWidth: 0, overflow: 'hidden' }}
                      >
                        <Typography
                          variant='h6'
                          sx={{
                            color: theme.palette.text.primary,
                            fontWeight: 600,
                            fontSize: { xs: '1rem', sm: '1.25rem' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.2,
                            minHeight: 'auto',
                          }}
                          title={team.name}
                        >
                          {team.name}
                        </Typography>
                        <Typography
                          variant='body2'
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.2,
                            minHeight: 'auto',
                          }}
                          title={`${team.manager.first_name} ${team.manager.last_name}`}
                        >
                          {team.manager.first_name} {team.manager.last_name}
                        </Typography>
                      </Box>
                    </Box>

                    {teamDescription && (
                      <Tooltip title={teamDescription} arrow placement='top'>
                        <Typography
                          variant='body2'
                          sx={{
                            color: theme.palette.text.secondary,
                            mb: 3,
                            lineHeight: 1.6,
                            fontSize: 'var(--body-font-size)',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            minHeight: { xs: '3.6em', sm: '4.2em' },
                            cursor: 'help',
                          }}
                        >
                          {teamDescription}
                        </Typography>
                      </Tooltip>
                    )}

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 3,
                        flexWrap: 'wrap',
                        gap: 1.5,
                      }}
                    >
                      <Chip
                        label={`${team.members.length} ${lang.members}`}
                        size='small'
                        icon={
                          <PersonIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                        }
                        color='primary'
                        sx={{
                          backgroundColor: '#3083DC',
                          color:
                            theme.palette.mode === 'dark'
                              ? theme.palette.text.primary
                              : theme.palette.common.white,
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          height: { xs: 24, sm: 28 },
                          '& .MuiChip-icon': {
                            color:
                              theme.palette.mode === 'dark'
                                ? theme.palette.text.primary
                                : theme.palette.common.white,
                          },
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        mt: 'auto',
                        pt: 2,
                        borderTop: theme =>
                          `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <AppButton
                        variantType='secondary'
                        variant='outlined'
                        size='small'
                        text={lang.viewMembers}
                        startIcon={
                          <GroupIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                        }
                        onClick={() => handleViewMembers(team)}
                        fullWidth
                        sx={{
                          borderColor: '#3083DC',
                          color: '#3083DC',
                          backgroundColor: 'transparent',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          py: { xs: 0.5, sm: 0.75 },
                          px: { xs: 1, sm: 1.5 },
                          '&:hover': {
                            borderColor: '#3083DC',
                            backgroundColor: 'rgba(48, 131, 220, 0.1)',
                          },
                        }}
                      >
                        {lang.viewMembers}
                      </AppButton>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        ) : (
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
        )}
      </Box>

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
          {selectedTeam && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant='body2' sx={{ mb: 1, fontWeight: 600 }}>
                  {lang.manager}:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={selectedTeam.manager.profile_pic || undefined}
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: generateAvatarColor(
                        selectedTeam.manager.name
                      ),
                    }}
                  >
                    {selectedTeam.manager.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant='body1'>
                      {selectedTeam.manager.name}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {selectedTeam.manager.email}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {selectedTeam.members.length > 0 ? (
                <AppTable component={Paper}>
                  <TableHead>
                    <TableRow>
                      <TableCell>{lang.members}</TableCell>
                      <TableCell>{lang.designation}</TableCell>
                      <TableCell>{lang.department}</TableCell>
                      <TableCell>{lang.email}</TableCell>
                      <TableCell>{lang.status}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedTeam.members.map(member => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Avatar
                              src={member.user.profile_pic || undefined}
                              sx={{
                                width: 32,
                                height: 32,
                                backgroundColor: generateAvatarColor(
                                  member.user.name
                                ),
                              }}
                            >
                              {member.user.name.charAt(0)}
                            </Avatar>
                            <Typography variant='body2'>
                              {member.user.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{member.designation.title}</TableCell>
                        <TableCell>{member.department.name}</TableCell>
                        <TableCell>{member.user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={member.status}
                            size='small'
                            color={
                              member.status === 'active' ? 'success' : 'default'
                            }
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </AppTable>
              ) : (
                <Typography variant='body2' color='text.secondary'>
                  No members in this team.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <AppButton
            variantType='secondary'
            variant='outlined'
            text={lang.cancel}
            onClick={() => setShowMemberDialog(false)}
          />
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SystemAdminTenantTeams;
