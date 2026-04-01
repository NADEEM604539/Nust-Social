'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import CreateSocietyPostModal from '@/components/CreateSocietyPostModal';
import { apiRequest, API_ENDPOINTS, getUserId } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';

export default function SocietyDetailsPage() {
  const { isDark } = useTheme();
  const params = useParams();
  const router = useRouter();
  const societyId = params?.id;

  const [society, setSociety] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userRole, setUserRole] = useState(null); // ADMIN, MODERATOR, MEMBER, or null
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  // Fetch user ID
  useEffect(() => {
    const userId = getUserId();
    setCurrentUserId(userId);
  }, []);

  // Fetch society details
  useEffect(() => {
    if (!societyId) return;

    const fetchSociety = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await apiRequest(
          API_ENDPOINTS.GET_SOCIETY(societyId),
          { method: 'GET' }
        );

        const societyData = response?.data || response;
        setSociety(societyData);

        // TODO: Fetch user's role in this society
        // For now, we'll assume user can create posts if they're in /societies/my
      } catch (err) {
        console.error('Error fetching society:', err);
        setError('Failed to load society details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSociety();
  }, [societyId]);

  const handlePostCreated = (newPost) => {
    console.log('New post created:', newPost);
    // TODO: Refresh posts or add to list
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen ${isDark ? 'bg-black' : 'bg-white'}`}>
        <Navigation />
        <main className="w-full pt-16 md:pt-0">
          <div className="flex justify-center items-center h-screen">
            <div
              className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
                isDark ? 'border-blue-400' : 'border-blue-600'
              }`}
            />
          </div>
        </main>
      </div>
    );
  }

  if (error || !society) {
    return (
      <div className={`flex min-h-screen ${isDark ? 'bg-black' : 'bg-white'}`}>
        <Navigation />
        <main className="w-full pt-16 md:pt-0">
          <div className="flex w-full gap-4 px-4 md:px-0">
            <div className="hidden md:block w-64 flex-shrink-0 pt-4" />
            <div className="flex-1 max-w-2xl mx-auto w-full pt-4">
              <div
                className={`rounded-lg p-8 text-center ${
                  isDark
                    ? 'bg-red-900/20 border border-red-800 text-red-200'
                    : 'bg-red-100 border border-red-300 text-red-700'
                }`}
              >
                <p className="font-semibold mb-4">{error || 'Society not found'}</p>
                <Link
                  href="/societies"
                  className={`inline-block px-6 py-2 rounded-lg font-semibold transition-all ${
                    isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-black'
                  }`}
                >
                  ← Back to Societies
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
            {/* Back Button */}
            <Link
              href="/societies"
              className={`inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-lg font-semibold transition-all ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-black'
              }`}
            >
              ← Back to Societies
            </Link>

            {/* Society Header */}
            <div
              className={`rounded-lg p-8 mb-6 ${
                isDark
                  ? 'bg-gradient-to-br from-pink-900 to-blue-900 border border-gray-800'
                  : 'bg-gradient-to-br from-pink-100 to-blue-100 border border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1
                    className={`text-4xl font-bold mb-2 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {society.name}
                  </h1>
                  <p
                    className={`text-lg ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    {society.description || 'No description'}
                  </p>
                </div>

                {/* Society Avatar */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold flex-shrink-0">
                  {society.name?.charAt(0).toUpperCase() || 'S'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Create Post Button */}
                <button
                  onClick={() => setIsCreatePostModalOpen(true)}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  📢 Create Post
                </button>

                {/* See Members Button */}
                <button
                  onClick={() => {
                    // TODO: Open members modal or navigate to members page
                    console.log('Open members modal');
                  }}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    isDark
                      ? 'bg-purple-600 hover:bg-purple-500 text-white'
                      : 'bg-purple-500 hover:bg-purple-600 text-white'
                  }`}
                >
                  👥 Members
                </button>

                {/* Manage Button - Only for ADMIN/MODERATOR */}
                <button
                  onClick={() => {
                    // TODO: Open manage modal
                    console.log('Open manage modal');
                  }}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    isDark
                      ? 'bg-orange-600 hover:bg-orange-500 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  ⚙️ Manage
                </button>

                {/* Events Button */}
                <Link
                  href={`/societies/${societyId}/events`}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    isDark
                      ? 'bg-green-600 hover:bg-green-500 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  🎉 Events
                </Link>
              </div>
            </div>

            {/* Posts Section */}
            <div>
              <h2
                className={`text-2xl font-bold mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                📝 Recent Posts
              </h2>

              {/* TODO: Add society posts display here */}
              <div
                className={`rounded-lg p-8 text-center ${
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
                  📭 No posts yet
                </p>
                <p
                  className={`mt-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}
                >
                  Be the first to post an announcement!
                </p>
                <button
                  onClick={() => setIsCreatePostModalOpen(true)}
                  className={`inline-block mt-4 px-6 py-2 rounded-lg font-semibold transition-all ${
                    isDark
                      ? 'bg-gradient-to-r from-pink-600 to-blue-600 hover:from-pink-500 hover:to-blue-500 text-white'
                      : 'bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 text-white'
                  }`}
                >
                  ✨ Create First Post
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:flex w-72 flex-col flex-shrink-0 fixed right-0 top-20 h-screen overflow-y-auto pr-4 pt-4 gap-4">
            {/* Society Stats Card */}
            <div
              className={`rounded-lg p-4 sticky top-20 ${
                isDark
                  ? 'bg-gray-900 border border-gray-800'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <h3
                className={`font-bold text-lg mb-4 ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                📊 Society Info
              </h3>
              <div
                className={`space-y-3 text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className={isDark ? 'text-white' : 'text-black'}>
                    {society.created_at
                      ? new Date(society.created_at).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Members:</span>
                  <span className={isDark ? 'text-white' : 'text-black'}>
                    {society.member_count || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div
              className={`rounded-lg p-4 ${
                isDark
                  ? 'bg-gray-900 border border-gray-800'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <h3
                className={`font-bold text-lg mb-4 ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                ⚡ Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setIsCreatePostModalOpen(true)}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  📢 Post
                </button>
                <button
                  className={`w-full px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isDark
                      ? 'bg-purple-600 hover:bg-purple-500 text-white'
                      : 'bg-purple-500 hover:bg-purple-600 text-white'
                  }`}
                >
                  👥 Members
                </button>
              </div>
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

      {/* Create Society Post Modal */}
      <CreateSocietyPostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        societyId={societyId}
        societyName={society?.name || 'Society'}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}
