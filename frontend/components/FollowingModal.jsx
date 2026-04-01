'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, API_ENDPOINTS, getAccessToken } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';

export default function FollowingModal({ userId, isOpen, onClose, username }) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [following, setFollowing] = useState([]);
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
      fetchFollowing();
    }
  }, [isOpen, userId]);

  const fetchFollowing = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch following list
      const response = await apiRequest(`${API_ENDPOINTS.GET_FOLLOWING(userId)}`, {
        method: 'GET',
      });

      if (response?.following) {
        setFollowing(response.following);
        // Initialize following map
        const followingStatus = {};
        response.following.forEach(user => {
          followingStatus[user.user_id] = user.is_following || false;
        });
        setFollowingMap(followingStatus);
      }
    } catch (err) {
      console.error('Error fetching following:', err);
      setError('Failed to load following list');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (followUserId) => {
    try {
      await apiRequest(`${API_ENDPOINTS.FOLLOW_USER(followUserId)}`, {
        method: 'POST',
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
      await apiRequest(`${API_ENDPOINTS.UNFOLLOW_USER(followUserId)}`, {
        method: 'DELETE',
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
            Following
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
          {username} is following these accounts.
        </div>

        {/* Following List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            </div>
          ) : error ? (
            <div className={`text-center py-8 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {error}
            </div>
          ) : following.length === 0 ? (
            <div className={`text-center py-8 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Not following anyone yet
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
              {following.map(user => (
                <div
                  key={user.user_id}
                  className={`flex items-center justify-between p-4 hover:${isDark ? 'bg-gray-800' : 'bg-gray-50'} transition-colors`}
                >
                  {/* User Info - Clickable */}
                  <div 
                    onClick={() => handleUserClick(user.user_id)}
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-75 transition-opacity"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    {/* Username and Name */}
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-black'} truncate`}>
                        {user.username}
                      </p>
                      {user.name && (
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                          {user.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Follow Button - Only show if not current user */}
                  {currentUserId !== user.user_id && (
                    <button
                      onClick={() => {
                        if (followingMap[user.user_id]) {
                          handleUnfollow(user.user_id);
                        } else {
                          handleFollow(user.user_id);
                        }
                      }}
                      className={`ml-3 px-6 py-2 rounded-lg font-semibold text-sm transition-all flex-shrink-0 ${
                        followingMap[user.user_id]
                          ? isDark
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                          : isDark
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {followingMap[user.user_id] ? 'Following' : 'Follow'}
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
