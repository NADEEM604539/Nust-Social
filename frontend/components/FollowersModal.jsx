'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, API_ENDPOINTS, getAccessToken } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';

export default function FollowersModal({ userId, isOpen, onClose, username }) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [followingMap, setFollowingMap] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    if (isOpen && userId) {
      // Extract current user ID from token
      const token = getAccessToken();
      if (token) {
        try {
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          const currUserId = decodedToken.sub || decodedToken.user_id;
          setCurrentUserId(currUserId);
        } catch (e) {
          console.error('Error decoding token:', e);
        }
      }
      fetchFollowers();
    }
  }, [isOpen, userId]);

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAccessToken();
      
      // Fetch followers list
      const response = await apiRequest(`${API_ENDPOINTS.USERS}/${userId}/followers`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response?.followers) {
        setFollowers(response.followers);
        // Initialize following map
        const following = {};
        response.followers.forEach(follower => {
          following[follower.user_id] = follower.is_following || false;
        });
        setFollowingMap(following);
      }
    } catch (err) {
      console.error('Error fetching followers:', err);
      setError('Failed to load followers');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (followUserId) => {
    try {
      const token = getAccessToken();
      if (!token) {
        setError('Please log in');
        return;
      }

      await apiRequest(`${API_ENDPOINTS.USERS}/${followUserId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      setFollowingMap(prev => ({
        ...prev,
        [followUserId]: true
      }));
    } catch (err) {
      console.error('Error following user:', err);
      setError('Failed to follow');
    }
  };

  const handleUnfollow = async (followUserId) => {
    try {
      const token = getAccessToken();
      if (!token) {
        setError('Please log in');
        return;
      }

      await apiRequest(`${API_ENDPOINTS.USERS}/${followUserId}/follow`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      setFollowingMap(prev => ({
        ...prev,
        [followUserId]: false
      }));
    } catch (err) {
      console.error('Error unfollowing user:', err);
      setError('Failed to unfollow');
    }
  };

  const handleUserClick = (followerUserId) => {
    if (currentUserId === followerUserId) {
      router.push('/profile');
    } else {
      router.push(`/user/profile/${followerUserId}`);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* Modal Container */}
      <div className={`w-full max-w-sm mx-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-white'} flex flex-col max-h-screen md:max-h-96`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
            Followers
          </h2>
          <button
            onClick={onClose}
            className={`text-2xl font-bold hover:opacity-70 transition-opacity ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
          >
            ✕
          </button>
        </div>

        {/* Info Message */}
        <div className={`px-4 py-3 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Only {username} can see all followers.
        </div>

        {/* Followers List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            </div>
          ) : error ? (
            <div className={`text-center py-8 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {error}
            </div>
          ) : followers.length === 0 ? (
            <div className={`text-center py-8 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No followers yet
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
              {followers.map(follower => (
                <div
                  key={follower.user_id}
                  className={`flex items-center justify-between p-4 hover:${isDark ? 'bg-gray-800' : 'bg-gray-50'} transition-colors`}
                >
                  {/* User Info - Clickable */}
                  <div 
                    onClick={() => handleUserClick(follower.user_id)}
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-75 transition-opacity"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {follower.username?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    {/* Username and Name */}
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-black'} truncate`}>
                        {follower.username}
                      </p>
                      {follower.name && (
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                          {follower.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Follow Button - Only show if not current user */}
                  {currentUserId !== follower.user_id && (
                    <button
                      onClick={() => {
                        if (followingMap[follower.user_id]) {
                          handleUnfollow(follower.user_id);
                        } else {
                          handleFollow(follower.user_id);
                        }
                      }}
                      className={`ml-3 px-6 py-2 rounded-lg font-semibold text-sm transition-all flex-shrink-0 ${
                        followingMap[follower.user_id]
                          ? isDark
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                          : isDark
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {followingMap[follower.user_id] ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
