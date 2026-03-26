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
import AppCard from '../common/AppCard';
import AppPageTitle from '../common/AppPageTitle';
import { MarketingFooter, MarketingHeader } from './LegalPageChrome';
import { useIsDarkMode } from '../../theme';

type TocItem = { id: string; label: string };

const tocItems: TocItem[] = [
  { id: 'privacy-1', label: '1. Information We Collect' },
  { id: 'privacy-2', label: '2. How We Use Information' },
  { id: 'privacy-3', label: '3. Legal Basis for Processing' },
  { id: 'privacy-4', label: '4. Data Security' },
  { id: 'privacy-5', label: '5. Data Sharing and Disclosure' },
  { id: 'privacy-6', label: '6. Data Retention' },
  { id: 'privacy-7', label: '7. User Rights' },
  { id: 'privacy-8', label: '8. International Data Transfers' },
  { id: 'privacy-9', label: '9. Data Privacy Framework' },
  { id: 'privacy-10', label: '10. Children’s Privacy' },
  { id: 'privacy-11', label: '11. Automated Decision-Making and Profiling' },
  { id: 'privacy-12', label: '12. Data Breach Response and Notification' },
  { id: 'privacy-13', label: '13. Third-Party Services' },
  { id: 'privacy-14', label: '14. Changes to This Privacy Policy' },
  { id: 'privacy-15', label: '15. Contact Us' },
];

