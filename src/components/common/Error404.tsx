import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AppButton from './AppButton';

const Error404: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        color: 'text.primary',
        textAlign: 'center',
        p: 3,
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 120, color: 'warning.main', mb: 2 }} />
      <Typography variant='h1' sx={{ fontWeight: 700, fontSize: 64, mb: 1 }}>
        404
      </Typography>
      <Typography variant='h5' sx={{ mb: 2 }}>
        Oops! Page Not Found
      </Typography>
      <Typography variant='body1' sx={{ mb: 4, color: 'text.secondary' }}>
        The page you are looking for does not exist or has been moved.
        <br />
        Please check the URL or return to the home page.
      </Typography>
      <AppButton
        variantType='contained'
        text='Go to Home'
        onClick={() => navigate('/')}
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          fontWeight: 600,
          borderRadius: 2,
          px: 4,
          py: 1.5,
          fontSize: 16,
        }}
      />
    </Box>
  );
};

export default Error404;
