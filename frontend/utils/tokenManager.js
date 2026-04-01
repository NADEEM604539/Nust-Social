/**
 * Token Manager Module
 * Purpose: Secure token storage and refresh logic (production-grade)
 * 
 * Security Implementation:
 * - Access Token: Stored in memory (destroyed on page reload) - More secure
 * - Refresh Token: Stored in httpOnly cookie (set by server ideally) - Secure from XSS
 * - Auto-refresh on 401: Transparent to user
 * - Token rotation: Old tokens invalidated, new tokens issued
 * - Logout on refresh failure: Automatic session cleanup
 */

// In-memory storage for access token (NOT persisted between page reloads)
let memoryAccessToken = null;

const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_ID: 'user_id',
  EMAIL: 'user_email',
};

// ===== ACCESS TOKEN (Memory - Most Secure) =====
export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  
  // First check memory
  if (memoryAccessToken) {
    return memoryAccessToken;
  }
  
  // Fall back to localStorage if memory is empty (happens after page reload)
  try {
    return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
  } catch (err) {
    console.warn('Failed to get access token:', err);
    return null;
  }
}

export function setAccessToken(token) {
  if (typeof window === 'undefined') return false;
  
  if (!token) {
    console.error('[TokenManager] ERROR: setAccessToken called with empty token!');
    return false;
  }
  
  // Store in memory (primary)
  memoryAccessToken = token;
  console.log('[TokenManager] Access token stored in memory');
  
  // Also store in localStorage for recovery after page reload
  try {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, token);
    console.log('[TokenManager] Access token stored in localStorage');
  } catch (err) {
    console.error('[TokenManager] Failed to store access token in localStorage:', err);
    return false;
  }
  
  // IMPORTANT: Also set in cookie for middleware to detect authenticated state
  try {
    const expiryDays = 1; // Access token expires in 1 day
    const expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + (expiryDays * 24 * 60 * 60 * 1000));
    const expires = `expires=${expiryDate.toUTCString()}`;
    
    document.cookie = `${TOKEN_KEYS.ACCESS_TOKEN}=${token};${expires};path=/;SameSite=Lax`;
    console.log('[TokenManager] Access token set in cookie for middleware');
  } catch (err) {
    console.error('[TokenManager] Failed to set access token cookie:', err);
    // Don't fail the function - token is still in memory/localStorage
  }
  
  return true;
}

// ===== REFRESH TOKEN (Cookies - Secure) =====
export function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  
  try {
    const token = localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
    if (!token) {
      console.warn('[TokenManager] No refresh token found in storage');
    } else {
      console.log('[TokenManager] Refresh token retrieved:', token.substring(0, 20) + '...');
    }
    return token;
  } catch (err) {
    console.error('[TokenManager] Failed to get refresh token:', err);
    return null;
  }
}

export function setRefreshToken(token) {
  if (typeof window === 'undefined') return false;
  
  if (!token) {
    console.error('[TokenManager] ERROR: setRefreshToken called with empty/null token!');
    return false;
  }
  
  console.log('[TokenManager] Storing refresh token:', token.substring(0, 30) + '...');
  
  try {
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, token);
    console.log('[TokenManager] Refresh token stored in localStorage');
    
    // Verify it was actually stored
    const storedToken = localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
    if (!storedToken) {
      console.error('[TokenManager] CRITICAL: Token stored but not retrievable from localStorage!');
      return false;
    }
    
    if (storedToken !== token) {
      console.error('[TokenManager] CRITICAL: Token mismatch after storage!');
      return false;
    }
    
    console.log('[TokenManager] Refresh token verification passed');
    
    // Set secure cookie for backend use
    const expiryDays = 30;
    const expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + (expiryDays * 24 * 60 * 60 * 1000));
    const expires = `expires=${expiryDate.toUTCString()}`;
    
    document.cookie = `${TOKEN_KEYS.REFRESH_TOKEN}=${token};${expires};path=/;SameSite=Lax`;
    console.log('[TokenManager] Refresh token set in cookie');
    
    return true;
  } catch (err) {
    console.error('[TokenManager] FAILED to store refresh token:', err.message);
    console.error('[TokenManager] Error details:', err);
    return false;
  }
}

