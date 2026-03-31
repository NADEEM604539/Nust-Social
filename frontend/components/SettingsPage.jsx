'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { apiRequest, API_ENDPOINTS, clearTokens, getAccessToken } from '@/utils/api';

export default function SettingsPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchUserInfo();
    fetchActiveSessions();
  }, []);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(API_ENDPOINTS.ME, {
        method: 'GET',
        includeToken: true,
      });
      setUserInfo(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const response = await apiRequest(API_ENDPOINTS.SESSIONS, {
        method: 'GET',
        includeToken: true,
      });
      setSessions(response.sessions || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest(API_ENDPOINTS.CHANGE_PASSWORD, {
        method: 'POST',
        includeToken: true,
        body: JSON.stringify({
          old_password: passwordData.oldPassword,
          new_password: passwordData.newPassword,
        }),
      });
      
      setSuccess('Password changed successfully!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutDevice = async (sessionId) => {
    if (!confirm('Are you sure you want to logout from this device?')) {
      return;
    }

    try {
      setLoading(true);
      await apiRequest(`${API_ENDPOINTS.SESSIONS}/${sessionId}`, {
        method: 'DELETE',
        includeToken: true,
      });
      setSuccess('Device logged out successfully');
      fetchActiveSessions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!confirm('Are you sure you want to logout from all devices? You will need to login again.')) {
      return;
    }

    try {
      setLoading(true);
      await apiRequest(API_ENDPOINTS.LOGOUT_ALL_DEVICES, {
        method: 'POST',
        includeToken: true,
      });
      setSuccess('Logged out from all devices');
      clearTokens();
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getDeviceType = (userAgent) => {
    if (!userAgent) return 'Unknown Device';
    if (/mobile/i.test(userAgent)) return 'Mobile';
    if (/tablet/i.test(userAgent)) return 'Tablet';
    return 'Desktop';
  };

  const getBrowserName = (userAgent) => {
    if (!userAgent) return 'Unknown Browser';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/chrome/i.test(userAgent)) return 'Chrome';
    if (/safari/i.test(userAgent)) return 'Safari';
    if (/edge/i.test(userAgent)) return 'Edge';
    return 'Unknown Browser';
  };

  return (
    <div className="w-full min-h-screen pt-4 md:pt-0">
      {/* Alerts */}
      {error && (
        <div className={`m-4 p-4 rounded-lg border ${
          isDark
            ? 'bg-red-900/20 border-red-700 text-red-400'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-semibold hover:underline"
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className={`m-4 p-4 rounded-lg border ${
          isDark
            ? 'bg-green-900/20 border-green-700 text-green-400'
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          {success}
          <button
            onClick={() => setSuccess(null)}
            className="ml-2 font-semibold hover:underline"
          >
            ✕
          </button>
        </div>
      )}

      {/* Settings Header */}
      <div className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} p-6`}>
        <h1 className="text-3xl font-bold">⚙️ Settings</h1>
        <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Manage your account security and authentication
        </p>
      </div>

      {/* Tabs */}
      <div className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} flex gap-8 px-6 sticky top-0 z-10 ${isDark ? 'bg-black' : 'bg-white'}`}>
        {[
          { id: 'overview', label: 'Overview', icon: '👁️' },
          { id: 'sessions', label: 'Active Sessions', icon: '📱' },
          { id: 'password', label: 'Change Password', icon: '🔐' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 px-2 font-semibold transition-all duration-200 border-b-2 ${
              activeTab === tab.id
                ? isDark
                  ? 'border-purple-500 text-purple-400'
                  : 'border-purple-600 text-purple-600'
                : isDark
                ? 'border-transparent text-gray-400 hover:text-gray-300'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6 max-w-4xl">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Account Overview</h2>
              <div className={`rounded-lg border ${
                isDark
                  ? 'bg-gray-900/50 border-gray-800'
                  : 'bg-gray-50 border-gray-200'
              } p-6 space-y-4`}>
                {userInfo ? (
                  <>
                    <div className="flex justify-between items-center py-3 border-b border-gray-700">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Email:</span>
                      <span className="font-semibold">{userInfo.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-700">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Username:</span>
                      <span className="font-semibold">@{userInfo.username}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-700">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Account Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        userInfo.status === 'ACTIVE'
                          ? isDark
                            ? 'bg-green-900/20 text-green-400'
                            : 'bg-green-50 text-green-700'
                          : isDark
                          ? 'bg-red-900/20 text-red-400'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {userInfo.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-700">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Email Verified:</span>
                      <span className={userInfo.is_verified ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
                        {userInfo.is_verified ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Account Created:</span>
                      <span className="font-semibold">{formatDate(userInfo.created_at)}</span>
                    </div>
                  </>
                ) : (
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading user information...</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Security</h2>
              <div className={`rounded-lg border ${
                isDark
                  ? 'bg-gray-900/50 border-gray-800'
                  : 'bg-gray-50 border-gray-200'
              } p-6 space-y-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Password</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Last changed: Recently
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('password')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      isDark
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Danger Zone</h2>
              <div className={`rounded-lg border-2 ${
                isDark
                  ? 'bg-red-900/10 border-red-800'
                  : 'bg-red-50 border-red-200'
              } p-6`}>
                <button
                  onClick={handleLogoutAllDevices}
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                    isDark
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  } disabled:opacity-50`}
                >
                  {loading ? 'Logging out...' : '🔴 Logout From All Devices'}
                </button>
                <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  This will end your sessions on all devices and require you to log in again
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Active Sessions Tab */}
        {activeTab === 'sessions' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Active Sessions</h2>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage devices and browsers logged into your account
            </p>

            {sessions.length === 0 ? (
              <div className={`rounded-lg border ${
                isDark
                  ? 'bg-gray-900/50 border-gray-800'
                  : 'bg-gray-50 border-gray-200'
              } p-6 text-center`}>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  No active sessions found
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => {
                  const isCurrentSession = getAccessToken() === session.token;
                  return (
                    <div
                      key={session.id}
                      className={`rounded-lg border ${
                        isDark
                          ? 'bg-gray-900/50 border-gray-800'
                          : 'bg-gray-50 border-gray-200'
                      } p-6`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">
                              {getDeviceType(session.user_agent) === 'Mobile'
                                ? '📱'
                                : getDeviceType(session.user_agent) === 'Tablet'
                                ? '📱'
                                : '🖥️'}
                            </span>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {getDeviceType(session.user_agent)} - {getBrowserName(session.user_agent)}
                              </h3>
                              {isCurrentSession && (
                                <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-blue-600 text-white mt-1">
                                  Current Session
                                </span>
                              )}
                            </div>
                          </div>

                          <div className={`mt-3 space-y-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <p>
                              <strong>IP Address:</strong> {session.ip_address || 'Unknown'}
                            </p>
                            <p>
                              <strong>Browser:</strong> {getBrowserName(session.user_agent)}
                            </p>
                            <p>
                              <strong>Last Active:</strong> {formatDate(session.created_at)}
                            </p>
                            <p>
                              <strong>Expires:</strong> {formatDate(session.expires_at)}
                            </p>
                          </div>
                        </div>

                        {!isCurrentSession && (
                          <button
                            onClick={() => handleLogoutDevice(session.id)}
                            disabled={loading}
                            className={`ml-4 px-4 py-2 rounded-lg font-semibold transition-all flex-shrink-0 ${
                              isDark
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            } disabled:opacity-50`}
                          >
                            Logout
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === 'password' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Change Password</h2>
            <form
              onSubmit={handleChangePassword}
              className={`rounded-lg border ${
                isDark
                  ? 'bg-gray-900/50 border-gray-800'
                  : 'bg-gray-50 border-gray-200'
              } p-6 max-w-md space-y-4`}
            >
              <div>
                <label className={`block font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      oldPassword: e.target.value,
                    })
                  }
                  disabled={loading}
                  className={`w-full px-4 py-2 rounded-lg border transition-all ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500'
                      : 'bg-white border-gray-300 text-black focus:border-purple-600'
                  } focus:outline-none`}
                  required
                />
              </div>

              <div>
                <label className={`block font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  disabled={loading}
                  className={`w-full px-4 py-2 rounded-lg border transition-all ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500'
                      : 'bg-white border-gray-300 text-black focus:border-purple-600'
                  } focus:outline-none`}
                  required
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Must be at least 8 characters long
                </p>
              </div>

              <div>
                <label className={`block font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  disabled={loading}
                  className={`w-full px-4 py-2 rounded-lg border transition-all ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500'
                      : 'bg-white border-gray-300 text-black focus:border-purple-600'
                  } focus:outline-none`}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                  isDark
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                } disabled:opacity-50 mt-6`}
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
