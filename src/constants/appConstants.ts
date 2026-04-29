export const TIMEOUTS = {
  API_REQUEST: 30000,
  FAKE_DELAY: 1000,
  SIMULATED_LATENCY: 300,
  SNACKBAR_DURATION: 6000,
  AUTH_CHECK_DELAY: 100,
} as const;

export const VALIDATION_LIMITS = {
  MIN_DEPARTMENT_NAME_LENGTH: 2,
  MAX_DESCRIPTION_LENGTH: 200,
  MAX_PASSWORD_LENGTH: 15,
  MIN_PASSWORD_LENGTH: 8,
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  MAX_PROFILE_PICTURE_SIZE: 5 * 1024 * 1024,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  DEFAULT_PAGE: 1,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50] as const,
  MOBILE_PAGE_SIZE_OPTIONS: [5, 10] as const,
} as const;

export const SIZES = {
  AVATAR: {
    SMALL: 40,
    MEDIUM: 50,
    LARGE: 120,
  },
  ICON: {
    SMALL: 18,
    MEDIUM: 20,
    LARGE: 24,
  },
  BUTTON: {
    SMALL: 36,
    MEDIUM: 40,
    LARGE: 48,
  },
  MODAL: {
    SMALL: 400,
    MEDIUM: 512,
    LARGE: 700,
  },
  LOGO: {
    SMALL: 60,
    MEDIUM: 80,
    LARGE: 120,
  },
} as const;

export const BREAKPOINTS = {
  MOBILE: 'sm',
  TABLET: 'md',
  DESKTOP: 'lg',
} as const;

export const API_CONFIG = {
  DEFAULT_LIMIT: 25,
  MAX_LIMIT: 100,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;

export const DATE_FORMATS = {
  STANDARD: 'YYYY-MM-DD',
  DISPLAY: 'MMM DD, YYYY',
  TIME: 'HH:mm',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
} as const;

export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DELETED: 'deleted',
  SUSPENDED: 'suspended',
} as const;

export const ERROR_MESSAGES = {
  GENERIC: 'An error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  TIMEOUT: 'Request timeout. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
} as const;

export const SUCCESS_MESSAGES = {
  GENERIC: 'Operation completed successfully.',
  SAVE: 'Saved successfully.',
  DELETE: 'Deleted successfully.',
  UPDATE: 'Updated successfully.',
  CREATE: 'Created successfully.',
} as const;
