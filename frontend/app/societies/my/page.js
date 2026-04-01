'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import CreateSocietyModal from '@/components/CreateSocietyModal';
import { apiRequest, API_ENDPOINTS, getUserId } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';

export default function MySocietiesPage() {
  const { isDark } = useTheme();
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const userId = getUserId();
    setCurrentUserId(userId);
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchUserSocieties = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await apiRequest(API_ENDPOINTS.GET_USER_SOCIETIES, {
          method: 'GET',
        });

        let societiesData = [];
        if (Array.isArray(response?.data)) {
          societiesData = response.data;
        } else if (Array.isArray(response)) {
          societiesData = response;
        }

        setSocieties(societiesData);
      } catch (err) {
        console.error('Error fetching user societies:', err);
        setError('Failed to load your societies. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserSocieties();
  }, [currentUserId]);

  const handleSocietyCreated = (newSociety) => {
    // Add the new society to the list
    if (newSociety?.id) {
      setSocieties((prev) => [newSociety, ...prev]);
    }
  };

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Navigation */}
      <Navigation />

      {/* Main Content Area */}
      <main className="w-full md:pt-0 pt-16">
        <div className="flex w-full gap-4 px-4 md:px-0">
          {/* Left Padding */}
          <div className="hidden md:block w-64 flex-shrink-0 pt-4" />

          {/* Main Content */}
          <div className="flex-1 max-w-4xl mx-auto w-full pt-4 md:pt-4 pb-8">
            <div className="space-y-6">
              {/* Header with back button */}
              <div
                className={`rounded-lg p-6 ${
                  isDark
                    ? 'bg-gradient-to-br from-pink-900 to-blue-900 border border-gray-800'
                    : 'bg-gradient-to-br from-pink-100 to-blue-100 border border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-4">
                  <Link
                    href="/societies"
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      isDark
                        ? 'bg-gray-800 hover:bg-gray-700 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-black'
                    }`}
                  >
                    ← Back to Feed
                  </Link>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                      isDark
                        ? 'bg-gradient-to-r from-pink-600 to-blue-600 hover:from-pink-500 hover:to-blue-500 text-white'
                        : 'bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 text-white'
                    }`}
                  >
                    ✨ Create Society
                  </button>
                </div>
                <h1
                  className={`text-3xl font-bold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  My Societies
                </h1>
                <p
                  className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Societies you administer or moderate
                </p>
              </div>

              {/* Loading state */}
              {loading && (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-lg h-32 animate-pulse ${
                        isDark ? 'bg-gray-800' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Error state */}
              {error && !loading && (
                <div
                  className={`rounded-lg p-4 text-center ${
                    isDark
                      ? 'bg-red-900/20 border border-red-800 text-red-200'
                      : 'bg-red-100 border border-red-300 text-red-700'
                  }`}
                >
                  <p className="font-semibold">{error}</p>
                </div>
              )}

              {/* Empty state */}
              {!loading && societies.length === 0 && !error && (
                <div
                  className={`rounded-lg p-12 text-center ${
                    isDark
                      ? 'bg-gray-900 border border-gray-800'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <p
                    className={`text-lg font-semibold ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    📭 No societies yet
                  </p>
                  <p
                    className={`mt-2 ${
                      isDark ? 'text-gray-500' : 'text-gray-600'
                    }`}
                  >
                    Create your first society or ask to be an admin/moderator!
                  </p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className={`inline-block mt-4 px-6 py-2 rounded-lg font-semibold transition-all ${
                      isDark
                        ? 'bg-gradient-to-r from-pink-600 to-blue-600 hover:from-pink-500 hover:to-blue-500 text-white'
                        : 'bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 text-white'
                    }`}
                  >
                    ✨ Create Your First Society
                  </button>
                </div>
              )}

              {/* Societies Grid */}
              {!loading && societies.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {societies.map((society) => (
                    <Link key={society.id} href={`/societies/${society.id}`}>
                      <div
                        className={`rounded-lg p-6 h-full transition-all duration-200 transform hover:scale-105 hover:shadow-lg cursor-pointer ${
                          isDark
                            ? 'bg-gray-900 border border-gray-800 hover:border-pink-500 hover:border-2 hover:bg-gray-800'
                            : 'bg-white border border-gray-200 hover:border-pink-500 hover:border-2 hover:shadow-md'
                        }`}
                      >
                        {/* Society Name */}
                        <h2
                          className={`text-xl font-bold mb-2 line-clamp-2 ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {society.name}
                        </h2>

                        {/* Society Description */}
                        <p
                          className={`text-sm line-clamp-3 mb-4 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          {society.description || 'No description provided'}
                        </p>

                        {/* Society Stats - if available */}
                        {society.member_count && (
                          <div
                            className={`text-sm flex items-center gap-2 ${
                              isDark ? 'text-gray-500' : 'text-gray-600'
                            }`}
                          >
                            <span>👥 {society.member_count} members</span>
                          </div>
                        )}

                        {/* Chevron Icon */}
                        <div className="mt-4 flex justify-end">
                          <span
                            className={`text-xl ${
                              isDark ? 'text-pink-500' : 'text-pink-600'
                            }`}
                          >
                            →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Create Society CTA */}
          <div className="hidden lg:flex w-72 flex-col flex-shrink-0 fixed right-0 top-20 h-screen overflow-y-auto pr-4 pt-4 gap-4">
            {/* Create Society Sticky Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className={`w-full rounded-lg p-6 cursor-pointer transition-all duration-200 transform hover:scale-105 sticky top-20 ${
                isDark
                  ? 'bg-gradient-to-br from-pink-600 to-blue-600 hover:from-pink-500 hover:to-blue-500 shadow-lg shadow-pink-600/20'
                  : 'bg-gradient-to-br from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 shadow-lg shadow-pink-500/20'
              }`}
            >
              <h3 className="text-white font-bold text-lg text-center">
                ✨ Create Society
              </h3>
              <p className="text-white text-sm text-center mt-2 opacity-90">
                Start a new community
              </p>
            </button>

            {/* Manage Societies Card */}
            <div
              className={`rounded-lg p-4 ${
                isDark
                  ? 'bg-gray-900 border border-gray-800'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <h2
                className={`font-bold text-lg mb-4 ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                👨‍💼 You Manage
              </h2>
              <p
                className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                As an admin or moderator, you can manage societies and post announcements
              </p>
            </div>

            {/* Footer Links */}
            <div
              className={`text-xs space-y-2 p-4 text-center ${
                isDark ? 'text-gray-500' : 'text-gray-600'
              }`}
            >
              <div className="space-x-2">
                <a href="/about" className="hover:underline">
                  About
                </a>
                <a href="/privacy" className="hover:underline">
                  Privacy
                </a>
                <a href="/terms" className="hover:underline">
                  Terms
                </a>
              </div>
              <p>© 2026 NUST Social. All rights reserved.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Create Society Modal */}
      <CreateSocietyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSocietyCreated={handleSocietyCreated}
      />
    </div>
  );
}
