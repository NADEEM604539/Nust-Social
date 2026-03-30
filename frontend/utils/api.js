// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_VERSION = 'v1';

export const API_ENDPOINTS = {
  // Auth endpoints
  REGISTER: `${API_BASE_URL}/api/${API_VERSION}/auth/register`,
  LOGIN: `${API_BASE_URL}/api/${API_VERSION}/auth/login`,
  VERIFY_OTP: `${API_BASE_URL}/api/${API_VERSION}/auth/verify-otp`,
  REFRESH_TOKEN: `${API_BASE_URL}/api/${API_VERSION}/auth/refresh`,
  LOGOUT: `${API_BASE_URL}/api/${API_VERSION}/auth/logout`,
  
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

// Token storage keys
export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_ID: 'user_id',
  EMAIL: 'user_email',
};

// API request helper with proper error handling
export async function apiRequest(endpoint, options = {}) {
  const { includeToken = false, ...fetchOptions } = options;

  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add auth token if needed
  if (includeToken) {
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  try {
    const response = await fetch(endpoint, {
      ...fetchOptions,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle different error response formats from backend
      let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      
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
      
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('An unexpected error occurred');
  }
}

// Token management functions
// INDUSTRY STANDARD: Tokens should ideally be stored in HTTP-only cookies set by backend.
// This approach is more secure as cookies are automatically sent with requests
// and cannot be accessed from JavaScript (preventing XSS attacks).
//
// Until HTTP-only cookies are implemented, these functions provide secure localStorage access:

export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
  } catch (err) {
    console.warn('Failed to access token from localStorage:', err);
    return null;
  }
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
  } catch (err) {
    console.warn('Failed to access refresh token from localStorage:', err);
    return null;
  }
}

export function setTokens(accessToken, refreshToken, userId, email) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
    if (userId) localStorage.setItem(TOKEN_KEYS.USER_ID, userId.toString());
    if (email) localStorage.setItem(TOKEN_KEYS.EMAIL, email);
    
    // Remove temporary pending data
    try {
      localStorage.removeItem('pending_email');
      localStorage.removeItem('pending_user_id');
    } catch (e) {
      // Ignore errors when removing temporary data
    }
  } catch (err) {
    console.error('Failed to store tokens in localStorage:', err);
  }
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.USER_ID);
    localStorage.removeItem(TOKEN_KEYS.EMAIL);
  } catch (err) {
    console.warn('Failed to clear tokens from localStorage:', err);
  }
}

export function isAuthenticated() {
  return getAccessToken() !== null;
}

export function getUserId() {
  if (typeof window === 'undefined') return null;
  try {
    const userId = localStorage.getItem(TOKEN_KEYS.USER_ID);
    return userId ? parseInt(userId) : null;
  } catch (err) {
    console.warn('Failed to get user ID from localStorage:', err);
    return null;
  }
}

export function getUserEmail() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEYS.EMAIL);
}
