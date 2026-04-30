import React from 'react';
import {
  Box,
  Divider,
  Link,
  List,
  ListItemButton,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AppCard from '../common/AppCard';
import AppPageTitle from '../common/AppPageTitle';
import { MarketingFooter, MarketingHeader } from './LegalPageChrome';

type TocItem = { id: string; label: string };

const tocItems: TocItem[] = [
  { id: 'terms-1', label: '1. Description of Services' },
  { id: 'terms-2', label: '2. Eligibility' },
  { id: 'terms-3', label: '3. User Accounts' },
  { id: 'terms-4', label: '4. Organizational Accounts' },
  { id: 'terms-5', label: '5. Acceptable Use' },
  { id: 'terms-6', label: '6. Data and Privacy' },
  { id: 'terms-7', label: '7. Third-Party Integrations' },
  { id: 'terms-8', label: '8. Subscription and Payments' },
  { id: 'terms-9', label: '9. Free Trials' },
  { id: 'terms-10', label: '10. Intellectual Property' },
  { id: 'terms-11', label: '11. Data Security' },
  { id: 'terms-12', label: '12. Termination' },
  { id: 'terms-13', label: '13. Customer Data Ownership' },
  { id: 'terms-14', label: '14. Indemnification' },
  { id: 'terms-15', label: '15. Confidentiality' },
  { id: 'terms-16', label: '16. Force Majeure' },
  { id: 'terms-17', label: '17. Service Modifications' },
  { id: 'terms-18', label: '18. Data Portability' },
  { id: 'terms-19', label: '19. Disclaimer of Warranties' },
  { id: 'terms-20', label: '20. Limitation of Liability' },
  { id: 'terms-21', label: '21. Changes to Terms' },
  { id: 'terms-22', label: '22. Governing Law' },
  { id: 'terms-23', label: '23. Contact Information' },
];

const TermsOfServicePage: React.FC = () => {
  const theme = useTheme();
  const textColor = theme.palette.text.primary;
  const subTextColor = theme.palette.text.secondary;

  const pageWrapperSx = { py: 2 } as const;
  const containerSx = {
    maxWidth: 1153,
    mx: 'auto',
    px: { xs: 2, sm: 2 },
  } as const;
  const titleSx = {
    color: theme.palette.text.secondary,
    mb: 0,
  } as const;
  const cardSx = {
    py: { xs: 2, sm: 3, lg: 4 },
    px: 0,
    borderRadius: 0,
    border: 'none',
    backgroundColor: theme.palette.background.paper,
  } as const;
  const sectionTitleSx = {
    fontWeight: 700,
    mt: 2.2,
    mb: 0.75,
    fontSize: { xs: '14px', sm: '15px' },
    color: textColor,
    scrollMarginTop: { xs: '86px', md: '108px' },
  } as const;
  const paragraphSx = {
    mb: 1.25,
    fontSize: { xs: '13px', sm: '14px' },
    lineHeight: 1.7,
    color: textColor,
  } as const;
  const bulletListSx = {
    pl: 3,
    mt: 0.5,
    mb: 1.5,
    '& li': {
      mb: 0.75,
      fontSize: { xs: '13px', sm: '14px' },
      lineHeight: 1.7,
      color: textColor,
    },
  } as const;
  const lastUpdatedSx = {
    mb: 2,
    color: subTextColor,
    fontWeight: 400,
    fontSize: '14px',
  } as const;
  const contactLabelSx = {
    fontWeight: 700,
    mb: 0.75,
    fontSize: { xs: '13px', sm: '14px' },
    color: textColor,
  } as const;
  const contactRowSx = {
    fontSize: { xs: '13px', sm: '14px' },
    color: textColor,
  } as const;
  const linkSx = {
    color: theme.palette.primary.main,
    fontWeight: 500,
  } as const;

  const [activeTocId, setActiveTocId] = React.useState<string>(tocItems[0].id);

  const handleTocClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;

    setActiveTocId(id);
    window.history.replaceState(null, '', `#${id}`);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  React.useEffect(() => {
    const elements = tocItems
      .map(item => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort(
            (a, b) =>
              (a.boundingClientRect.top ?? 0) - (b.boundingClientRect.top ?? 0)
          )[0];

        if (visible?.target instanceof HTMLElement) {
          setActiveTocId(visible.target.id);
        }
      },
      // Favor the "current" heading as user scrolls down.
      { rootMargin: '-15% 0px -70% 0px', threshold: [0, 0.2, 1] }
    );

    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const SectionTitle = ({
    id,
    children,
  }: {
    id: string;
    children: React.ReactNode;
  }) => (
    <Typography id={id} component='h2' sx={sectionTitleSx}>
      {children}
    </Typography>
  );

  const Paragraph = ({ children }: { children: React.ReactNode }) => (
    <Typography sx={paragraphSx}>{children}</Typography>
  );

  const BulletList = ({ items }: { items: string[] }) => (
    <Box component='ul' sx={bulletListSx}>
      {items.map(item => (
        <Box key={item} component='li'>
          {item}
        </Box>
      ))}
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      <MarketingHeader />

      <Box component='main' sx={{ flex: 1, ...pageWrapperSx }}>
        <Box sx={containerSx}>
          <Typography variant='subtitle2' sx={lastUpdatedSx}>
            Last Updated: March 2026
          </Typography>

          <AppPageTitle sx={titleSx}>Terms of Service</AppPageTitle>

          <AppCard sx={cardSx}>
            <Paragraph>
              These Terms of Service (&quot;Terms&quot;) govern your access to
              and use of{' '}
              <Box
                component='span'
                sx={{ fontWeight: 700, color: 'primary.main' }}
              >
                Workonnect.ai
              </Box>
              , including our website, applications, and Human Resource
              Management System (HRMS) platform (collectively, the
              &quot;Services&quot;).
            </Paragraph>
            <Paragraph>
              By accessing or using Workonnect.ai, you agree to be bound by
              these Terms. If you do not agree to these Terms, you should not
              use the Services.
            </Paragraph>

            <Divider
              sx={{
                my: 2.5,
                borderTop: '0.5px solid var(--Grey, #BDBDBD)',
              }}
            />

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: { xs: 2, md: 3 },
              }}
            >
              <Box sx={{ flexBasis: { md: '260px' }, flexShrink: 0 }}>
                <Box
                  component='nav'
                  aria-label='Table of contents'
                  sx={{
                    position: { xs: 'static', md: 'sticky' },
                    top: { md: '96px' },
                    pr: { md: 2 },
                  }}
                >
                  <Typography
                    sx={{
                      mb: 1,
                      fontWeight: 700,
                      fontSize: { xs: '13px', sm: '14px' },
                      color: 'text.primary',
                    }}
                  >
                    Table of contents
                  </Typography>

                  <List
                    sx={{
                      p: 0,
                      display: 'flex',
                      flexDirection: { xs: 'row', md: 'column' },
                      flexWrap: 'nowrap',
                      gap: { xs: 1, md: 0 },
                      overflowX: { xs: 'auto', md: 'visible' },
                      overflowY: 'hidden',
                      whiteSpace: { xs: 'nowrap', md: 'normal' },
                      pb: { xs: 0.5, md: 0 },
                      maxHeight: 'none',
                      '&::-webkit-scrollbar': {
                        height: 6,
                      },
                    }}
                  >
                    {tocItems.map(item => {
                      const isActive = item.id === activeTocId;
                      return (
                        <ListItemButton
                          key={item.id}
                          component='a'
                          href={`#${item.id}`}
                          onClick={handleTocClick(item.id)}
                          sx={{
                            alignItems: 'flex-start',
                            py: 0.65,
                            pl: 0,
                            pr: 0,
                            borderRadius: '10px',
                            width: { xs: 'auto', md: '100%' },
                            flex: '0 0 auto',
                            backgroundColor: isActive
                              ? alpha(theme.palette.primary.main, 0.05)
                              : 'transparent',
                            '&:hover': {
                              backgroundColor: isActive
                                ? alpha(theme.palette.primary.main, 0.05)
                                : alpha(theme.palette.primary.main, 0.05),
                            },
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: { xs: '13px', sm: '14px' },
                              lineHeight: 1.4,
                              whiteSpace: 'nowrap',
                              padding: '12px',
                              color: isActive ? 'primary.dark' : subTextColor,
                              fontWeight: isActive ? 400 : 400,
                            }}
                          >
                            {item.label}
                          </Typography>
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Box>
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <SectionTitle id='terms-1'>
                  1. Description of Services
                </SectionTitle>
                <Paragraph>
                  Workonnect.ai provides a cloud-based Human Resource Management
                  System (HRMS) designed to help organizations manage employee
                  data, HR workflows, payroll processes, attendance, leave
                  management, recruitment, and team collaboration.
                </Paragraph>
                <Paragraph>
                  Our Services may include web applications, mobile
                  applications, APIs, and integrations with third-party
                  services.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-2'>2. Eligibility</SectionTitle>
                <Paragraph>
                  You must be at least 18 years old and capable of forming a
                  legally binding agreement to use the Services.
                </Paragraph>
                <Paragraph>
                  If you are using Workonnect.ai on behalf of an organization,
                  you represent that you have the authority to bind that
                  organization to these Terms.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-3'>3. User Accounts</SectionTitle>
                <Paragraph>
                  To access certain features, users must create an account.
                </Paragraph>
                <Paragraph>You agree to:</Paragraph>
                <BulletList
                  items={[
                    'Provide accurate and complete registration information',
                    'Maintain the confidentiality of your login credentials',
                    'Notify us immediately of any unauthorized access to your account',
                  ]}
                />
                <Paragraph>
                  You are responsible for all activities that occur under your
                  account.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-4'>
                  4. Organizational Accounts
                </SectionTitle>
                <Paragraph>
                  Organizations may create accounts to manage their employees
                  within Workonnect.ai.
                </Paragraph>
                <Paragraph>The organization is responsible for:</Paragraph>
                <BulletList
                  items={[
                    'Managing employee access',
                    'Ensuring employee data accuracy',
                    'Compliance with applicable labor and privacy laws',
                  ]}
                />
                <Paragraph>
                  Workonnect.ai acts as a{' '}
                  <Box component='span' sx={{ fontWeight: 700 }}>
                    service provider for managing HR operations
                  </Box>
                  , and organizations remain responsible for their internal HR
                  decisions.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-5'>5. Acceptable Use</SectionTitle>
                <Paragraph>You agree not to use Workonnect.ai to:</Paragraph>
                <BulletList
                  items={[
                    'Violate any local, national, or international laws',
                    'Upload harmful code, malware, or viruses',
                    'Attempt to gain unauthorized access to the platform',
                    'Reverse engineer or copy the platform',
                    'Use the platform to harass or harm other users',
                    'Store or transmit illegal or abusive content',
                  ]}
                />
                <Paragraph>
                  We reserve the right to suspend accounts that violate these
                  Terms.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-6'>6. Data and Privacy</SectionTitle>
                <Paragraph>
                  Workonnect.ai processes employee and organizational data in
                  accordance with our{' '}
                  <Box component='span' sx={{ fontWeight: 700 }}>
                    Privacy Policy
                  </Box>
                  .
                </Paragraph>
                <Paragraph>
                  Organizations using Workonnect.ai are responsible for ensuring
                  they have the legal right to upload and manage employee data
                  within the platform.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-7'>
                  7. Third-Party Integrations
                </SectionTitle>
                <Paragraph>
                  Workonnect.ai may integrate with third-party services such as
                  communication tools, payroll services, analytics platforms, or
                  productivity tools.
                </Paragraph>
                <Paragraph>
                  Use of third-party integrations may be subject to their
                  respective Terms and privacy policies.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-8'>
                  8. Subscription and Payments
                </SectionTitle>
                <Paragraph>
                  Certain Workonnect.ai services may require a{' '}
                  <Box component='span' sx={{ fontWeight: 700 }}>
                    paid subscription
                  </Box>
                  . Subscription Terms may include:
                </Paragraph>
                <BulletList
                  items={[
                    'Monthly or annual billing cycles',
                    'Automatic renewal unless cancelled',
                    'Payment through approved payment methods',
                    'All fees are non-refundable unless otherwise stated',
                  ]}
                />

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-9'>9. Free Trials</SectionTitle>
                <Paragraph>
                  Workonnect.ai may offer free trials or beta features. Trial
                  services may have limitations and may be modified or
                  discontinued at any time without notice.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-10'>
                  10. Intellectual Property
                </SectionTitle>
                <Paragraph>
                  All rights, title, and interest in the Workonnect.ai platform,
                  including software, branding, and content, remain the
                  exclusive property of Workonnect.ai.
                </Paragraph>
                <Paragraph>
                  Users are granted a limited, non-exclusive license to access
                  and use the Services for internal business purposes.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-11'>11. Data Security</SectionTitle>
                <Paragraph>
                  We implement security measures to protect user data; however,
                  no online system can guarantee complete security.
                </Paragraph>
                <Paragraph>
                  Organizations are responsible for maintaining proper access
                  control for their employees.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-12'>12. Termination</SectionTitle>
                <Paragraph>
                  We may suspend or terminate access to the Services if:
                </Paragraph>
                <BulletList
                  items={[
                    'You violate these Terms',
                    'There is suspected misuse or illegal activity',
                    'Required by law or regulatory authorities',
                  ]}
                />
                <Paragraph>
                  Users may terminate their account at any time.
                </Paragraph>
                <Paragraph>
                  Upon termination, access to the platform and stored data may
                  be removed after a reasonable retention period.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-13'>
                  13. Customer Data Ownership
                </SectionTitle>
                <Paragraph>
                  All data submitted to Workonnect.ai by customers, including
                  employee and organizational data, remains the sole property of
                  the customer. Workonnect.ai processes such data only for the
                  purpose of providing the services. We do not claim ownership
                  or rights over customer data to ensure credibility and data
                  privacy.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-14'>14. Indemnification</SectionTitle>
                <Paragraph>
                  You agree to indemnify, defend, and hold harmless
                  Workonnect.ai, its affiliates, and employees from any claims,
                  damages, liabilities, and expenses arising from your use of
                  the services, violation of these Terms, or infringement of any
                  rights of a third party.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-15'>15. Confidentiality</SectionTitle>
                <Paragraph>
                  All involved parties agree to maintain the confidentiality of
                  any non-public, proprietary, or sensitive information
                  disclosed in connection with the services. Such information is
                  used solely for the purpose of fulfilling obligations under
                  these Terms.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-16'>16. Force Majeure</SectionTitle>
                <Paragraph>
                  Workonnect.ai shall not be liable for any delay or failure to
                  perform due to events beyond its reasonable control, including
                  but not limited to natural disasters, internet outages, cyber
                  incidents, or governmental actions.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-17'>
                  17. Service Modifications
                </SectionTitle>
                <Paragraph>
                  Workonnect.ai reserves the right to modify, suspend, or
                  discontinue any part of the services at any time, with or
                  without notice.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-18'>18. Data Portability</SectionTitle>
                <Paragraph>
                  Customers may request access to or export of their data in a
                  commonly used format, subject to technical feasibility and
                  applicable legal requirements.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-19'>
                  19. Disclaimer of Warranties
                </SectionTitle>
                <Paragraph>
                  Workonnect.ai provides the Services &quot;as is&quot; and
                  &quot;as available.&quot; We do not guarantee that the
                  Services will be uninterrupted, error-free, or completely
                  secure.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-20'>
                  20. Limitation of Liability
                </SectionTitle>
                <Paragraph>
                  To the fullest extent permitted by law, Workonnect.ai shall
                  not be liable for any indirect, incidental, or consequential
                  damages arising from the use of the Services.
                </Paragraph>
                <Paragraph>
                  Our total liability shall not exceed the amount paid by the
                  customer for the Services in the preceding 12 months.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-21'>21. Changes to Terms</SectionTitle>
                <Paragraph>
                  We may update these Terms from time to time.
                </Paragraph>
                <Paragraph>
                  If significant changes are made, we will notify users through
                  the platform or email. Continued use of the Services after
                  updates indicates acceptance of the revised Terms.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-22'>22. Governing Law</SectionTitle>
                <Paragraph>
                  These Terms shall be governed by and interpreted in accordance
                  with the laws of the United States, unless otherwise required
                  by applicable law.
                </Paragraph>

                <Divider
                  sx={{ my: 0, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }}
                />

                <SectionTitle id='terms-23'>
                  23. Contact Information
                </SectionTitle>
                <Paragraph>
                  If you have questions about these Terms, please contact:
                </Paragraph>
                <Typography sx={contactLabelSx}>Workonnect.ai</Typography>
                <Typography sx={{ ...contactRowSx, mb: 0.5 }}>
                  Email:{' '}
                  <Link href='mailto:support@workonnect.com' sx={linkSx}>
                    support@workonnect.com
                  </Link>
                </Typography>
                <Typography sx={{ ...contactRowSx, mb: 1.25 }}>
                  Website:{' '}
                  <Link
                    href='http://app.workonnect.ai'
                    target='_blank'
                    rel='noreferrer'
                    sx={linkSx}
                  >
                    www.workonnect.ai
                  </Link>
                </Typography>
                <Paragraph>
                  We are committed to providing secure and reliable HR
                  technology for organizations and their teams.
                </Paragraph>
              </Box>
            </Box>
          </AppCard>
        </Box>
      </Box>

      <MarketingFooter />
    </Box>
  );
};

export default TermsOfServicePage;
