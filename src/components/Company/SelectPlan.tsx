import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import signupApi, {
  type SubscriptionPlan,
  type CompanyDetailsRequest,
  type LogoUploadRequest,
  type PaymentRequest,
  type StripePriceInfo,
} from '../../api/signupApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import { Icons } from '../../assets/icons';
import AppPageTitle from '../common/AppPageTitle';

// Default plans as fallback
const defaultPlans = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: '$10.00',
    duration: 'Month',
    features: [
      { text: 'Basic HRMS features', included: true },
      {
        text: 'Employee profile management with essential details',
        included: true,
      },
      { text: 'Department and designation setup', included: true },
      { text: 'Leave request and approval workflow (basic)', included: true },
      { text: 'Attendance tracking (manual entry)', included: true },
      { text: 'Standard reports (PDF/Excel export)', included: true },
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: '$20.00',
    duration: 'Month',
    features: [
      { text: 'Basic HRMS features', included: true },
      {
        text: 'Employee profile management with essential details',
        included: true,
      },
      { text: 'Department and designation setup', included: true },
      { text: 'Leave request and approval workflow (basic)', included: true },
      { text: 'Attendance tracking (manual entry)', included: true },
      { text: 'Standard reports (PDF/Excel export)', included: true },
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: '$50.00',
    duration: 'Month',
    features: [
      { text: 'Basic HRMS features', included: true },
      {
        text: 'Employee profile management with essential details',
        included: true,
      },
      { text: 'Department and designation setup', included: true },
      { text: 'Leave request and approval workflow (basic)', included: true },
      { text: 'Attendance tracking (manual entry)', included: true },
      { text: 'Standard reports (PDF/Excel export)', included: true },
    ],
    popular: false,
  },
];

