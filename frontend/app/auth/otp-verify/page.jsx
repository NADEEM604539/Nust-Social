'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_ENDPOINTS, apiRequest, setTokens } from '@/utils/api';

export default function OTPVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [purpose, setPurpose] = useState('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Initialize email and purpose from URL params only (no localStorage fallback for consistency)
  useEffect(() => {
    const urlEmail = searchParams.get('email');
    const urlPurpose = searchParams.get('purpose') || 'LOGIN';
    
    if (!urlEmail) {
      // If no email in URL, redirect back to login
      router.push('/auth/login');
      return;
    }
    
    setEmail(urlEmail);
    setPurpose(urlPurpose);
  }, [searchParams, router]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    // For password reset, skip verify-otp and go directly to password reset page
    // This keeps the OTP as unused (is_used = 0) so it can be used in reset-password endpoint
    if (purpose === 'PASSWORD_RESET') {
      setSuccess('OTP verified! Redirecting to password reset...');
      setTimeout(() => {
        router.push('/auth/password-reset?email=' + encodeURIComponent(email) + '&otp=' + encodeURIComponent(otpCode));
      }, 1000);
      return;
    }

    // For login and email verification, call verify-otp endpoint
    setLoading(true);
    try {
      const response = await apiRequest(API_ENDPOINTS.VERIFY_OTP, {
        method: 'POST',
        body: JSON.stringify({
          email,
          otp_code: otpCode,
          purpose: purpose,
        }),
      });

      // Check if response has tokens
      if (!response.access_token || !response.refresh_token) {
        console.error('[OTPVerify] Backend did not return tokens!', response);
        setError('Server error: No authentication tokens received');
        setLoading(false);
        return;
      }

      // Store tokens
      console.log('[OTPVerify] Response received:', response);
      const tokensStored = setTokens(response.access_token, response.refresh_token, response.user_id, email);
      console.log('[OTPVerify] Tokens stored successfully:', tokensStored);

      if (!tokensStored) {
        console.error('[OTPVerify] Failed to store tokens in storage');
        setError('Failed to save authentication. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess('Verified successfully! Redirecting...');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setResendLoading(true);

    try {
      setSuccess('OTP resent to your email (check spam folder)');
      setResendTimer(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-20 w-full max-w-md">
        {/* Card */}
        <div className="backdrop-blur-xl bg-white/15 border border-white/30 rounded-3xl p-8 shadow-2xl hover:bg-white/20 transition-colors">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 mb-4 shadow-lg">
              <span className="text-2xl font-bold text-white">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
            <p className="text-gray-300 text-base">
              We've sent a code to <span className="font-semibold">{email}</span>
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
              <span className="text-red-400 text-lg mt-0.5">⚠</span>
              <p className="text-red-200 text-base">{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-start gap-3">
              <span className="text-green-400 text-lg mt-0.5">✓</span>
              <p className="text-green-200 text-base">{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input Section */}
            <div>
              <label className="block text-base font-semibold text-gray-200 mb-4">
                Enter 6-Digit Code
              </label>
              <div className="flex gap-3 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:border-green-400/70 focus:ring-2 focus:ring-green-400/30 transition-all duration-200"
                    placeholder="•"
                  />
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 disabled:from-gray-500 disabled:to-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-green-500/40 disabled:shadow-none disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Verifying...
                  </>
                ) : (
                  <>Verify Email</>
                )}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <span className="text-sm text-gray-400 font-medium">HELP</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>

          {/* Resend Section */}
          <div className="space-y-3">
            <p className="text-base text-gray-400 text-center">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || resendTimer > 0}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 hover:text-white font-medium transition-all duration-200"
            >
              {resendLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Sending...
                </span>
              ) : resendTimer > 0 ? (
                `Resend in ${resendTimer}s`
              ) : (
                'Resend Code'
              )}
            </button>
          </div>

          {/* Info Section */}
          <div className="mt-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <p className="text-sm text-blue-200 text-center">
              💡 Check your spam folder if you don't see the email in your inbox.
            </p>
          </div>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-base">
              Want to use a different email?{' '}
              <Link
                href="/auth/register"
                className="text-green-300 hover:text-green-200 font-semibold transition-colors hover:underline"
              >
                Sign up again
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
