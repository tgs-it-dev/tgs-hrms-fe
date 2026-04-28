import { Icons } from '../../assets/icons';
import { Box, Typography } from '@mui/material';

const AuthSidebar: React.FC = () => {
  return (
    <Box
      sx={{
        display: { xs: 'none', lg: 'flex' },
        width: '40%',
        backgroundColor: 'var(--primary-dark-color)',
        justifyContent: 'center',
        alignItems: 'center',
        // minHeight: '100vh',
        // position: 'sticky',
        top: 0,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: { lg: '720px', xl: '800px' },
          pl: { lg: '50px', xl: '100px' },
          pr: { lg: 4, xl: 5 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'start',
          height: '100%',
          minHeight: '100vh',
        }}
      >
        <Box
          component='img'
          src={Icons.logoWhite}
          alt='Logo'
          sx={{
            maxHeight: { lg: 40, xl: 48 },
            width: 'auto',
          }}
        />
        <Box>
          <Box
            sx={{
              alignSelf: 'flex-start',
              flexShrink: 0,
            }}
          ></Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: { lg: '50px', xl: '69px' },
              alignSelf: 'center',
              flex: 1,
              mt: { lg: '80px', xl: '100px' },
              mb: { lg: '80px', xl: '100px' },
            }}
          >
            <Typography
              variant='h1'
              sx={{
                fontSize: { lg: '48px', xl: '56px' },
                fontWeight: 500,
                color: 'var(--white-color)',
                lineHeight: 1.2,
              }}
            >
              Workonnect - Let's Management Better
            </Typography>

            <Box
              component='img'
              src={Icons.authSidebar}
              alt='Illustration'
              sx={{
                width: '100%',
                maxWidth: { lg: '500px', xl: '600px' },
                height: 'auto',
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AuthSidebar;
