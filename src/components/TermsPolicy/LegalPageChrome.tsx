import React from 'react';
import {
  Box,
  Button,
  Container,
  IconButton,
  Link,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Link as RouterLink } from 'react-router-dom';
import BookDemoModal from './BookDemoModal';

export const MarketingHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [bookDemoOpen, setBookDemoOpen] = React.useState(false);

  const openBookDemo = React.useCallback(() => setBookDemoOpen(true), []);
  const closeBookDemo = React.useCallback(() => setBookDemoOpen(false), []);

  const navItemSx = {
    fontSize: '16px',
    fontWeight: 400,
    color: 'var(--dark-grey, #656565)',
    cursor: 'pointer',
    lineHeight: 1,
  } as const;

  const navItemActiveSx = {
    ...navItemSx,
    color: 'var(--Black, #2C2C2C)',
  } as const;

  const outlineBtnSx = {
    border: '2px solid var(--Grey, #BDBDBD)',
    color: 'text.primary',
    borderRadius: '999px',
    fontWeight: 400,
    px: 2,
    py: 1,
    '&:hover': {
      border: '2px solid var(--Grey, #BDBDBD)',
      backgroundColor: 'rgba(17,24,39,0.04)',
    },
  } as const;

  const solidBtnSx = {
    backgroundColor: 'text.primary',
    borderRadius: '999px',
    fontWeight: 700,
    px: 2.2,
    py: 1,
    '&:hover': {
      backgroundColor: '#0b1220',
    },
  } as const;

  return (
    <Box
      component='header'
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid #e5e7eb',
        position: 'relative',
        zIndex: 20,
      }}
    >
      <Container
        maxWidth='lg'
        sx={{
          py: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component='img' src='/logo-sidebar.svg' alt='Logo' />
        </Box>

        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            gap: 3,
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Typography sx={navItemActiveSx}>Product</Typography>
            <ExpandMoreIcon
              sx={{ color: 'var(--Black, #2C2C2C)', fontSize: 18 }}
            />
          </Box>
          <Typography sx={navItemSx}>Features</Typography>
          <Typography sx={navItemSx}>Pricing</Typography>
          <Typography sx={navItemSx}>Customers</Typography>
          <Typography sx={navItemSx}>Blog</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <IconButton
            aria-label='Toggle menu'
            onClick={() => setMobileMenuOpen(prev => !prev)}
            sx={{
              display: { xs: 'inline-flex', md: 'none' },
              color: 'text.primary',
              border: '1px solid #d1d5db',
              borderRadius: '10px',
              width: 36,
              height: 36,
            }}
          >
            <Typography sx={{ fontSize: '18px', lineHeight: 1 }}>
              {mobileMenuOpen ? 'x' : '='}
            </Typography>
          </IconButton>

          <Button
            component={RouterLink}
            to='/'
            variant='outlined'
            sx={{ ...outlineBtnSx, display: { xs: 'none', md: 'inline-flex' } }}
          >
            Login
          </Button>
          <Button
            variant='contained'
            sx={{ ...solidBtnSx, display: { xs: 'none', md: 'inline-flex' } }}
            onClick={openBookDemo}
          >
            Book a Demo
          </Button>
        </Box>
      </Container>

      {mobileMenuOpen && (
        <Box
          sx={{
            display: { xs: 'block', md: 'none' },
            borderTop: '1px solid #e5e7eb',
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            bgcolor: 'background.paper',
            boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
          }}
        >
          <Container
            maxWidth='lg'
            sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Typography sx={navItemSx}>Product</Typography>
              <Typography sx={navItemSx}>Features</Typography>
              <Typography sx={navItemSx}>Pricing</Typography>
              <Typography sx={navItemSx}>Customers</Typography>
              <Typography sx={navItemSx}>Blog</Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, pt: 0.5 }}>
              <Button
                component={RouterLink}
                to='/'
                variant='outlined'
                sx={{ ...outlineBtnSx, flex: 1 }}
              >
                Login
              </Button>
              <Button
                variant='contained'
                sx={{ ...solidBtnSx, flex: 1 }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  openBookDemo();
                }}
              >
                Book a Demo
              </Button>
            </Box>
          </Container>
        </Box>
      )}

      <BookDemoModal open={bookDemoOpen} onClose={closeBookDemo} />
    </Box>
  );
};

