'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import EditUsernameModal from '@/components/EditUsernameModal';
import EditProfileModal from '@/components/EditProfileModal';
import ProfilePostsSection from '@/components/ProfilePostsSection';
import { apiRequest, API_ENDPOINTS, getAccessToken } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';

export default function ProfilePage() {
  const { isDark } = useTheme();
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditUsernameModal, setShowEditUsernameModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // posts, confessions, anonymous
  const [userId, setUserId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const token = getAccessToken();
        
        if (!token) {
          router.push('/auth/login');
          return;
        }

        // Decode token to get current user ID
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const currUserId = decodedToken.sub || decodedToken.user_id;
        setUserId(currUserId);

        // Fetch current user profile (includes email from updated endpoint)
        const userResponse = await apiRequest(
          `${API_ENDPOINTS.USERS}/profile/${currUserId}`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (userResponse) {
          setUser(userResponse);
        }

        // Fetch user stats
        const statsResponse = await apiRequest(
          `${API_ENDPOINTS.USERS}/${currUserId}/stats`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (statsResponse?.stats) {
          setStats(statsResponse.stats);
        }

        setError('');
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router, refreshTrigger]);

  const handleEditUsername = async (updatedData) => {
    try {
      const token = getAccessToken();
      
      const response = await apiRequest(
        `${API_ENDPOINTS.USERS}/profile`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(updatedData),
        }
      );

      if (response) {
        setUser(response);
        setShowEditUsernameModal(false);
      }
    } catch (err) {
      console.error('Error updating username:', err);
      throw new Error('Failed to update username');
    }
  };

  const handleEditProfile = async (updatedData) => {
    try {
      const token = getAccessToken();
      
      const response = await apiRequest(
        `${API_ENDPOINTS.USERS}/profile`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(updatedData),
        }
      );

      if (response) {
        setUser(response);
        setShowEditProfileModal(false);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      throw new Error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
            {error || 'Profile not found'}
          </p>
          <Link
            href="/"
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      {/* Navigation Sidebar */}
      <Navigation />

      {/* Main Content Area */}
      <main className="w-full md:pt-0 pt-16">
        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            {/* Profile Header */}
            <div className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                  {/* Avatar */}
                  <div className="flex-shrink-0 mx-auto md:mx-0">
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 text-center md:text-left">
                    {/* Username */}
                    <div className="mb-4">
                      <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                        {user?.username || 'User'}
                      </h1>
                    </div>

                    {/* Edit Button */}
                    <div className="mb-6">
                      <button
                        onClick={() => setShowEditUsernameModal(true)}
                        className="px-8 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                      >
                        Edit Username
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-8 mb-6 justify-center md:justify-start">
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                          {stats?.posts_count || 0}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          posts
                        </p>
                      </div>
                      
                      <div className="text-center cursor-pointer hover:opacity-75 transition-opacity">
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                          {stats?.followers_count || 0}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          followers
                        </p>
                      </div>
                      
                      <div className="text-center cursor-pointer hover:opacity-75 transition-opacity">
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                          {stats?.following_count || 0}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          following
                        </p>
                      </div>
                    </div>

                    {/* Bio and Details */}
                    <div className="space-y-2">
                      {user?.full_name && (
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                          {user.full_name}
                        </p>
                      )}
                      {user?.bio && (
                        <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                          {user.bio}
                        </p>
                      )}
                      {user?.batch_year && (
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Batch of {user.batch_year}
                        </p>
                      )}
                      {user?.department && (
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {user.department}
                        </p>
                      )}
                      
                      {/* Edit Profile Button */}
                      <div className="pt-4">
                        <button
                          onClick={() => setShowEditProfileModal(true)}
                          className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                        >
                          Edit Profile Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div
              className={`sticky top-0 z-20 ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'} border-b`}
            >
              <div className="max-w-3xl mx-auto px-4">
                <div className="flex gap-8">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`py-4 font-semibold border-b-2 transition-colors ${
                      activeTab === 'posts'
                        ? `border-pink-500 ${isDark ? 'text-white' : 'text-black'}`
                        : `border-transparent ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`
                    }`}
                  >
                    📝 Posts
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('confessions')}
                    className={`py-4 font-semibold border-b-2 transition-colors ${
                      activeTab === 'confessions'
                        ? `border-pink-500 ${isDark ? 'text-white' : 'text-black'}`
                        : `border-transparent ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`
                    }`}
                  >
                    🤐 Confessions & Rumors
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('anonymous')}
                    className={`py-4 font-semibold border-b-2 transition-colors ${
                      activeTab === 'anonymous'
                        ? `border-pink-500 ${isDark ? 'text-white' : 'text-black'}`
                        : `border-transparent ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`
                    }`}
                  >
                    🔒 My Anonymous Posts
                  </button>
                </div>
              </div>
            </div>

            {/* Posts Section */}
            <div className="max-w-3xl mx-auto">
              <ProfilePostsSection
                userId={userId}
                category={activeTab}
                isDark={isDark}
                refreshTrigger={refreshTrigger}
                onPostDeleted={() => setRefreshTrigger(prev => prev + 1)}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Edit Username Modal */}
      {showEditUsernameModal && (
        <EditUsernameModal
          user={user}
          isDark={isDark}
          onClose={() => setShowEditUsernameModal(false)}
          onSave={handleEditUsername}
        />
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <EditProfileModal
          user={user}
          isDark={isDark}
          onClose={() => setShowEditProfileModal(false)}
          onSave={handleEditProfile}
        />
      )}
    </div>
  );
}
