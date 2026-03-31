'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, API_ENDPOINTS } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';

export default function ForgotPasswordForm() {
  const { isDark } = useTheme();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [otp, setOtp] = useState('');

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim()) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await apiRequest(API_ENDPOINTS.REQUEST_PASSWORD_RESET, {
        method: 'POST',
        body: JSON.stringify({ email }),
        includeToken: false
      });

      // Backend returns OTP in response for testing
      if (response.otp_code) {
        setOtp(response.otp_code);
      }

      setSuccess(true);
      // Redirect to OTP verification after 2 seconds
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
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
          <h1 className={`text-2xl font-bold mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Forgot Password?
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            No worries! We'll help you reset it.
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold">
              ✓ OTP sent successfully!
            </p>
            <p className="text-sm text-green-700 mt-1">
              Check your email for the verification code.
            </p>
            {otp && (
              <p className="text-sm text-green-700 mt-2 font-mono bg-green-100 p-2 rounded">
                Test OTP: <span className="font-bold">{otp}</span>
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">✕ {error}</p>
          </div>
        )}

        {!success ? (
          <form onSubmit={handleRequestOTP} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
                className={`w-full px-4 py-3 rounded-lg border transition ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <p className={`text-xs mt-2 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                We'll send you a verification code to this email
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending OTP...' : 'Send Verification Code'}
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
            <div className="mb-4 text-4xl">📧</div>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
              Redirecting to verification...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
