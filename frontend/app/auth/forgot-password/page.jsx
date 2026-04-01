'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS, apiRequest, clearTokens } from '@/utils/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Clear any stale tokens when forgot password page loads
  useEffect(() => {
    console.log('[ForgotPasswordPage] Clearing stale tokens on page load');
    clearTokens();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest(API_ENDPOINTS.REQUEST_PASSWORD_RESET, {
        method: 'POST',
        body: JSON.stringify({ email }),
      }, false); // No auth token needed for password reset request

      console.log('[ForgotPasswordPage] Password reset response:', response);

      // Check if response contains OTP code for testing
      if (response.message && response.message.includes('OTP for testing')) {
        const otpMatch = response.message.match(/OTP for testing: (\d{6})/);
        if (otpMatch) {
          console.log('[ForgotPasswordPage] OTP Code for testing:', otpMatch[1]);
          alert(`Your OTP Code: ${otpMatch[1]}\n\nThis is for testing purposes only.`);
        }
      }

      setSuccess('Verification code sent! Redirecting...');
      setTimeout(() => {
        router.push('/auth/otp-verify?email=' + encodeURIComponent(email) + '&purpose=PASSWORD_RESET');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setLoading(false);
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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-20 w-full max-w-md">
        {/* Card */}
        <div className="backdrop-blur-xl bg-white/15 border border-white/30 rounded-3xl p-8 shadow-2xl hover:bg-white/20 transition-colors">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 mb-4 shadow-lg">
              <span className="text-2xl font-bold text-white">🔑</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
            <p className="text-gray-300 text-base">No worries! We'll help you reset it.</p>
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
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="relative group">
              <label htmlFor="email" className="block text-base font-semibold text-gray-200 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:border-yellow-400/70 focus:ring-2 focus:ring-yellow-400/30 transition-all duration-200"
                  required
                />
                <span className="absolute right-4 top-3.5 text-gray-300">✉</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">We'll send you a verification code to this email</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 px-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-yellow-500/30"
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white/10 text-gray-300 rounded-full">or</span>
            </div>
          </div>

          {/* Back to Login Link */}
          <Link
            href="/auth/login"
            className="block w-full text-center px-4 py-3 rounded-xl font-semibold text-gray-200 border border-white/20 hover:bg-white/10 transition-all duration-200"
          >
            Back to Login
          </Link>

          {/* Footer Links */}
          <div className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
