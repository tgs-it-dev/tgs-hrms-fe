import React from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import CategoryIcon from '@mui/icons-material/Category';
import LoopIcon from '@mui/icons-material/Loop';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import LinearScaleIcon from '@mui/icons-material/LinearScale';
import { Close } from '@mui/icons-material';
import type { EmployeePerformance } from '../../api/systemEmployeeApi';

interface KpiDetailCardProps {
  open: boolean;
  onClose: () => void;
  kpiData: EmployeePerformance | null;
}

const KpiDetailCard: React.FC<KpiDetailCardProps> = ({
  open,
  onClose,
  kpiData,
}) => {
  if (!kpiData) return null;

  const achievedPercent =
    kpiData.targetValue && kpiData.achievedValue
      ? Math.min((kpiData.achievedValue / kpiData.targetValue) * 100, 100)
      : 0;

  const stars = Math.round(kpiData.score || 0);

  const progressColor =
    achievedPercent >= 90
      ? '#4CAF50'
      : achievedPercent >= 60
        ? '#FFB300'
        : '#E53935';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
        }}
      >
        <Box display='flex' alignItems='center' gap={1}>
          <Typography variant='h6' fontWeight={600}>
            {kpiData.kpi?.title || 'KPI Details'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size='small'>
          <Close />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          pt: 3,
          pb: 2,
          px: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography variant='body2' color='text.secondary'>
          {kpiData.kpi?.description || 'No description available'}
        </Typography>

        <Divider />

        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          flexWrap='wrap'
          gap={3}
        >
          <Box textAlign='center' flex={1}>
            <CircularProgress
              variant='determinate'
              value={achievedPercent}
              size={90}
              thickness={5}
              sx={{
                color: progressColor,
                animation: 'progress 1s ease-in-out',
              }}
            />
            <Typography
              variant='h6'
              fontWeight={600}
              mt={1}
              color={progressColor}
            >
              {achievedPercent.toFixed(0)}%
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              Completion
            </Typography>
          </Box>

          <Box flex={2} display='flex' flexDirection='column' gap={1}>
            <Box display='flex' alignItems='center' gap={1}>
              <LinearScaleIcon color='warning' />
              <Typography variant='body2'>
                <strong>Target:</strong> {kpiData.targetValue ?? '—'}
              </Typography>
            </Box>
            <Box display='flex' alignItems='center' gap={1}>
              <TaskAltIcon color='success' />
              <Typography variant='body2'>
                <strong>Achieved:</strong> {kpiData.achievedValue ?? '—'}
              </Typography>
            </Box>
            <Box display='flex' alignItems='center' gap={1}>
              <LoopIcon color='primary' />
              <Typography variant='body2'>
                <strong>Review Cycle:</strong> {kpiData.reviewCycle || '—'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box display='flex' alignItems='center' gap={0.5}>
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon
              key={i}
              fontSize='small'
              sx={{
                color: i < stars ? '#FFC107' : '#E0E0E0',
                transition: 'color 0.3s',
              }}
            />
          ))}
          <Typography variant='body2' ml={1} color='text.secondary'>
            {kpiData.score?.toFixed(2) ?? '—'} / 5
          </Typography>
        </Box>

        <Box
          display='flex'
          flexWrap='wrap'
          gap={1}
          justifyContent='flex-start'
          mt={1}
        >
          <Chip
            icon={<CategoryIcon />}
            label={kpiData.kpi?.category || 'Uncategorized'}
            variant='outlined'
            color='warning'
          />
          <Chip
            label={`Status: ${kpiData.kpi?.status || '—'}`}
            variant='outlined'
            color='success'
          />
          <Chip
            label={`Weight: ${kpiData.kpi?.weight ?? '—'}`}
            variant='outlined'
            color='default'
          />
        </Box>

        {kpiData.remarks && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              backgroundColor: 'rgba(255, 183, 77, 0.08)',
              font: 'bold',
            }}
          >
            <Typography variant='subtitle2' gutterBottom>
              <strong>Reviewer Remarks</strong>
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {kpiData.remarks}
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default KpiDetailCard;
