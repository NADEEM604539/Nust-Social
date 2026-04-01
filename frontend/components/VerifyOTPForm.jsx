'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest, API_ENDPOINTS } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';

export default function VerifyOTPForm() {
  const { isDark } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Auto-focus on OTP input
  useEffect(() => {
    const input = document.getElementById('otp-input');
    if (input) input.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!otp.trim()) {
      setError('Please enter the verification code');
      setLoading(false);
      return;
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('Verification code must be 6 digits');
      setLoading(false);
      return;
    }

    try {
      await apiRequest(
        API_ENDPOINTS.VERIFY_OTP,
        {
          method: 'POST',
          body: JSON.stringify({
            email,
            otp_code: otp,
            purpose: 'LOGIN'
          }),
        },
        false
      );

      setSuccess(true);
      // Redirect to reset password after 2 seconds
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}&otp=${otp}`);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError('');

    try {
      const resendResponse = await apiRequest(
        API_ENDPOINTS.REQUEST_PASSWORD_RESET,
        {
          method: 'POST',
          body: JSON.stringify({ email }),
        },
        false
      );

      setResendTimer(60); // 60 second cooldown
      setOtp('');
      // Brief success message
      const input = document.getElementById('otp-input');
      if (input) input.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError('');
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
          <div className="mb-4 text-4xl">📨</div>
          <h1 className={`text-2xl font-bold mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Verify Your Code
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Enter the 6-digit code sent to
          </p>
          <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
            {email}
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold">
              ✓ Verification successful!
            </p>
            <p className="text-sm text-green-700 mt-1">
              Redirecting to reset password...
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">✕ {error}</p>
          </div>
        )}

        {!success ? (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Verification Code
              </label>
              <input
                id="otp-input"
                type="text"
                value={otp}
                onChange={handleOTPChange}
                placeholder="000000"
                maxLength="6"
                disabled={loading}
                pattern="\d{6}"
                className={`w-full px-4 py-4 text-center text-2xl tracking-widest font-mono rounded-lg border transition ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <p className={`text-xs mt-2 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {otp.length}/6 digits entered
              </p>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            {/* Resend OTP */}
            <div className="text-center">
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Didn't receive the code?
              </p>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendLoading || resendTimer > 0}
                className={`mt-2 text-blue-600 hover:text-blue-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  resendTimer > 0 ? 'text-gray-400' : ''
                }`}
              >
                {resendTimer > 0
                  ? `Resend in ${resendTimer}s`
                  : resendLoading
                  ? 'Sending...'
                  : 'Resend Code'}
              </button>
            </div>

            {/* Back to Forgot Password */}
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              className={`w-full py-3 rounded-lg border transition ${
                isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Use Different Email
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="mb-4 text-4xl">✓</div>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
              Redirecting to reset password page...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