export const MarketingFooter: React.FC = () => {
  const footerBg = '#0b3551';
  const headingSx = {
    color: 'common.white',
    fontWeight: 500,
    fontSize: '24px',
    mb: 1.5,
  } as const;
  const linkSx = {
    color: 'var(--light-grey, #EFEFEF)',
    fontWeight: 400,
    fontSize: '16px',
    textDecoration: 'none',
    '&:hover': { color: 'common.white', textDecoration: 'underline' },
  } as const;
  const socialBtnSx = {
    width: '40px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'common.white',
    cursor: 'pointer',
    '& svg': { opacity: 0.9 },
  } as const;

  return (
    <Box
      component='footer'
      sx={{ bgcolor: footerBg, color: 'common.white', mt: 6 }}
    >
      <Container maxWidth='lg' sx={{ py: 5 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            alignItems: 'flex-start',
          }}
        >
          <Box sx={{ minWidth: 260, flex: '1 1 260px' }}>
            <Box
              component='img'
              src='/logo-white.svg'
              alt='Logo'
              sx={{ height: '28px', width: 'auto', mb: 1.2 }}
            />
            <Typography
              sx={{
                color: 'common.white',
                fontWeight: 400,
                fontStyle: 'normal',
                fontSize: '16px',
                lineHeight: '150%',
                letterSpacing: '-0.01em',
                width: '322px',
                maxWidth: '100%',
                height: '72px',
                overflow: 'hidden',
              }}
            >
              We help HR teams replace scattered tools with one secure,
              intelligent platform for today's modern teams at work.
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.2, mt: 2 }}>
              <Box sx={socialBtnSx} aria-label='Instagram'>
                <svg
                  width='26'
                  height='26'
                  viewBox='0 0 29 29'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                  aria-hidden='true'
                >
                  <path
                    d='M21.6667 7H21.68M7.66667 1H21C24.6819 1 27.6667 3.98477 27.6667 7.66667V21C27.6667 24.6819 24.6819 27.6667 21 27.6667H7.66667C3.98477 27.6667 1 24.6819 1 21V7.66667C1 3.98477 3.98477 1 7.66667 1ZM19.6667 13.4933C19.8312 14.603 19.6417 15.7363 19.125 16.732C18.6083 17.7278 17.7909 18.5352 16.7888 19.0396C15.7868 19.5439 14.6513 19.7195 13.5437 19.5412C12.4362 19.363 11.413 18.8401 10.6198 18.0469C9.82656 17.2537 9.30364 16.2305 9.12542 15.123C8.9472 14.0154 9.12275 12.8799 9.6271 11.8778C10.1315 10.8758 10.9389 10.0583 11.9346 9.54166C12.9304 9.02499 14.0637 8.83545 15.1733 9C16.3052 9.16785 17.3531 9.69528 18.1623 10.5044C18.9714 11.3135 19.4988 12.3614 19.6667 13.4933Z'
                    stroke='white'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </Box>
              <Box sx={socialBtnSx} aria-label='LinkedIn'>
                <svg
                  width='26'
                  height='26'
                  viewBox='0 0 26 26'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                  aria-hidden='true'
                >
                  <path
                    d='M24 0H2C1.46957 0 0.960859 0.210714 0.585786 0.585786C0.210714 0.960859 0 1.46957 0 2V24C0 24.5304 0.210714 25.0391 0.585786 25.4142C0.960859 25.7893 1.46957 26 2 26H24C24.5304 26 25.0391 25.7893 25.4142 25.4142C25.7893 25.0391 26 24.5304 26 24V2C26 1.46957 25.7893 0.960859 25.4142 0.585786C25.0391 0.210714 24.5304 0 24 0ZM24 24H2V2H24V24ZM9 11V19C9 19.2652 8.89464 19.5196 8.70711 19.7071C8.51957 19.8946 8.26522 20 8 20C7.73478 20 7.48043 19.8946 7.29289 19.7071C7.10536 19.5196 7 19.2652 7 19V11C7 10.7348 7.10536 10.4804 7.29289 10.2929C7.48043 10.1054 7.73478 10 8 10C8.26522 10 8.51957 10.1054 8.70711 10.2929C8.89464 10.4804 9 10.7348 9 11ZM20 14.5V19C20 19.2652 19.8946 19.5196 19.7071 19.7071C19.5196 19.8946 19.2652 20 19 20C18.7348 20 18.4804 19.8946 18.2929 19.7071C18.1054 19.5196 18 19.2652 18 19V14.5C18 13.837 17.7366 13.2011 17.2678 12.7322C16.7989 12.2634 16.163 12 15.5 12C14.837 12 14.2011 12.2634 13.7322 12.7322C13.2634 13.2011 13 13.837 13 14.5V19C13 19.2652 12.8946 19.5196 12.7071 19.7071C12.5196 19.8946 12.2652 20 12 20C11.7348 20 11.4804 19.8946 11.2929 19.7071C11.1054 19.5196 11 19.2652 11 19V11C11.0012 10.7551 11.0923 10.5191 11.256 10.3369C11.4197 10.1546 11.6446 10.0388 11.888 10.0114C12.1314 9.98392 12.3764 10.0468 12.5765 10.188C12.7767 10.3292 12.918 10.539 12.9738 10.7775C13.6502 10.3186 14.4389 10.0526 15.2552 10.0081C16.0714 9.96368 16.8844 10.1424 17.6067 10.5251C18.329 10.9078 18.9335 11.48 19.3551 12.1803C19.7768 12.8806 19.9997 13.6825 20 14.5ZM9.5 7.5C9.5 7.79667 9.41203 8.08668 9.2472 8.33335C9.08238 8.58003 8.84811 8.77229 8.57403 8.88582C8.29994 8.99935 7.99834 9.02906 7.70736 8.97118C7.41639 8.9133 7.14912 8.77044 6.93934 8.56066C6.72956 8.35088 6.5867 8.08361 6.52882 7.79264C6.47094 7.50166 6.50065 7.20006 6.61418 6.92597C6.72771 6.65189 6.91997 6.41762 7.16665 6.2528C7.41332 6.08797 7.70333 6 8 6C8.39782 6 8.77936 6.15804 9.06066 6.43934C9.34196 6.72064 9.5 7.10218 9.5 7.5Z'
                    fill='white'
                  />
                </svg>
              </Box>
              <Box sx={socialBtnSx} aria-label='Facebook'>
                <svg
                  width='26'
                  height='26'
                  viewBox='0 0 26 26'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                  aria-hidden='true'
                >
                  <path
                    d='M13 0C10.4288 0 7.91543 0.762437 5.77759 2.1909C3.63975 3.61935 1.97351 5.64968 0.989572 8.02512C0.0056327 10.4006 -0.251811 13.0144 0.249797 15.5362C0.751405 18.0579 1.98953 20.3743 3.80762 22.1924C5.6257 24.0105 7.94208 25.2486 10.4638 25.7502C12.9856 26.2518 15.5995 25.9944 17.9749 25.0104C20.3503 24.0265 22.3807 22.3603 23.8091 20.2224C25.2376 18.0846 26 15.5712 26 13C25.9964 9.5533 24.6256 6.24882 22.1884 3.81163C19.7512 1.37445 16.4467 0.00363977 13 0ZM14 23.9538V16H17C17.2652 16 17.5196 15.8946 17.7071 15.7071C17.8946 15.5196 18 15.2652 18 15C18 14.7348 17.8946 14.4804 17.7071 14.2929C17.5196 14.1054 17.2652 14 17 14H14V11C14 10.4696 14.2107 9.96086 14.5858 9.58579C14.9609 9.21071 15.4696 9 16 9H18C18.2652 9 18.5196 8.89464 18.7071 8.70711C18.8946 8.51957 19 8.26522 19 8C19 7.73478 18.8946 7.48043 18.7071 7.29289C18.5196 7.10536 18.2652 7 18 7H16C14.9391 7 13.9217 7.42143 13.1716 8.17157C12.4214 8.92172 12 9.93913 12 11V14H9.00001C8.73479 14 8.48044 14.1054 8.2929 14.2929C8.10536 14.4804 8.00001 14.7348 8.00001 15C8.00001 15.2652 8.10536 15.5196 8.2929 15.7071C8.48044 15.8946 8.73479 16 9.00001 16H12V23.9538C9.181 23.6964 6.56971 22.3622 4.7093 20.2287C2.8489 18.0952 1.8826 15.3266 2.0114 12.4988C2.1402 9.67098 3.35419 7.00169 5.40085 5.04613C7.44751 3.09057 10.1693 1.9993 13 1.9993C15.8307 1.9993 18.5525 3.09057 20.5992 5.04613C22.6458 7.00169 23.8598 9.67098 23.9886 12.4988C24.1174 15.3266 23.1511 18.0952 21.2907 20.2287C19.4303 22.3622 16.819 23.6964 14 23.9538Z'
                    fill='white'
                  />
                </svg>
              </Box>
              <Box sx={socialBtnSx} aria-label='Twitter/X'>
                <svg
                  width='22'
                  height='25'
                  viewBox='0 0 22 25'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                  aria-hidden='true'
                >
                  <path
                    d='M21.8518 22.4638L14.0268 10.1663L21.7481 1.6725C21.9227 1.47565 22.0127 1.21791 21.9986 0.955153C21.9844 0.692393 21.8673 0.445794 21.6726 0.26882C21.4778 0.0918457 21.2212 -0.0012398 20.9583 0.00974476C20.6953 0.0207293 20.4474 0.134898 20.2681 0.3275L12.9131 8.4175L7.85181 0.46375C7.76156 0.321693 7.63692 0.204713 7.48943 0.123647C7.34193 0.0425814 7.17637 5.21628e-05 7.00806 1.18294e-07H1.00806C0.828765 -8.70794e-05 0.652741 0.0480342 0.498423 0.139325C0.344105 0.230615 0.217171 0.361717 0.13091 0.518902C0.0446503 0.676088 0.00223821 0.853574 0.00811486 1.03278C0.0139915 1.21198 0.0679408 1.3863 0.164314 1.5375L7.98931 13.8337L0.268064 22.3337C0.177897 22.4306 0.107851 22.5444 0.061986 22.6685C0.0161206 22.7927 -0.00465234 22.9247 0.000871701 23.0569C0.00639575 23.1891 0.038107 23.3189 0.0941668 23.4388C0.150227 23.5586 0.22952 23.6662 0.327452 23.7552C0.425384 23.8442 0.540006 23.9129 0.664675 23.9572C0.789345 24.0016 0.921581 24.0208 1.05372 24.0137C1.18586 24.0066 1.31528 23.9733 1.43446 23.9158C1.55365 23.8583 1.66025 23.7777 1.74806 23.6787L9.10307 15.5888L14.1643 23.5425C14.2553 23.6834 14.3803 23.7991 14.5277 23.8791C14.6752 23.959 14.8403 24.0006 15.0081 24H21.0081C21.1872 23.9999 21.363 23.9518 21.5171 23.8606C21.6712 23.7693 21.798 23.6384 21.8843 23.4814C21.9705 23.3244 22.013 23.1472 22.0072 22.9681C22.0015 22.7891 21.9479 22.6149 21.8518 22.4638ZM15.5568 22L2.82931 2H6.45431L19.1868 22H15.5568Z'
                    fill='white'
                  />
                </svg>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Box sx={{ minWidth: 140 }}>
              <Typography sx={headingSx}>Product</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link href='#' onClick={e => e.preventDefault()} sx={linkSx}>
                  Features
                </Link>
                <Link href='#' onClick={e => e.preventDefault()} sx={linkSx}>
                  Pricing
                </Link>
                <Link href='#' onClick={e => e.preventDefault()} sx={linkSx}>
                  Security
                </Link>
              </Box>
            </Box>
            <Box sx={{ minWidth: 140 }}>
              <Typography sx={headingSx}>Company</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link href='#' onClick={e => e.preventDefault()} sx={linkSx}>
                  About Us
                </Link>
                <Link href='#' onClick={e => e.preventDefault()} sx={linkSx}>
                  Careers
                </Link>
                <Link href='#' onClick={e => e.preventDefault()} sx={linkSx}>
                  Contact
                </Link>
                <Link href='#' onClick={e => e.preventDefault()} sx={linkSx}>
                  Customers
                </Link>
              </Box>
            </Box>
            <Box sx={{ minWidth: 140 }}>
              <Typography sx={headingSx}>Resources</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link href='#' onClick={e => e.preventDefault()} sx={linkSx}>
                  Help Center
                </Link>
                <Link href='#' onClick={e => e.preventDefault()} sx={linkSx}>
                  Blog
                </Link>
                <Link href='#' onClick={e => e.preventDefault()} sx={linkSx}>
                  Docs
                </Link>
                <Link href='#' onClick={e => e.preventDefault()} sx={linkSx}>
                  API
                </Link>
              </Box>
            </Box>
            <Box sx={{ minWidth: 140 }}>
              <Typography sx={headingSx}>Legal</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link component={RouterLink} to='/privacy-policy' sx={linkSx}>
                  Privacy
                </Link>
                <Link component={RouterLink} to='/terms' sx={linkSx}>
                  Terms
                </Link>
                <Link href='#' onClick={e => e.preventDefault()} sx={linkSx}>
                  Cookies
                </Link>
                <Link href='#' onClick={e => e.preventDefault()} sx={linkSx}>
                  GDPR
                </Link>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{ mt: 4, pt: 3, borderTop: '0.5px solid rgba(255,255,255,0.3)' }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <Typography
              sx={{ color: 'rgba(255,255,255,0.72)', fontSize: '12px' }}
            >
              ©2025 Workonnect.ai. All rights reserved.
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <Link component={RouterLink} to='/privacy-policy' sx={linkSx}>
                Privacy
              </Link>
              <Typography
                sx={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1 }}
              >
                •
              </Typography>
              <Link component={RouterLink} to='/terms' sx={linkSx}>
                Terms
              </Link>
              <Typography
                sx={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1 }}
              >
                •
              </Typography>
              <Link href='#' onClick={e => e.preventDefault()} sx={linkSx}>
                Cookies
              </Link>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