const PrivacyPolicyPage: React.FC = () => {
  const theme = useTheme();
  const darkMode = useIsDarkMode();
  const textColor = darkMode ? '#f2f2f2' : '#222';
  const subTextColor = darkMode ? 'rgba(255,255,255,0.72)' : '#888888';

  const pageWrapperSx = { py: 2 } as const;
  const containerSx = {
    maxWidth: 1153,
    mx: 'auto',
    px: { xs: 2, sm: 2 },
  } as const;
  const titleSx = {
    mb: 0,
    color: darkMode ? '#8f8f8f' : 'text.primary',
    pl: { xs: 0, sm: 0 },
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
    pl: { xs: 0, sm: 0 },
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
    color: 'var(--primary-dark-color)',
    fontWeight: 500,
  } as const;

  const [activeTocId, setActiveTocId] = React.useState<string>(tocItems[0].id);

  const handleTocClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTocId(id);
    const el = document.getElementById(id);
    if (!el) return;
    window.history.replaceState(null, '', `#${id}`);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const SectionTitle = ({
    id,
    children,
  }: {
    id?: string;
    children: React.ReactNode;
  }) => (
    <Typography id={id} sx={sectionTitleSx}>
      {children}
    </Typography>
  );

  const Paragraph = ({ children }: { children: React.ReactNode }) => (
    <Typography sx={paragraphSx}>
      {children}
    </Typography>
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
        bgcolor: '#ffffff',
      }}
    >
      <MarketingHeader />

      <Box component='main' sx={{ flex: 1, ...pageWrapperSx }}>
      <Box sx={containerSx}>
      <Typography
          variant='subtitle2'
          sx={lastUpdatedSx}
        >
          Last Updated: March 2026
        </Typography>
        <AppPageTitle sx={titleSx}>
          Privacy Policy
        </AppPageTitle>

        <AppCard sx={cardSx}>
        <Paragraph>
          Welcome to{' '}
          <Box component='span' sx={{ fontWeight: 700 }}>
            Workonnect.ai
          </Box>
          . Your privacy is important to us. This Privacy Policy explains how Workonnect.ai
          collects, uses, stores, and protects personal and organizational information when
          you use our Human Resource Management System (HRMS) platform, website, and
          related services.
        </Paragraph>
        <Paragraph>
          By accessing or using Workonnect.ai, you agree to the collection and
          use of information in accordance with this Privacy Policy.
        </Paragraph>

        <Divider sx={{ my: 2.5, borderTop: '0.5px solid var(--Grey, #BDBDBD)' }} />

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
                  color: '#2C2C2C',
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
                        backgroundColor: isActive ? '#2680D90D' : 'transparent',
                        '&:hover': {
                          backgroundColor: '#2680D90D',
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: { xs: '13px', sm: '14px' },
                          lineHeight: 1.4,
                          whiteSpace: 'nowrap',
                          padding: '12px',
                          color: isActive ? '#0059B2' : subTextColor,
                          fontWeight: 400,
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
        <SectionTitle id='privacy-1'>1. Information We Collect</SectionTitle>
        <Paragraph>Workonnect.ai may collect the following types of information:</Paragraph>

        <SectionTitle>a. Personal Information</SectionTitle>
        <Paragraph>
          When organizations use our HRMS platform, we may collect employee-related information, including:
        </Paragraph>
        <BulletList
          items={[
            'Full name',
            'Email address',
            'Phone number',
            'Job title and department',
            'Employment details',
            'Attendance and leave records',
            'Payroll-related information',
            'Profile images (if uploaded)',
          ]}
        />

        <SectionTitle>b. Organization Information</SectionTitle>
        <Paragraph>When companies register with Workonnect.ai, we may collect:</Paragraph>
        <BulletList
          items={[
            'Company name',
            'Business contact details',
            'Organization structure',
            'Employee records managed within the platform',
          ]}
        />

        <SectionTitle>c. Usage Information</SectionTitle>
        <Paragraph>
          We may automatically collect certain technical information when users interact with our website or platform:
        </Paragraph>
        <BulletList
          items={[
            'IP address',
            'Browser type and version',
            'Device information',
            'Pages visited and activity logs',
            'Date and time of access',
          ]}
        />

        <SectionTitle>d. Cookies and Tracking Technologies</SectionTitle>
        <Paragraph>
          Workonnect.ai uses cookies and similar technologies to improve user experience, analyze usage patterns, and enhance platform performance.
        </Paragraph>
        <Paragraph>
          Users may disable cookies through browser settings; however, some platform features may not function properly.
        </Paragraph>

        <SectionTitle id='privacy-2'>2. How We Use Information</SectionTitle>
        <Paragraph>Workonnect.ai uses collected information to:</Paragraph>
        <BulletList
          items={[
            'Provide and operate the HRMS platform',
            'Manage employee and organizational records',
            'Process attendance, leave management, and HR workflows',
            'Improve system functionality and performance',
            'Provide customer support',
            'Communicate important updates or system notifications',
            'Ensure platform security and prevent misuse',
            'Comply with legal obligations',
          ]}
        />

        <SectionTitle id='privacy-3'>3. Legal Basis for Processing</SectionTitle>
        <Paragraph>
          Workonnect.ai processes personal data only where a valid legal basis exists under applicable data protection laws. The company adheres to the Electronic Communications Privacy Act by safeguarding the privacy and security of electronic communications and data transmitted through our platform. This includes processing necessary for the performance of contractual obligations with our customers, such as delivering HRMS services and maintaining employee records. We may also process data to comply with legal and regulatory requirements, including tax, employment, and compliance obligations. In certain cases, processing is based on our legitimate interests, such as ensuring platform security, improving system functionality, and preventing fraud. Where required, we rely on explicit user consent, particularly for marketing communications. All processing activities are conducted lawfully, fairly, and transparently.
        </Paragraph>

        <SectionTitle id='privacy-4'>4. Data Security</SectionTitle>
        <Paragraph>Workonnect.ai takes appropriate technical and organizational measures to protect user data, including:</Paragraph>
        <BulletList
          items={[
            'Secure servers and encrypted connections (HTTPS)',
            'Access controls and authentication mechanisms',
            'Data monitoring and security audits',
            'Protection against unauthorized access or disclosure',
          ]}
        />
        <Paragraph>While we implement strong security practices, no system can guarantee complete security.</Paragraph>

        <SectionTitle id='privacy-5'>5. Data Sharing and Disclosure</SectionTitle>
        <Paragraph>Workonnect.ai does not sell personal data.</Paragraph>
        <Paragraph>We may share information only in the following circumstances:</Paragraph>
        <BulletList
          items={[
            'With authorized members of the organization using the platform',
            'With trusted service providers who help operate our services (hosting, analytics, infrastructure)',
            'If required by law, regulation, or legal process',
            'To protect the rights, safety, or security of Workonnect.ai and its users',
          ]}
        />

        <SectionTitle id='privacy-6'>6. Data Retention</SectionTitle>
        <Paragraph>
          Workonnect.ai retains data for as long as necessary to provide services to our customers and to comply with legal or regulatory requirements. Organizations using Workonnect.ai control the employee data they upload and manage within the platform.
        </Paragraph>

        <SectionTitle id='privacy-7'>7. User Rights</SectionTitle>
        <Paragraph>Depending on applicable laws, users may have rights regarding their personal information, including:</Paragraph>
        <BulletList
          items={[
            'Access to their data',
            'Correction of inaccurate information',
            'Request for deletion of data',
            'Restriction of certain processing activities',
          ]}
        />
        <Paragraph>
          Requests related to employee data should generally be directed to the organization that manages the account.
        </Paragraph>

        <SectionTitle id='privacy-8'>8. International Data Transfers</SectionTitle>
        <Paragraph>
          Workonnect.ai may process and store information on servers located in different countries. When transferring data internationally, we take reasonable steps to ensure data is protected according to applicable privacy standards.
        </Paragraph>

        <SectionTitle id='privacy-9'>9. Data Privacy Framework</SectionTitle>
        <Paragraph>
          Workonnect.ai operates within a very comprehensive data privacy framework aligned with globally recognized standards. This includes the General Data Protection Regulation (GDPR) and other applicable laws, which the company considers while retaining the data of its customers. Workonnect.ai also complies with the Federal Trade Commission Act by maintaining transparent, fair, and non-deceptive practices in the collection, use, and protection of personal information as per the FTC Act (Section 5).
        </Paragraph>
        <Paragraph>
          As a mechanism, the customer organizations act as data controllers (determining the purpose and means of processing employee data) while Workonnect.ai acts as a data processor (handling such data strictly on documented instructions). The company attempts to implement privacy-by-design principles by ensuring that data protection is embedded into its entire systems, processes, and product architecture.
        </Paragraph>
        <Paragraph>
          It can be noted that access to personal data is limited to authorized personnel and sub-processors only. This is also under strict contractual obligations, ensuring confidentiality, integrity, and accountability at every stage of data processing.
        </Paragraph>

        <SectionTitle id='privacy-10'>10. Children’s Privacy</SectionTitle>
        <Paragraph>
          Workonnect.ai is a business-focused platform that is intended to be used solely by organizations and their authorized personnel (not by children). Our services are not designed for, nor directed toward, individuals under the age of 16. In this case, Workonnect.ai complies with COPPA by not knowingly collecting or processing personal information from children under the age of 16.
        </Paragraph>
        <Paragraph>
          The company hereby declares that we do not collect, process, or store personal data relating to children under the age of 16. If we become aware that such data has been inadvertently submitted to our platform, we will take prompt action to delete it in accordance with applicable laws.
        </Paragraph>
        <Paragraph>
          Any customer organizations that are using the services of Workonnect.ai are responsible for ensuring that any data uploaded to the platform complies with legal requirements. This includes restrictions concerning all minors. For concerns regarding potential child data, users may contact us directly for immediate review and resolution.
        </Paragraph>

        <SectionTitle id='privacy-11'>11. Automated Decision-Making and Profiling</SectionTitle>
        <Paragraph>
          Workonnect.ai does not engage in automated decision-making or profiling that produces legal or similarly significant effects on individuals or organizations that are engaged with us. It can be noted that while the platform may incorporate automated functionalities (including workflow automation, attendance tracking, or system notifications), these features are designed to support administrative efficiency rather than replace human judgment.
        </Paragraph>
        <Paragraph>
          All material employment-related decisions, including hiring, compensation, promotion, or termination, remain under the sole control of the customer organization. These activities require compliance and approvals, without which the decisions are not implemented. Also, in line with global privacy standards, users retain the right to object to any form of automated processing where applicable. Workonnect.ai remains committed to transparency in all system-driven operations.
        </Paragraph>

        <SectionTitle id='privacy-12'>12. Data Breach Response and Notification</SectionTitle>
        <Paragraph>
          Workonnect.ai maintains an incident response framework to address potential data security breaches. In the event of a breach, the company’s system is designed to promptly initiate internal investigation procedures, which help to identify, contain, and remediate the issue immediately after being reported.
        </Paragraph>
        <Paragraph>
          As a suitable strategy, the company will notify affected customer organizations and relevant regulatory authorities within prescribed timeframes defined by law. Workonnect.ai also provides timely updates, risk mitigation guidance, and corrective measures to minimize any minor to adverse impact. In this case, the response protocols include continuous monitoring, post-incident analysis, and implementation of enhanced safeguards to prevent recurrence. The company promises to stay committed to maintaining transparency, accountability, and rapid response in protecting the confidentiality and integrity of user data.
        </Paragraph>

        <SectionTitle id='privacy-13'>13. Third-Party Services</SectionTitle>
        <Paragraph>
          Workonnect.ai may integrate with third-party tools such as communication platforms, analytics tools, or payment services. These third-party services have their own privacy policies governing the use of information.
        </Paragraph>

        <SectionTitle id='privacy-14'>14. Changes to This Privacy Policy</SectionTitle>
        <Paragraph>
          Workonnect.ai may update this Privacy Policy from time to time. When we make updates, the &quot;Last Updated&quot; date will be revised. Continued use of the platform after updates indicates acceptance of the revised policy.
        </Paragraph>

        <SectionTitle id='privacy-15'>15. Contact Us</SectionTitle>
        <Paragraph>
          If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
        </Paragraph>
        <Typography sx={contactLabelSx}>
          Workonnect.ai
        </Typography>
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
          We are committed to protecting the privacy and security of our users and organizations that trust Workonnect.ai with their HR operations.
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

export default PrivacyPolicyPage;

