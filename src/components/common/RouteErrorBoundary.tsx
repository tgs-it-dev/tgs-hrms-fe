import React, { Component, type ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useNavigate } from 'react-router-dom';
import AppButton from './AppButton';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Route Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error }: { error: Error | null }) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        textAlign: 'center',
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
      <Typography variant='h4' gutterBottom>
        Something went wrong
      </Typography>
      <Typography
        variant='body1'
        color='text.secondary'
        sx={{ mb: 3, maxWidth: 500 }}
      >
        {error?.message || 'An unexpected error occurred in this route.'}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <AppButton
          variantType='contained'
          text='Go to Dashboard'
          onClick={() => navigate('/dashboard')}
        />
        <AppButton
          variantType='outlined'
          text='Reload Page'
          onClick={() => window.location.reload()}
        />
      </Box>
    </Box>
  );
}

export default RouteErrorBoundary;
