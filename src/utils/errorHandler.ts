import type { AxiosError } from 'axios';

// Backend error response structure
interface BackendErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}

// Error types for different scenarios
export type ErrorType = 'error' | 'warning' | 'info';

// Error handling result
export interface ErrorHandlingResult {
  message: string;
  type: ErrorType;
  shouldShow: boolean;
}

/**
 * Extracts user-friendly error message from API response
 * @param error - The error object from API call
 * @returns ErrorHandlingResult with message, type, and whether to show
 */
export function extractErrorMessage(error: unknown): ErrorHandlingResult {
  // Default error message
  const defaultMessage = 'An unexpected error occurred. Please try again.';

  // Handle Axios errors (most common)
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<BackendErrorResponse>;

    // Check if we have a response with backend error structure
    if (axiosError.response?.data) {
      const backendError = axiosError.response.data;

      // Backend returns structured error messages
      if (typeof backendError === 'object' && 'message' in backendError) {
        return {
          message: backendError.message,
          type: 'error',
          shouldShow: true,
        };
      }
    }

    // Handle different HTTP status codes
    const backendMessage = axiosError.response?.data?.message;
    const axiosMsg = axiosError.message;

    if (backendMessage) {
      return {
        message: backendMessage,
        type: 'error',
        shouldShow: true,
      };
    }

    return {
      message: axiosMsg || defaultMessage,
      type: 'error',
      shouldShow: true,
    };
  }

  // Handle regular Error objects
  if (error instanceof Error) {
    return {
      message: error.message,
      type: 'error',
      shouldShow: true,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      type: 'error',
      shouldShow: true,
    };
  }

  // Fallback for unknown error types
  return {
    message: defaultMessage,
    type: 'error',
    shouldShow: true,
  };
}

/**
 * Specific error handlers for different scenarios
 */

// Department-specific error messages
export const departmentErrorMessages = {
  globalDepartmentView:
    'This is a global department and cannot be modified. You can only view it as a reference.',
  globalDepartmentUpdate:
    'Global departments cannot be modified. They are provided as reference templates for your organization.',
  globalDepartmentDelete:
    'Global departments cannot be deleted. They are provided as reference templates for your organization.',
  departmentNotFound: 'Department does not belong to your organization',
  invalidDepartment: 'Department not found. Please select a valid department.',
};

// Designation-specific error messages
export const designationErrorMessages = {
  globalDesignationCreate:
    'Global departments are read-only reference templates. To add custom designations, please create your own department with the same name.',
  globalDesignationUpdate:
    'Global designations are read-only reference templates and cannot be modified.',
  globalDesignationDelete:
    'Global designations are read-only reference templates and cannot be deleted.',
  invalidDesignation: 'Invalid designation ID',
  designationNotFound: 'Designation does not belong to your organization',
};

// Employee-specific error messages
export const employeeErrorMessages = {
  invalidDesignation: 'Invalid designation ID',
  designationNotFound: 'Designation does not belong to your organization',
};

/**
 * Enhanced error handler that provides specific messages for known scenarios
 * @param error - The error object from API call
 * @param context - Context about what operation was being performed
 * @returns ErrorHandlingResult with contextual message
 */
export function handleApiError(
  error: unknown,
  context?: {
    operation: 'create' | 'update' | 'delete' | 'fetch';
    resource: 'department' | 'designation' | 'employee';
    isGlobal?: boolean;
  }
): ErrorHandlingResult {
  const baseResult = extractErrorMessage(error);

  // If we have context, try to provide more specific messages
  if (context) {
    const { operation, resource, isGlobal } = context;

    // Handle global resource errors
    if (isGlobal) {
      switch (resource) {
        case 'department':
          switch (operation) {
            case 'update':
              return {
                message: departmentErrorMessages.globalDepartmentUpdate,
                type: 'error',
                shouldShow: true,
              };
            case 'delete':
              return {
                message: departmentErrorMessages.globalDepartmentDelete,
                type: 'error',
                shouldShow: true,
              };
            case 'create':
              return {
                message: designationErrorMessages.globalDesignationCreate,
                type: 'error',
                shouldShow: true,
              };
          }
          break;
        case 'designation':
          switch (operation) {
            case 'create':
              return {
                message: designationErrorMessages.globalDesignationCreate,
                type: 'error',
                shouldShow: true,
              };
            case 'update':
              return {
                message: designationErrorMessages.globalDesignationUpdate,
                type: 'error',
                shouldShow: true,
              };
            case 'delete':
              return {
                message: designationErrorMessages.globalDesignationDelete,
                type: 'error',
                shouldShow: true,
              };
          }
          break;
      }
    }

    // Handle specific error scenarios based on status codes
    if (error && typeof error === 'object' && 'isAxiosError' in error) {
      const axiosError = error as AxiosError<BackendErrorResponse>;

      if (axiosError.response?.status === 400) {
        const message = axiosError.response.data?.message;

        // Check for specific error patterns
        if (
          message?.includes('global') &&
          message?.includes('cannot be modified')
        ) {
          return {
            message: message,
            type: 'error',
            shouldShow: true,
          };
        }

        if (message?.includes('does not belong to your organization')) {
          return {
            message: message,
            type: 'error',
            shouldShow: true,
          };
        }

        if (message?.includes('Invalid designation ID')) {
          return {
            message: message,
            type: 'error',
            shouldShow: true,
          };
        }
      }
    }
  }

  return baseResult;
}

/**
 * Utility function to check if a department is global
 * @param department - Department object
 * @returns boolean indicating if department is global
 */
export function isGlobalDepartment(department: {
  tenantId?: string;
  id?: string;
}): boolean {
  // Global departments typically have no tenantId or a specific global tenantId
  return (
    !department.tenantId ||
    department.tenantId === 'GLOBAL' ||
    !!department.id?.startsWith('global-')
  );
}

/**
 * Utility function to check if a designation is global
 * @param designation - Designation object
 * @returns boolean indicating if designation is global
 */
export function isGlobalDesignation(designation: {
  tenantId?: string;
  id?: string;
}): boolean {
  // Global designations typically have no tenantId or a specific global tenantId
  return (
    !designation.tenantId ||
    designation.tenantId === 'GLOBAL' ||
    !!designation.id?.startsWith('global-')
  );
}