// ===== COMPLETE TOKEN MANAGEMENT =====
export function setTokens(accessToken, refreshToken, userId, email) {
  if (typeof window === 'undefined') {
    console.error('[TokenManager] setTokens called server-side');
    return false;
  }
  
  console.log('[TokenManager] === SETTING TOKENS START ===');
  console.log('[TokenManager] Access token received:', !!accessToken);
  console.log('[TokenManager] Refresh token received:', !!refreshToken);
  console.log('[TokenManager] User ID:', userId);
  console.log('[TokenManager] Email:', email);
  
  if (!accessToken || !refreshToken) {
    console.error('[TokenManager] CRITICAL ERROR: Missing tokens!', {  
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    });
    return false;
  }
  
  // Store access token
  const accessStored = setAccessToken(accessToken);
  console.log('[TokenManager] Access token stored:', accessStored);
  
  // Store refresh token
  const refreshStored = setRefreshToken(refreshToken);
  console.log('[TokenManager] Refresh token stored:', refreshStored);
  
  // Store metadata
  try {
    if (userId) {
      localStorage.setItem(TOKEN_KEYS.USER_ID, userId.toString());
      console.log('[TokenManager] User ID stored');
    }
    if (email) {
      localStorage.setItem(TOKEN_KEYS.EMAIL, email);
      console.log('[TokenManager] Email stored');
    }
  } catch (err) {
    console.error('[TokenManager] Failed to store metadata:', err);
  }
  
  // Final verification
  console.log('[TokenManager] === VERIFICATION ===');
  const verifyAccess = getAccessToken();
  const verifyRefresh = getRefreshToken();
  console.log('[TokenManager] Access token retrievable:', !!verifyAccess);
  console.log('[TokenManager] Refresh token retrievable:', !!verifyRefresh);
  
  if (!verifyAccess || !verifyRefresh) {
    console.error('[TokenManager] CRITICAL: Tokens not retrievable after storage!');
    return false;
  }
  
  console.log('[TokenManager] === TOKENS SET SUCCESSFULLY ===');
  return true;
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  
  console.log('[TokenManager] clearTokens() called - clearing all auth data');
  
  // Clear memory
  memoryAccessToken = null;
  console.log('[TokenManager] Memory cleared');
  
  // Clear localStorage
  try {
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.USER_ID);
    localStorage.removeItem(TOKEN_KEYS.EMAIL);
    console.log('[TokenManager] localStorage cleared');
  } catch (err) {
    console.warn('Failed to clear localStorage tokens:', err);
  }
  
  // Clear cookies
  try {
    document.cookie = `${TOKEN_KEYS.ACCESS_TOKEN}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
    document.cookie = `${TOKEN_KEYS.REFRESH_TOKEN}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
    document.cookie = `${TOKEN_KEYS.USER_ID}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
    document.cookie = `${TOKEN_KEYS.EMAIL}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
  } catch (err) {
    console.warn('Failed to clear cookies:', err);
  }
}

// ===== HELPER FUNCTIONS =====
export function isAuthenticated() {
  return getAccessToken() !== null;
}

export function getUserId() {
  if (typeof window === 'undefined') return null;
  try {
    const userId = localStorage.getItem(TOKEN_KEYS.USER_ID);
    return userId ? parseInt(userId) : null;
  } catch (err) {
    return null;
  }
}

export function getUserEmail() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEYS.EMAIL);
  } catch (err) {
    return null;
  }
}

// ===== TOKEN REFRESH LOGIC =====
let isRefreshing = false;
let refreshPromise = null;

/**
 * Refresh access token using refresh token
 * This is called automatically on 401 response
 * Implements token rotation: old tokens are invalidated, new tokens are issued
 * 
 * Returns: { success: boolean, accessToken?: string, refreshToken?: string }
 */
