/**
 * API Module
 * Purpose: Centralized API endpoint configuration and request handler with token management
 * 
 * Features:
 * - Centralized API endpoint definitions
 * - Token-aware request handling (adds Authorization header automatically)
 * - Auto token refresh on 401
 * - Error handling and token validation
 */

import { getAccessToken, setAccessToken, setTokens, clearTokens, getRefreshToken, refreshAccessToken, getUserId } from './tokenManager';

// ===== API BASE CONFIGURATION =====
const API_BASE_URL = 'http://127.0.0.1:8000';

// ===== API ENDPOINTS =====
export const API_ENDPOINTS = {
  // Authentication
  REGISTER: '/api/v1/auth/register',
  LOGIN: '/api/v1/auth/login',
  VERIFY_OTP: '/api/v1/auth/verify-otp',
  REFRESH_TOKEN: '/api/v1/auth/refresh-token',
  LOGOUT: '/api/v1/auth/logout',
  REQUEST_PASSWORD_RESET: '/api/v1/auth/request-password-reset',
  RESET_PASSWORD: '/api/v1/auth/reset-password',
  CHANGE_PASSWORD: '/api/v1/auth/change-password',
  ME: '/api/v1/auth/me',
  SESSIONS: '/api/v1/auth/sessions',
  LOGOUT_ALL_DEVICES: '/api/v1/auth/logout-all-devices',
  
  // Users
  GET_USER_PROFILE: '/api/v1/users/profile',
  UPDATE_USER_PROFILE: '/api/v1/users/profile',
  GET_USER: (id) => `/api/v1/users/profile/${id}`,
  FOLLOW_USER: (id) => `/api/v1/users/${id}/follow`,
  UNFOLLOW_USER: (id) => `/api/v1/users/${id}/follow`,
  GET_FOLLOWERS: (id) => `/api/v1/users/${id}/followers`,
  GET_FOLLOWING: (id) => `/api/v1/users/${id}/following`,
  GET_SUGGESTIONS: '/api/v1/users/suggestions/recommended',
  GET_USER_STATS: (id) => `/api/v1/users/${id}/stats`,
  
  // Posts
  GET_FEED: '/api/v1/posts',
  CREATE_POST: '/api/v1/posts',
  GET_POST: (id) => `/api/v1/posts/${id}`,
  UPDATE_POST: (id) => `/api/v1/posts/${id}`,
  DELETE_POST: (id) => `/api/v1/posts/${id}`,
  LIKE_POST: (id) => `/api/v1/posts/${id}/react`,
  UNLIKE_POST: (id) => `/api/v1/posts/${id}/react`,
  VOTE_POST: (id) => `/api/v1/posts/${id}/vote`,
  UNVOTE_POST: (id) => `/api/v1/posts/${id}/vote`,
  
  // Comments
  CREATE_COMMENT: (postId) => `/api/v1/posts/${postId}/comment`,
  DELETE_COMMENT: (postId, commentId) => `/api/v1/posts/${postId}/comment/${commentId}`,
  
  // Notifications
  GET_NOTIFICATIONS: '/api/v1/notifications',
  MARK_NOTIFICATIONS_READ: '/api/v1/notifications/read',
  GET_UNREAD_COUNT: '/api/v1/notifications/unread-count',
  
  // Media Upload
  UPLOAD_MEDIA: '/api/v1/media/upload',
  DELETE_MEDIA: (id) => `/api/v1/media/${id}`,
  
  // Societies
  GET_SOCIETIES: '/api/v1/societies',
  GET_SOCIETY: (id) => `/api/v1/societies/${id}`,
  GET_SOCIETY_POSTS: (societyId) => `/api/v1/societies/${societyId}/posts`,
  CREATE_SOCIETY_POST: (societyId) => `/api/v1/societies/${societyId}/posts`,
  GET_USER_SOCIETIES: '/api/v1/societies/user/my-societies',
  IS_SOCIETY_ADMIN_OR_MOD: (societyId) => `/api/v1/societies/${societyId}/is-admin-or-moderator`,
};

// ===== TOKEN REFRESH is handled by tokenManager =====

// ===== MAIN API REQUEST HANDLER =====
export async function apiRequest(
  endpoint,
  options = {},
  includeToken = true,
  retryOnUnauthorized = true
) {
  if (typeof window === 'undefined') {
    throw new Error('apiRequest can only be called from client-side');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization token if requested and available
  if (includeToken) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  console.log(`[API] Request: ${options.method || 'GET'} ${endpoint}`);
  console.log(`[API] Full URL: ${url}`);
  console.log(`[API] Headers:`, { ...headers, Authorization: headers.Authorization ? '***' : 'undefined' });

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Send cookies with request
    });

    // Handle unauthorized response
    if (response.status === 401 && retryOnUnauthorized && includeToken) {
      console.log('[API] Received 401, attempting token refresh...');
      try {
        const refreshResult = await refreshAccessToken();
        if (refreshResult.success && refreshResult.accessToken) {
          console.log('[API] Token refreshed successfully, retrying original request...');
          // Retry the original request with new token
          return apiRequest(endpoint, options, true, false);
        } else {
          console.error('[API] Token refresh failed');
          clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          throw new Error('Token refresh failed - session expired');
        }
      } catch (refreshError) {
        console.error('[API] Token refresh error:', refreshError);
        clearTokens();
        // Redirect to login if in browser
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        throw refreshError;
      }
    }

    // Parse response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType && contentType.includes('text')) {
      data = await response.text();
    } else {
      data = await response.blob();
    }

    // Handle error responses
    if (!response.ok) {
      const errorMessage = data?.detail || data?.message || `HTTP Error: ${response.status}`;
      console.error(`[API] Error ${response.status}:`, errorMessage);
      throw new Error(errorMessage);
    }

    console.log(`[API] Success: ${endpoint}`, data);
    return data;
  } catch (error) {
    // Provide better error messages for network issues
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error(`[API] Network Error - Cannot reach ${url}`);
      console.error('[API] Make sure backend is running at http://localhost:8000');
      throw new Error(`Cannot connect to backend - is the server running? (${url})`);
    }
    console.error(`[API] Request failed:`, error);
    throw error;
  }
}

// ===== EXPORTED UTILITIES =====

/**
 * Set authentication tokens and user info
 * Used by OTP verification to store tokens after login
 */
export { setTokens, clearTokens };

/**
 * Get the current access token
 */
export { getAccessToken };

/**
 * Get the current refresh token
 */
export { getRefreshToken };

/**
 * Get the current user ID
 */
export { getUserId };

/**
 * Logout helper
 */
export async function logout() {
  try {
    await apiRequest(API_ENDPOINTS.LOGOUT, { method: 'POST' }, true);
  } catch (error) {
    console.warn('[API] Logout request failed, clearing tokens anyway:', error);
  } finally {
    clearTokens();
  }
}

/**
 * Helper to check if user is authenticated
 */
export function isAuthenticated() {
  return !!getAccessToken();
}

/**
 * Helper to check if user has a stored refresh token
 */
export function hasRefreshToken() {
  return !!getRefreshToken();
}
