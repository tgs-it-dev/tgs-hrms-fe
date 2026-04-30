import React from 'react';
import { Box, Typography, Chip, IconButton, useTheme, Divider } from '@mui/material';
import { EditOutlined, DeleteOutline, Check, Close } from '@mui/icons-material';
import AppButton from './AppButton';
import AppTextField from './AppTextField';

export interface LeaveCardProps {
    title: string;
    type: string;
    status: 'pending' | 'approved' | 'rejected';
    startDate: string;
    endDate: string;
    reason: string;
    submittedDate: string;
    message: string;
    managerName?: string;
    managerMessageDate?: string;
    onEdit?: () => void;
    onDelete?: () => void;
}

const LeaveCard: React.FC<LeaveCardProps> = ({
    title,
    type,
    status,
    startDate,
    endDate,
    reason,
    submittedDate,
    message,
    managerName,
    managerMessageDate,
    onEdit,
    onDelete,
}) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const role = 'manager';

    const statusConfig = {
        pending: {
            label: 'Pending',
            bg: isDark ? 'var(--status-pending-bg)' : 'var(--status-pending-bg)',
            color: 'var(--status-pending-text)',
        },
        approved: {
            label: 'Approved',
            bg: isDark ? 'var(--status-approved-bg)' : 'var(--status-approved-bg)',
            color: 'var(--status-approved-text)',
        },
        rejected: {
            label: 'Rejected',
            bg: isDark ? 'var(--status-rejected-bg)' : 'var(--status-rejected-bg)',
            color: 'var(--status-rejected-text)',
        },
    };

    const currentStatus = statusConfig[status] || statusConfig.pending;
    const isPending = status === 'pending';

    return (
        <Box
            sx={{
                maxWidth: '100%',
                backgroundColor: theme.palette.background.paper,
                borderRadius: 'var(--border-radius-2xl)',
                padding: '20px',
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',

            }}
        >
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography
                        sx={{
                            fontSize: { xs: '18px', sm: '20px' },
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                        }}
                    >
                        {title}
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '16px',
                            color: theme.palette.text.secondary,
                            mt: 0.5,
                        }}
                    >
                        {type}
                    </Typography>
                </Box>
                <Chip
                    label={currentStatus.label}
                    sx={{
                        backgroundColor: currentStatus.bg,
                        color: currentStatus.color,
                        fontWeight: 600,
                        borderRadius: '100px',
                        height: '28px',
                        fontSize: '12px',
                    }}
                />
            </Box>

            <Divider sx={{ borderColor: theme.palette.divider, opacity: 0.5, mb: 1.5 }} />

            {/* Content */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Typography
                        sx={{
                            minWidth: '80px',
                            fontSize: '16px',
                            fontWeight: 500,
                            color: theme.palette.text.primary,
                        }}
                    >
                        Date:
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '16px',
                            color: theme.palette.text.secondary,
                        }}
                    >
                        {startDate} - {endDate}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Typography
                        sx={{
                            minWidth: '80px',
                            fontSize: '16px',
                            fontWeight: 500,
                            color: theme.palette.text.primary,
                        }}
                    >
                        Reason:
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '15px',
                            color: theme.palette.text.secondary,
                            flex: 1,
                            lineHeight: 1.5,
                        }}
                    >
                        {reason}
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ borderColor: theme.palette.divider, opacity: 0.5 }} />

            {/* Message Box */}
            {role === 'manager' && isPending ? (
                <Box sx={{
                    width: '100%',
                }}>
                    <Box >
                        <AppTextField
                            // showLabel={false}
                            placeholder='Add your remarks...'
                            multiline
                            rows={2}
                            sx={{
                                width: `100%`
                            }}
                        />
                    </Box>
                </Box>
            ) : (
                <Box
                    sx={{
                        backgroundColor: isDark ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                        borderLeft: `4px solid ${managerName ? theme.palette.primary.main : (isDark ? theme.palette.divider : 'var(--border-color)')}`,
                        padding: '12px 16px',
                        borderRadius: '4px',
                    }}
                >
                    {managerName && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography sx={{ fontSize: '16px', fontWeight: 600, color: theme.palette.text.primary }}>
                                {managerName}:
                            </Typography>
                            {managerMessageDate && (
                                <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
                                    {managerMessageDate}
                                </Typography>
                            )}
                        </Box>
                    )}
                    <Typography
                        sx={{
                            fontSize: '14px',
                            color: theme.palette.text.secondary,
                            fontStyle: managerName ? 'normal' : 'italic',
                        }}
                    >
                        {message}
                    </Typography>
                </Box>

            )}
            {role === 'manager' && isPending && (
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 3 }}>
                    <AppButton
                        variant='contained'
                        variantType='ghost'
                        text='Reject'
                        startIcon={<Close />}
                        onClick={onDelete}
                        sx={{
                            flex: 1,
                            backgroundColor: 'var(--status-rejected-bg)',
                            color: 'var(--status-rejected-text)',
                            '&:hover': {
                                backgroundColor: 'var(--status-rejected-bg)',
                                color: 'var(--status-rejected-text)'
                            }
                        }}
                    />
                    <AppButton
                        variant='contained'
                        text='Approve'
                        startIcon={<Check />}
                        onClick={onEdit}
                        sx={{
                            flex: 1,
                            backgroundColor: 'var(--status-approved-bg)',
                            color: 'var(--status-approved-text)',
                            '&:hover': {
                                backgroundColor: 'var(--status-approved-bg)',
                                color: 'var(--status-approved-text)'
                            }
                        }}
                    />
                </Box>
            )}

            <Divider sx={{ borderColor: theme.palette.divider, opacity: 0.5 }} />

            {/* Footer */}
            <Box sx={{
                display: 'flex',
                justifyContent: isPending ? 'space-between' : 'center',
                alignItems: 'center',
                mt: 'auto',
            }}>
                <Typography
                    sx={{
                        fontSize: '13px',
                        color: theme.palette.text.secondary,
                        opacity: 0.8,
                    }}
                >
                    Submitted: {submittedDate}
                </Typography>
                {role === 'manager' ? (
                    <>  </>
                ) : <>
                    {isPending && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton size="small" onClick={onEdit} sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.primary.main } }}>
                                <EditOutlined sx={{ fontSize: '18px' }} />
                            </IconButton>
                            <IconButton size="small" onClick={onDelete} sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.error.main } }}>
                                <DeleteOutline sx={{ fontSize: '18px' }} />
                            </IconButton>
                        </Box>
                    )}</>}

            </Box>
        </Box>
    );
};

export default LeaveCard;