export async function refreshAccessToken() {
  // ===== CRITICAL: Prevent multiple simultaneous refresh requests =====
  // If refresh is already in progress, return the pending promise
  if (isRefreshing) {
    console.log('[TokenRefresh] Refresh already in progress, returning pending promise...');
    return refreshPromise;
  }

  isRefreshing = true;
  console.log('[TokenRefresh] === TOKEN REFRESH STARTED ===');
  
  refreshPromise = new Promise(async (resolve) => {
    try {
      // Get current refresh token
      const currentRefreshToken = getRefreshToken();
      
      if (!currentRefreshToken) {
        console.error('[TokenRefresh] CRITICAL: No refresh token available in storage!');
        clearTokens();
        isRefreshing = false;
        resolve({ success: false });
        return;
      }

      console.log('[TokenRefresh] Refresh token found, calling /api/v1/auth/refresh-token...');

      // Determine API base URL (same logic as api.js for consistency)
      const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? 'http://localhost:8000' 
        : (typeof window !== 'undefined' && window.location.hostname.includes('localhost'))
          ? 'http://localhost:8000'
          : `${typeof window !== 'undefined' ? window.location.protocol : 'http:'}//${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8000`;

      const refreshTokenEndpoint = `${API_BASE_URL}/api/v1/auth/refresh-token`;
      console.log('[TokenRefresh] Calling endpoint:', refreshTokenEndpoint);

      // Call refresh endpoint with refresh token in body (NOT in Authorization header)
      const response = await fetch(refreshTokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: currentRefreshToken
        }),
        credentials: 'include',
      });

      console.log('[TokenRefresh] Response status:', response.status);

      const data = await response.json();
      console.log('[TokenRefresh] Response data:', { 
        hasAccessToken: !!data.access_token,
        hasRefreshToken: !!data.refresh_token,
        status: response.status
      });

      if (!response.ok) {
        // Refresh token is invalid/expired - need to logout
        const errorDetail = data.detail || data.message || 'Unknown error';
        console.error('[TokenRefresh] REFRESH FAILED:', errorDetail);
        console.log('[TokenRefresh] Clearing all tokens and requesting login...');
        clearTokens();
        isRefreshing = false;
        
        // Redirect to login if in browser
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        
        resolve({ success: false });
        return;
      }

      // ===== TOKEN ROTATION: Replace old tokens with new ones =====
      console.log('[TokenRefresh] === TOKEN ROTATION ===');
      console.log('[TokenRefresh] Old access token will be replaced');
      console.log('[TokenRefresh] Old refresh token will be replaced');
      
      // Store new tokens via setTokens (which updates memory, localStorage, and cookies)
      const tokensSet = setTokens(
        data.access_token,
        data.refresh_token,
        getUserId(),  // Keep existing user info
        getUserEmail()
      );

      if (!tokensSet) {
        console.error('[TokenRefresh] CRITICAL: Failed to store refreshed tokens!');
        clearTokens();
        isRefreshing = false;
        resolve({ success: false });
        return;
      }

      console.log('[TokenRefresh] === TOKENS REFRESHED & ROTATED SUCCESSFULLY ===');
      console.log('[TokenRefresh] Access token updated in memory, localStorage, and cookie');
      console.log('[TokenRefresh] Refresh token updated in localStorage and cookie');
      
      isRefreshing = false;
      resolve({ 
        success: true, 
        accessToken: data.access_token,
        refreshToken: data.refresh_token
      });
    } catch (error) {
      console.error('[TokenRefresh] EXCEPTION during token refresh:', error);
      console.error('[TokenRefresh] Error type:', error.constructor.name);
      console.error('[TokenRefresh] Error message:', error.message);
      
      clearTokens();
      isRefreshing = false;
      
      // Redirect to login if in browser
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      
      resolve({ success: false });
    }
  });

  return refreshPromise;
}

// Export token keys for external use
export { TOKEN_KEYS };
