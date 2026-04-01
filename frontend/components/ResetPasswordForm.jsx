'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest, API_ENDPOINTS } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';

export default function ResetPasswordForm() {
  const { isDark } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const otp = searchParams.get('otp') || '';
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Calculate password strength
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (newPassword.length >= 12) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[a-z]/.test(newPassword)) strength++;
    if (/\d/.test(newPassword)) strength++;
    if (/[!@#$%^&*]/.test(newPassword)) strength++;

    setPasswordStrength(Math.min(strength, 5));
  }, [newPassword]);

  const getStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-300';
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Fair';
    return 'Strong';
  };

  const validatePassword = () => {
    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return false;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }

    if (!/[a-z]/.test(newPassword)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }

    if (!/\d/.test(newPassword)) {
      setError('Password must contain at least one number');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validatePassword()) {
      setLoading(false);
      return;
    }

    try {
      await apiRequest(
        API_ENDPOINTS.RESET_PASSWORD,
        {
          method: 'POST',
          body: JSON.stringify({
            email,
            otp_code: otp,
            new_password: newPassword
          }),
        },
        false
      );

      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-4 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className={`w-full max-w-md p-8 rounded-lg ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } shadow-lg`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4 text-4xl">🔐</div>
          <h1 className={`text-2xl font-bold mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Reset Password
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Create a strong new password for your account
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold">
              ✓ Password reset successful!
            </p>
            <p className="text-sm text-green-700 mt-1">
              Your password has been changed. Redirecting to login...
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">✕ {error}</p>
          </div>
        )}

        {!success ? (
          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* New Password */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter new password"
                  disabled={loading}
                  className={`w-full px-4 py-3 rounded-lg border transition pr-10 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-3.5 text-xl ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <p className={`text-xs font-semibold ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Password Strength
                    </p>
                    <p className={`text-xs font-bold ${
                      passwordStrength <= 2 ? 'text-red-600' :
                      passwordStrength <= 3 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {getStrengthText()}
                    </p>
                  </div>
                  <div className={`w-full h-2 rounded-full ${
                    isDark ? 'bg-gray-600' : 'bg-gray-200'
                  }`}>
                    <div
                      className={`h-full rounded-full transition-all ${getStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                  <ul className={`mt-2 space-y-1 text-xs ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <li className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>
                      {/[A-Z]/.test(newPassword) ? '✓' : '○'} Uppercase letter
                    </li>
                    <li className={/[a-z]/.test(newPassword) ? 'text-green-600' : ''}>
                      {/[a-z]/.test(newPassword) ? '✓' : '○'} Lowercase letter
                    </li>
                    <li className={/\d/.test(newPassword) ? 'text-green-600' : ''}>
                      {/\d/.test(newPassword) ? '✓' : '○'} Number
                    </li>
                    <li className={newPassword.length >= 8 ? 'text-green-600' : ''}>
                      {newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Confirm new password"
                  disabled={loading}
                  className={`w-full px-4 py-3 rounded-lg border transition pr-10 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className={`absolute right-3 top-3.5 text-xl ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {showConfirm ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {confirmPassword && newPassword === confirmPassword && (
                <p className="text-xs text-green-600 mt-2">✓ Passwords match</p>
              )}
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-600 mt-2">✕ Passwords do not match</p>
              )}
            </div>

            {/* Reset Button */}
            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>

            {/* Back to Login */}
            <button
              type="button"
              onClick={() => router.push('/auth/login')}
              className={`w-full py-3 rounded-lg border transition ${
                isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Back to Login
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="mb-4 text-4xl">✓</div>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
              Password reset successfully!
            </p>
            <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Redirecting to login...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
