import { env } from '../config/env';
import { authService } from '../api/authService';

/**
 * Helper function to construct full URL for documents with authentication
 * @param docUrl Relative or absolute URL of the document
 * @returns Authenticated full URL
 */
export const getDocumentUrl = (docUrl: string): string => {
  if (!docUrl) return '';
  // If it's already an absolute URL (starts with http:// or https://), return as is
  if (docUrl.startsWith('http://') || docUrl.startsWith('https://')) {
    return docUrl;
  }

  // Get token for authentication
  const token = authService.getAccessToken();
  const timestamp = Date.now();

  const baseUrl = docUrl.startsWith('/')
    ? `${env.apiBaseUrl}${docUrl}`
    : `${env.apiBaseUrl}/${docUrl}`;

  const separator = baseUrl.includes('?') ? '&' : '?';
  const params = [`t=${timestamp}`];
  if (token) {
    params.push(`token=${encodeURIComponent(token)}`);
  }

  return `${baseUrl}${separator}${params.join('&')}`;
};
