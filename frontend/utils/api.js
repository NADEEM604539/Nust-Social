// Import token manager first (must be before apiRequest)
import {
  getAccessToken,
  setTokens,
  getRefreshToken,
  clearTokens,
  getUserId,
  getUserEmail,
  setAccessToken,
  setRefreshToken,
  refreshAccessToken,
  TOKEN_KEYS
} from './tokenManager.js';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_VERSION = 'v1';

export const API_ENDPOINTS = {
  // Auth endpoints
  REGISTER: `${API_BASE_URL}/api/${API_VERSION}/auth/register`,
  LOGIN: `${API_BASE_URL}/api/${API_VERSION}/auth/login`,
  VERIFY_OTP: `${API_BASE_URL}/api/${API_VERSION}/auth/verify-otp`,
  REFRESH_TOKEN: `${API_BASE_URL}/api/${API_VERSION}/auth/refresh-token`,
  LOGOUT: `${API_BASE_URL}/api/${API_VERSION}/auth/logout`,
  ME: `${API_BASE_URL}/api/${API_VERSION}/auth/me`,
  SESSIONS: `${API_BASE_URL}/api/${API_VERSION}/auth/sessions`,
  CHANGE_PASSWORD: `${API_BASE_URL}/api/${API_VERSION}/auth/change-password`,
  LOGOUT_ALL_DEVICES: `${API_BASE_URL}/api/${API_VERSION}/auth/logout-all-devices`,
  REQUEST_PASSWORD_RESET: `${API_BASE_URL}/api/${API_VERSION}/auth/request-password-reset`,
  RESET_PASSWORD: `${API_BASE_URL}/api/${API_VERSION}/auth/reset-password`,
  
  // Posts endpoints
  POSTS: `${API_BASE_URL}/api/${API_VERSION}/posts`,
  
  // Media endpoints
  MEDIA: `${API_BASE_URL}/api/${API_VERSION}/media`,
  
  // Societies endpoints
  SOCIETIES: `${API_BASE_URL}/api/${API_VERSION}/societies`,
  
  // Marketplace endpoints
  MARKETPLACE: `${API_BASE_URL}/api/${API_VERSION}/marketplace`,
  
  // Messages endpoints
  MESSAGES: `${API_BASE_URL}/api/${API_VERSION}/messages`,
  
  // Notifications endpoints
  NOTIFICATIONS: `${API_BASE_URL}/api/${API_VERSION}/notifications`,
  
  // Users endpoints
  USERS: `${API_BASE_URL}/api/${API_VERSION}/users`,
};

/**
 * API Request Handler with Automatic Token Refresh
 * 
 * Real-world production flow:
 * 1. Add access token to Authorization header
 * 2. Send request
 * 3. If 401 (Unauthorized):
 *    - Token might be expired
 *    - Automatically call refresh endpoint
 *    - Get new tokens
 *    - Retry original request with new token
 * 4. If refresh fails:
 *    - Refresh token is invalid
 *    - Clear all tokens
 *    - User must login again
 */
export async function apiRequest(endpoint, options = {}, retryCount = 0) {
  const MAX_RETRIES = 1; // Only retry once to prevent infinite loops
  const { includeToken = false, ...fetchOptions } = options;

  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // For unauthenticated endpoints, ALWAYS remove any existing Authorization header
  const isProtectedEndpoint = includeToken || endpoint.includes('/settings') || endpoint.includes('/profile/') || endpoint.includes('/posts/');
  
  if (!includeToken) {
    // Explicitly remove Authorization header for public endpoints
    delete headers.Authorization;
    console.log('[API] PUBLIC endpoint - explicitly removed any Authorization header');
  }

  // Add auth token if includeToken is true
  if (includeToken) {
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
      console.log('[API] PROTECTED endpoint - Using access token:', accessToken.substring(0, 20) + '...');
    } else {
      console.warn('[API] PROTECTED endpoint but no access token available');
    }
  }
  
  console.log('[API] Request to:', endpoint);
  console.log('[API] Headers:', { ...headers, Authorization: headers.Authorization ? 'Bearer [token]' : 'none' });

  try {
    const response = await fetch(endpoint, {
      ...fetchOptions,
      headers,
    });

    // Parse response carefully (store for reuse)
    let data;
    try {
      if (response.headers.get('content-type')?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch (parseError) {
      console.warn('[API] Failed to parse response:', parseError);
      data = {};
    }

    // ===== HANDLE 401 UNAUTHORIZED (Token Expired) =====
    // This works even if token was manually added in headers!
    if (response.status === 401 && retryCount < MAX_RETRIES) {
      console.warn('[API 401] Access token invalid/expired, attempting refresh...');
      
      const refreshResult = await refreshAccessToken();
      
      if (refreshResult.success) {
        // Token refreshed successfully, retry with FRESH token
        // Remove any stale Authorization header and use fresh token from manager
        const retryOptions = { ...options };
        retryOptions.includeToken = true; // Use fresh token from manager
        
        // Remove stale Authorization header if it exists
        if (retryOptions.headers) {
          const newHeaders = { ...retryOptions.headers };
          delete newHeaders.Authorization; // Remove old token
          retryOptions.headers = newHeaders;
        }
        
        console.log('[API] Token refreshed successfully, retrying request with fresh token...');
        return apiRequest(endpoint, retryOptions, retryCount + 1);
      } else {
        // Refresh failed, user needs to login again
        console.error('[API 401] Token refresh failed, clearing tokens and redirecting...');
        clearTokens();
        
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      // Handle different error response formats from backend
      let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      
      if (typeof data === 'object' && data !== null) {
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            // Pydantic validation errors (array format)
            errorMsg = data.detail[0]?.msg || data.detail[0] || errorMsg;
          } else {
            // Simple string detail message
            errorMsg = data.detail;
          }
        } else if (data.message) {
          errorMsg = data.message;
        } else if (data.error) {
          errorMsg = data.error;
        }
      }
      
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('An unexpected error occurred');
  }
}

// ===== TOKEN MANAGEMENT (Already imported from tokenManager at top) =====
// Functions are re-exported below
export {
  getAccessToken, 
  getRefreshToken, 
  setTokens, 
  clearTokens, 
  isAuthenticated, 
  getUserId, 
  getUserEmail,
  setAccessToken,
  setRefreshToken,
  refreshAccessToken,
  TOKEN_KEYS
};
