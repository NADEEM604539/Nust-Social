'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_ENDPOINTS, apiRequest, setTokens } from '@/utils/api';

export default function PasswordResetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check password requirements
  const passwordRequirements = {
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasMinLength: password.length >= 8,
  };

  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);
  const passwordMatch = password && confirmPassword && password === confirmPassword;

  useEffect(() => {
    const urlEmail = searchParams.get('email');
    const urlOtp = searchParams.get('otp');

    if (!urlEmail || !urlOtp) {
      router.push('/auth/forgot-password');
      return;
    }

    setEmail(urlEmail);
    setOtp(urlOtp);
  }, [searchParams, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!allRequirementsMet) {
      setError('Password does not meet all requirements');
      return;
    }

    if (!passwordMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest(API_ENDPOINTS.RESET_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({
          email,
          otp_code: otp,
          new_password: password,
        }),
      }, false); // No auth token needed for password reset

      // Check if response has tokens
      if (!response.access_token || !response.refresh_token) {
        console.error('[PasswordReset] Backend did not return tokens!', response);
        setError('Server error: No authentication tokens received');
        setLoading(false);
        return;
      }

      // Store tokens  
      console.log('[PasswordReset] Response received:', response);
      const tokensStored = setTokens(response.access_token, response.refresh_token, response.user_id, email);
      console.log('[PasswordReset] Tokens stored successfully:', tokensStored);

      if (!tokensStored) {
        console.error('[PasswordReset] Failed to store tokens in storage');
        setError('Failed to save authentication. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess('Password reset successfully! Logging you in...');
      setTimeout(() => {
        router.push('/'); // Redirect to home, user is now logged in
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-20 w-full max-w-md">
        {/* Card */}
        <div className="backdrop-blur-xl bg-white/15 border border-white/30 rounded-3xl p-8 shadow-2xl hover:bg-white/20 transition-colors">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4 shadow-lg">
              <span className="text-2xl font-bold text-white">🔐</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-gray-300 text-base">Create a strong new password for your account</p>
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
            {/* New Password Input */}
            <div className="relative group">
              <label htmlFor="password" className="block text-base font-semibold text-gray-200 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/30 transition-all duration-200 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-300 hover:text-white transition-colors"
                >
                  {showPassword ? '👁️‍🗨️' : '👁️'}
                </button>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-300">Password Strength</div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      allRequirementsMet ? 'bg-green-500 w-full' :
                      Object.values(passwordRequirements).filter(Boolean).length >= 3 ? 'bg-yellow-500 w-3/4' :
                      Object.values(passwordRequirements).filter(Boolean).length >= 2 ? 'bg-orange-500 w-1/2' :
                      'bg-red-500 w-1/4'
                    }`}
                  ></div>
                </div>
                <div className="text-xs text-gray-400">
                  {allRequirementsMet ? 'Strong' : 'Weak'}
                </div>
              </div>
            )}

            {/* Password Requirements */}
            {password && (
              <div className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-sm font-semibold text-gray-300 mb-3">Password Requirements</div>
                <div className="space-y-2 text-sm">
                  <div className={`flex items-center gap-2 ${passwordRequirements.hasUppercase ? 'text-green-400' : 'text-gray-400'}`}>
                    <span>{passwordRequirements.hasUppercase ? '✓' : '✕'}</span>
                    <span>Uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordRequirements.hasLowercase ? 'text-green-400' : 'text-gray-400'}`}>
                    <span>{passwordRequirements.hasLowercase ? '✓' : '✕'}</span>
                    <span>Lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordRequirements.hasNumber ? 'text-green-400' : 'text-gray-400'}`}>
                    <span>{passwordRequirements.hasNumber ? '✓' : '✕'}</span>
                    <span>Number</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordRequirements.hasMinLength ? 'text-green-400' : 'text-gray-400'}`}>
                    <span>{passwordRequirements.hasMinLength ? '✓' : '✕'}</span>
                    <span>At least 8 characters</span>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Password Input */}
            <div className="relative group">
              <label htmlFor="confirmPassword" className="block text-base font-semibold text-gray-200 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/30 transition-all duration-200 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-3.5 text-gray-300 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
                </button>
              </div>
              {confirmPassword && (
                <div className="mt-2 text-sm flex items-center gap-2">
                  {passwordMatch ? (
                    <span className="text-green-400">✓ Passwords match</span>
                  ) : (
                    <span className="text-red-400">✕ Passwords do not match</span>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !allRequirementsMet || !passwordMatch}
              className="w-full mt-6 px-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/30"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
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
        </div>
      </div>
    </div>
  );
}
