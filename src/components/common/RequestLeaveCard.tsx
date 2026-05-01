import React from 'react';
import {
    Box,
    Typography,
    Chip,
    IconButton,
    useTheme,
    Divider,
    CardContent,
} from '@mui/material';
import { EditOutlined, DeleteOutline, Check, Close } from '@mui/icons-material';
import AppButton from './AppButton';
import AppTextField from './AppTextField';
import AppCard from './AppCard';

export interface RequestLeaveCardProps {
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

const RequestLeaveCard: React.FC<RequestLeaveCardProps> = (props) => {
    const {
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
    } = props;

    const theme = useTheme();

    const role = JSON.parse(localStorage.getItem('user') || '{}')?.role?.name?.toLowerCase();

    const statusConfig = {
        pending: {
            label: 'Pending',
            bg: 'var(--status-pending-bg)',
            color: 'var(--status-pending-text)',
        },
        approved: {
            label: 'Approved',
            bg: 'var(--status-approved-bg)',
            color: 'var(--status-approved-text)',
        },
        rejected: {
            label: 'Rejected',
            bg: 'var(--status-rejected-bg)',
            color: 'var(--status-rejected-text)',
        },
    };

    const currentStatus = statusConfig[status] || statusConfig.pending;
    const isPending = status === 'pending';

    return (
        <AppCard
            padding={2.5}
            sx={{
                maxWidth: '100%',
                borderRadius: 'var(--border-radius-2xl)',
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
            }}
        >
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography
                            sx={{
                                fontSize: { xs: '18px', lg: 'var(--subheading2-font-size)' },
                                fontWeight: 600,
                                lineHeight: 'var(--body-line-height)',
                                letterSpacing: 'var(--body-letter-spacing)',
                                color: theme.palette.text.primary,
                            }}
                        >
                            {title}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: 'var(--body-font-size)',
                                color: 'text.secondary',
                                mt: 0.5,
                                lineHeight: 'var(--body-line-height)',
                                letterSpacing: 'var(--body-letter-spacing)',
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
                            fontSize: 'var(--label-font-size)',
                        }}
                    />
                </Box>

                <Divider sx={{ borderColor: theme.palette.divider, opacity: 0.5, my: 1.5 }} />

                {/* Content */}
                <Box display="flex" flexDirection="column" gap={1.5}>
                    <Box display="flex" gap={2}>
                        <Typography
                            sx={{
                                minWidth: '80px',
                                fontWeight: 500,
                                fontSize: 'var(--body-font-size)',
                                color: theme.palette.text.primary,
                            }}
                        >
                            Date:
                        </Typography>
                        <Typography
                            sx={{
                                color: 'text.secondary',
                                fontSize: 'var(--body-font-size)',
                                lineHeight: 'var(--body-line-height)',
                                letterSpacing: 'var(--body-letter-spacing)',
                            }}
                        >
                            {startDate} - {endDate}
                        </Typography>
                    </Box>

                    <Box display="flex" gap={2}>
                        <Typography
                            sx={{
                                minWidth: '80px',
                                fontWeight: 500,
                                fontSize: 'var(--body-font-size)',
                                color: theme.palette.text.primary,
                            }}
                        >
                            Reason:
                        </Typography>
                        <Typography
                            sx={{
                                color: 'text.secondary',
                                flex: 1,
                                fontSize: 'var(--body-font-size)',
                                lineHeight: 'var(--body-line-height)',
                                letterSpacing: 'var(--body-letter-spacing)',
                            }}
                        >
                            {reason}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ borderColor: theme.palette.divider, opacity: 0.5, my: 2 }} />

                {/* Message */}
                {role === 'manager' && isPending ? (
                    <AppTextField
                        placeholder="Add your remarks..."
                        multiline
                        rows={2}
                        fullWidth
                    />
                ) : (
                    <Box
                        sx={{
                            backgroundColor: 'var(--app-table-header-bg)',
                            borderLeft: `4px solid ${theme.palette.primary.main}`,
                            p: '12px 16px',
                            borderRadius: '4px',
                        }}
                    >
                        {managerName && (
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                                <Typography
                                    fontWeight={600}
                                    sx={{
                                        fontSize: 'var(--body-font-size)',
                                        color: theme.palette.text.primary,
                                    }}
                                >
                                    {managerName}:
                                </Typography>
                                {managerMessageDate && (
                                    <Typography
                                        sx={{
                                            fontSize: 'var(--label-font-size)',
                                            color: 'text.secondary',
                                        }}
                                    >
                                        {managerMessageDate}
                                    </Typography>
                                )}
                            </Box>
                        )}

                        <Typography
                            sx={{
                                fontSize: '14px',
                                color: 'text.secondary',
                                fontStyle: managerName ? 'normal' : 'italic',
                                lineHeight: 'var(--body-line-height)',
                                letterSpacing: 'var(--body-letter-spacing)',
                            }}
                        >
                            {message}
                        </Typography>
                    </Box>

                )}

                {role === 'manager' && isPending && (
                    <Box display="flex" gap={3} mt={2}>
                        <AppButton
                            variant="contained"
                            text="Reject"
                            startIcon={<Close />}
                            onClick={onDelete}
                            sx={{
                                flex: 1,
                                backgroundColor: 'var(--status-rejected-bg)',
                                color: 'var(--status-rejected-text)',
                            }}
                        />
                        <AppButton
                            variant="contained"
                            text="Approve"
                            startIcon={<Check />}
                            onClick={onEdit}
                            sx={{
                                flex: 1,
                                backgroundColor: 'var(--status-approved-bg)',
                                color: 'var(--status-approved-text)',
                            }}
                        />
                    </Box>
                )}

                <Divider sx={{ borderColor: theme.palette.divider, opacity: 0.5, my: 2 }} />

                {/* Footer */}
                <Box
                    display="flex"
                    justifyContent={isPending ? 'space-between' : 'center'}
                    alignItems="center"
                >
                    <Typography
                        sx={{
                            fontSize: 'var(--label-font-size)',
                            color: 'text.secondary',
                        }}
                    >
                        Submitted: {submittedDate}
                    </Typography>

                    {role !== 'manager' && isPending && (
                        <Box display="flex" gap={0.5}>
                            <IconButton size="small" onClick={onEdit}>
                                <EditOutlined fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={onDelete}>
                                <DeleteOutline fontSize="small" />
                            </IconButton>
                        </Box>
                    )}
                </Box>
            </CardContent>
        </AppCard>
    );
};

export default RequestLeaveCard;