const SelectPlan: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState(defaultPlans);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();

  const hasFetched = useRef(false);

  // Check access: either signup flow (with signupSessionId and companyDetails) or login flow (with requiresPayment)
  useEffect(() => {
    const signupSessionId = localStorage.getItem('signupSessionId');
    const companyDetails = localStorage.getItem('companyDetails');
    const accessToken = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');

    // Check if this is a signup flow (has signupSessionId AND companyDetails)
    const isSignupFlow = signupSessionId && companyDetails;

    // Check if this is a login flow (user is logged in, may or may not have signupSessionId)
    const isLoginFlow = accessToken && userStr;

    // If neither flow is valid, redirect to signup
    if (!isSignupFlow && !isLoginFlow) {
      navigate('/signup');
      return;
    }

    // Prevent duplicate API calls in StrictMode
    if (!hasFetched.current) {
      hasFetched.current = true;
      const fetchPlans = async () => {
        try {
          setLoading(true);
          const subscriptionPlans: SubscriptionPlan[] =
            await signupApi.getSubscriptionPlans();

          // Gather price IDs (if any) from plans
          const priceIds = subscriptionPlans
            .map(p => p.stripePriceId)
            .filter((id): id is string => Boolean(id));

          let priceInfoByPriceId: Record<
            string,
            { formatted: string; intervalLabel: string }
          > = {};

          if (priceIds.length > 0) {
            try {
              const prices = await signupApi.getStripePrices(priceIds);
              priceInfoByPriceId = (prices || []).reduce(
                (acc, pr: StripePriceInfo) => {
                  const amount =
                    typeof pr.unit_amount === 'number'
                      ? (pr.unit_amount as number)
                      : 0;
                  const currency = (
                    typeof pr.currency === 'string' ? pr.currency : 'USD'
                  ).toUpperCase();
                  const interval =
                    typeof pr.interval === 'string'
                      ? (pr.interval as string)
                      : 'month';
                  const formattedAmount = new Intl.NumberFormat(undefined, {
                    style: 'currency',
                    currency,
                    currencyDisplay: 'symbol',
                    maximumFractionDigits: 2,
                  }).format(amount / 100);
                  const intervalLabel =
                    interval.charAt(0).toUpperCase() + interval.slice(1);
                  // priceId might be returned as `priceId` or `id` depending on API
                  acc[pr.priceId] = {
                    formatted: formattedAmount,
                    intervalLabel,
                  };
                  return acc;
                },
                {} as Record<
                  string,
                  { formatted: string; intervalLabel: string }
                >
              );
            } catch {
              // Fallback prices if stripe API fails
              priceIds.forEach((priceId, index) => {
                const fallbackPrices = ['$9', '$19', '$30'];
                const fallbackIntervals = ['Month', 'Month', 'Month'];
                priceInfoByPriceId[priceId] = {
                  formatted: fallbackPrices[index] || '$0',
                  intervalLabel: fallbackIntervals[index] || 'Month',
                };
              });
            }
          }

          // Transform API data to match our UI structure
          const transformedPlans = subscriptionPlans.map((plan, index) => {
            const descriptionText = plan.description || '';
            // Split description into bullet points by common delimiters
            const bullets = descriptionText
              .split(/\r?\n|\u2022|\||;|\./)
              .map(s => s.trim())
              .filter(Boolean);

            const features =
              bullets.length > 0
                ? bullets.map(b => ({ text: b, included: true }))
                : [{ text: 'Includes core features', included: true }];

            const priceInfo = plan.stripePriceId
              ? priceInfoByPriceId[plan.stripePriceId]
              : undefined;
            const price = priceInfo ? priceInfo.formatted : '$—';
            const duration = priceInfo ? priceInfo.intervalLabel : 'Month';

            let planName = plan.name;
            if (plan.name.toLowerCase().includes('basic')) {
              planName = 'Basic Plan';
            } else if (
              plan.name.toLowerCase().includes('pro') ||
              plan.name.toLowerCase().includes('standard')
            ) {
              planName = 'Pro Plan';
            } else if (
              plan.name.toLowerCase().includes('enterprise') ||
              plan.name.toLowerCase().includes('premium')
            ) {
              planName = 'Enterprise Plan';
            }

            return {
              id: plan.id,
              name: planName,
              price,
              duration,
              description: descriptionText,
              features,
              popular: index === 1,
            };
          });

          setPlans(transformedPlans);
        } catch (err: unknown) {
          setError('Failed to load subscription plans. Using default plans.');
          showError(err);
          // Keep default plans as fallback
        } finally {
          setLoading(false);
        }
      };

      void fetchPlans();
    }
  }, [navigate, showError]);

  // Auto-select the 2nd plan when plans are loaded and user is coming from company details page
  useEffect(() => {
    const companyDetails = localStorage.getItem('companyDetails');
    // Only auto-select if coming from company details page (has companyDetails) and no plan is selected yet
    if (companyDetails && plans.length >= 2 && !selectedPlan && !loading) {
      setSelectedPlan(plans[1].id);
    }
  }, [plans, loading, selectedPlan]);

  // Compute visible plans: hide any plan that is billed "per employee" or has a $2 price
  const visiblePlans = plans.filter(p => {
    const durationStr =
      typeof p.duration === 'string' ? p.duration.toLowerCase() : '';
    if (durationStr.includes('employee')) return false;
    const priceStr =
      typeof p.price === 'string'
        ? p.price.replace(/[^0-9.]/g, '')
        : String(p.price);
    const priceNum = parseFloat(priceStr) || 0;
    return priceNum !== 2;
  });

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleContinue = async () => {
    if (!selectedPlan) {
      setError('Please select a plan to continue');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const signupSessionIdRaw = localStorage.getItem('signupSessionId');
      const companyDetailsStr = localStorage.getItem('companyDetails');
      const companyDetails = companyDetailsStr
        ? JSON.parse(companyDetailsStr)
        : {};
      const accessToken = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');

      // Validate and normalize signupSessionId
      const signupSessionId = signupSessionIdRaw
        ? String(signupSessionIdRaw).trim()
        : null;

      // Determine if this is signup flow or login flow
      // Signup flow: has signupSessionId AND companyDetails (from signup process)
      // Login flow: has accessToken and user, may have signupSessionId from login response
      const isSignupFlow = signupSessionId && companyDetailsStr;
      const isLoginFlow = accessToken && userStr && !companyDetailsStr; // Login flow doesn't have companyDetails

      if (isSignupFlow) {
        // Signup flow: Create company details and proceed with payment
        if (!signupSessionId || signupSessionId.length === 0) {
          throw new Error('Signup session not found. Please start over.');
        }

        // Validate company details are present and not empty
        const companyName = companyDetails?.companyName
          ? String(companyDetails.companyName).trim()
          : '';
        const domain = companyDetails?.domain
          ? String(companyDetails.domain).trim()
          : '';

        if (!companyName || !domain) {
          throw new Error(
            'Company name and domain are required. Please go back and fill in all required fields.'
          );
        }

        // 1. Create company details with selected plan
        const companyDetailsRequest: CompanyDetailsRequest = {
          signupSessionId, // Now guaranteed to be a non-empty string
          companyName,
          domain,
          planId: selectedPlan,
        };

        await signupApi.createCompanyDetails(companyDetailsRequest);

        // 2. Upload logo if available
        if (
          companyDetails.logoBase64 &&
          companyDetails.logoFileName &&
          companyDetails.logoFileType
        ) {
          try {
            // Convert base64 back to File object
            const byteCharacters = atob(
              companyDetails.logoBase64.split(',')[1]
            );
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const logoFile = new File(
              [byteArray],
              companyDetails.logoFileName,
              {
                type: companyDetails.logoFileType,
              }
            );

            const logoUploadData: LogoUploadRequest = {
              signupSessionId,
              logo: logoFile,
            };

            await signupApi.uploadLogo(logoUploadData);
          } catch {
            // Don't block the flow if logo upload fails
          }
        }

        // 3. Create Stripe Checkout Session
        // signupSessionId is already validated above as a non-empty string
        const paymentRequest: PaymentRequest = {
          signupSessionId, // Guaranteed to be a non-empty string
          mode: 'checkout' as const, // Use Stripe Checkout
        };

        const checkoutSession = await signupApi.createPayment(paymentRequest);

        showSuccess('Redirecting to secure payment...');

        // 4. Redirect to Stripe Checkout
        if (checkoutSession.url) {
          window.location.href = checkoutSession.url;
        } else {
          throw new Error('No checkout URL received from server');
        }
      } else if (isLoginFlow) {
        // eslint-disable-next-line no-useless-catch
        try {
          const loginSignupSessionIdRaw =
            localStorage.getItem('signupSessionId');
          const loginSignupSessionId = loginSignupSessionIdRaw
            ? String(loginSignupSessionIdRaw).trim()
            : null;

          if (!loginSignupSessionId || loginSignupSessionId.length === 0) {
            throw new Error('Session ID not found. Please log in again.');
          }

          // Get company details from localStorage (stored during login)
          const companyStr = localStorage.getItem('company');
          const company = companyStr ? JSON.parse(companyStr) : null;

          if (!company || !company.company_name || !company.domain) {
            throw new Error('Company details not found. Please log in again.');
          }

          // Step 1: Update company details with selected plan
          // Backend already has company details from tenant creation, but still requires companyName and domain
          const companyDetailsRequest: CompanyDetailsRequest = {
            signupSessionId: loginSignupSessionId,
            companyName: company.company_name,
            domain: company.domain,
            planId: selectedPlan,
          };

          await signupApi.createCompanyDetails(companyDetailsRequest);

          // Step 2: Create payment with session_id
          const paymentRequest: PaymentRequest = {
            signupSessionId: loginSignupSessionId,
            mode: 'checkout' as const,
          };

          const checkoutSession = await signupApi.createPayment(paymentRequest);

          showSuccess('Redirecting to secure payment...');

          if (checkoutSession.url) {
            window.location.href = checkoutSession.url;
          } else {
            throw new Error('No checkout URL received from server');
          }
        } catch (paymentError: unknown) {
          throw paymentError;
        }
      } else {
        throw new Error('Invalid session. Please start over.');
      }
    } catch (err: unknown) {
      let errorMessage = 'Failed to create payment session. Please try again.';

      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: unknown } }).response?.data
      ) {
        const data = (err as { response?: { data?: unknown } }).response?.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (
          data &&
          typeof data === 'object' &&
          'message' in data &&
          typeof (data as { message?: unknown }).message === 'string'
        ) {
          errorMessage = (data as { message?: string }).message ?? errorMessage;
        } else if (
          data &&
          typeof data === 'object' &&
          'error' in data &&
          typeof (data as { error?: unknown }).error === 'string'
        ) {
          errorMessage = (data as { error?: string }).error ?? errorMessage;
        } else if (
          data &&
          typeof data === 'object' &&
          'details' in data &&
          typeof (data as { details?: unknown }).details === 'string'
        ) {
          errorMessage = (data as { details?: string }).details ?? errorMessage;
        }
      } else if (err instanceof Error && err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      showError(err);

      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    const signupSessionId = localStorage.getItem('signupSessionId');
    const accessToken = localStorage.getItem('accessToken');

    // If signup flow, go back to company details
    // If login flow, go back to dashboard
    if (signupSessionId) {
      navigate('/signup/company-details');
    } else if (accessToken) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: 'background.default',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <CircularProgress size={60} />
        <Typography sx={{ color: 'text.secondary', mt: 2 }}>
          Loading subscription plans...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'var(--white-100-color)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        px: { xs: 2, sm: 4, md: 6 },
        py: 4,
      }}
    >
      {/* Heading */}
      <AppPageTitle
        sx={{
          color: 'var(--text-color)',
          fontWeight: 700,
          mb: 1,
          textAlign: 'center',
          fontSize: { xs: '32px', md: '36px', lg: '52px' },
        }}
      >
        Choose Your Plan
      </AppPageTitle>
      <Typography
        sx={{
          color: 'var(--dark-grey-color)',
          mb: 5,
          textAlign: 'center',
          fontSize: { xs: '16px', lg: '24px' },
          fontWeight: 400,
        }}
      >
        You can choose the plan of your choice
      </Typography>

      {/* Error Message */}
      {error && (
        <Alert severity='error' sx={{ mb: 3, maxWidth: 600 }}>
          {error}
        </Alert>
      )}

      {/* Plans */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        sx={{ width: '100%', maxWidth: '1300px', mb: 4 }}
      >
        {visiblePlans.map(plan => (
          <Paper
            key={plan.id}
            onClick={() => handlePlanSelect(plan.id)}
            sx={{
              flex: 1,
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow:
                selectedPlan === plan.id
                  ? '0 0 25px 8px rgba(48, 131, 220, 0.35)' // Equal glow on all sides
                  : '0 4px 12px rgba(0,0,0,0.08)',
              position: 'relative',
              bgcolor: 'var(--white-color)',
              transition: 'all 250ms ease',
              cursor: 'pointer',
              mx: { xs: 1.5, sm: 2, md: 0 },
              display: 'flex',
              flexDirection: 'column',
              minHeight: 420,
              // '&:hover': {
              //   boxShadow:
              //     selectedPlan === plan.id
              //       ? '0 0 0 3px rgba(48, 131, 220, 0.5), 0 12px 28px rgba(48, 131, 220, 0.35), 0 0 25px rgba(48, 131, 220, 0.2)'
              //       : '0 8px 24px rgba(0,0,0,0.15)',
              // },
              border:
                selectedPlan === plan.id
                  ? '2px solid rgba(48, 131, 220, 0.5)'
                  : '1px solid transparent',
            }}
          >
            {/* Card Header */}
            <Box sx={{ pt: 3, px: 3 }}>
              {/* Heading */}
              <Typography
                variant='h3'
                sx={{
                  fontWeight: 700,
                  fontSize: 'var(--subheading2-font-size)',
                  textAlign: 'left',
                  color: 'var(--text-color)',
                  mb: 2,
                }}
              >
                {plan.name}
              </Typography>
              {/* Price section */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  mb: 2,
                }}
              >
                <Typography
                  component='span'
                  sx={{
                    fontSize: { xs: 36, sm: 42, md: 48 },
                    fontWeight: 700,
                    color: 'var(--secondary-color)',
                    lineHeight: 1,
                    mb: 0.5,
                  }}
                >
                  {typeof plan.price === 'string'
                    ? plan.price
                        .replace(/^US\$/i, '$')
                        .replace(/\$(\d)/, '$ $1')
                    : plan.price}
                </Typography>
                <Typography
                  component='span'
                  sx={{
                    fontSize: 'var(--body-font-size)',
                    color: 'var(--secondary-color)',
                    fontWeight: 400,
                  }}
                >
                  Per {plan.duration}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ px: 3 }}>
              {' '}
              <Divider sx={{ borderColor: 'rgba(0,0,0,0.08)' }} />{' '}
            </Box>
            {/* Features - scrollable area */}
            <Box
              sx={{
                pt: 3,
                px: 3,
                flexGrow: 1,
                minHeight: 0,
                overflowY: 'auto',
                maxHeight: 320,
              }}
            >
              {plan.features.map((feature, idx) => (
                <Stack
                  key={idx}
                  direction='row'
                  spacing={1.5}
                  alignItems='center'
                  sx={{ mb: 1.5 }}
                >
                  <Box
                    component='img'
                    src={Icons.plans}
                    alt='Plan feature icon'
                    sx={{
                      width: 20,
                      height: 20,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  />
                  <Typography
                    sx={{
                      color: 'var(--text-color)',
                      fontSize: { xs: '16px', lg: 'var(--body-font-size)' },
                      lineHeight: 1.5,
                    }}
                  >
                    {feature.text}
                  </Typography>
                </Stack>
              ))}
            </Box>

            {/* Button - fixed at bottom of card */}
            <Box sx={{ textAlign: 'center', pb: 3, px: 3, mt: 2 }}>
              <Button
                onClick={e => {
                  e.stopPropagation();
                  handlePlanSelect(plan.id);
                }}
                sx={{
                  backgroundColor:
                    selectedPlan === plan.id
                      ? 'var(--black-color)'
                      : 'var(--dark-grey-500-color)',
                  color: 'var(--white-color)',
                  borderRadius: '16px',
                  px: 2,
                  py: 1.25,
                  width: '100%',
                  fontWeight: 500,
                  textTransform: 'none',
                  fontSize: { xs: '14px', lg: 'var(--body-font-size)' },
                  // '&:hover': {
                  //   backgroundColor:
                  //     selectedPlan === plan.id
                  //       ? 'var(--text-color)'
                  //       : 'var(--dark-grey-color)',
                  // },
                }}
              >
                Choose Plan
              </Button>
            </Box>
          </Paper>
        ))}
      </Stack>

      {/* Navigation Buttons */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          width: '100%',
          maxWidth: '1300px',
        }}
      >
        <Button
          variant='outlined'
          onClick={handleBack}
          disabled={submitting}
          sx={{
            borderColor: 'var(--dark-grey-500-color)',
            color: 'var(--text-color)',
            px: 4,
            borderRadius: '12px',
            fontWeight: 500,
            textTransform: 'none',
            fontSize: { xs: '12px', lg: 'var(--body-font-size)' },
            // '&:hover': {
            //   borderColor: 'var(--dark-grey-color)',
            //   backgroundColor: 'var(--white-100-color)',
            // },
          }}
        >
          Back
        </Button>

        <Button
          variant='contained'
          onClick={handleContinue}
          disabled={!selectedPlan || submitting}
          sx={{
            backgroundColor: 'var(--primary-dark-color)',
            color: 'var(--white-color)',
            px: 4,
            borderRadius: '12px',
            fontWeight: 500,
            textTransform: 'none',
            fontSize: { xs: '12px', lg: 'var(--body-font-size)' },
            // '&:hover': {
            //   backgroundColor: 'var(--primary-light-color)',
            // },
            '&:disabled': {
              backgroundColor: 'var(--grey-color)',
              color: 'var(--white-color)',
            },
          }}
        >
          {submitting ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} color='inherit' />
              Processing...
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShoppingCartIcon /> Checkout
            </Box>
          )}
        </Button>
      </Box>

      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
};

export default SelectPlan;
