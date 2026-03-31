'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { apiRequest, API_ENDPOINTS, getAccessToken } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';

export default function SuggestionsPage() {
  const { isDark } = useTheme();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [followingIds, setFollowingIds] = useState(new Set());

  const LIMIT = 10;

  // Initial fetch
  useEffect(() => {
    fetchSuggestions(true);
  }, []);

  const fetchSuggestions = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const token = getAccessToken();

      if (!token) {
        // Redirect to login if not authenticated
        window.location.href = '/auth/login';
        return;
      }

      const currentOffset = isInitial ? 0 : offset;
      const url = `${API_ENDPOINTS.USERS}/suggestions/recommended?limit=${LIMIT}&offset=${currentOffset}`;

      console.log(`Fetching suggestions: offset=${currentOffset}, limit=${LIMIT}`);

      const response = await apiRequest(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Suggestions response:', response);

      const newSuggestions = response?.data || [];

      if (isInitial) {
        setSuggestions(newSuggestions);
        setOffset(LIMIT);
      } else {
        setSuggestions((prev) => [...prev, ...newSuggestions]);
        setOffset((prev) => prev + LIMIT);
      }

      // Check if more suggestions available
      setHasMore(newSuggestions.length === LIMIT);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const token = getAccessToken();
      if (!token) return;

      await apiRequest(`${API_ENDPOINTS.USERS}/${userId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      setFollowingIds((prev) => new Set([...prev, userId]));
      // Remove from suggestions after following
      setSuggestions((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error('Error following user:', err);
    }
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen ${isDark ? 'bg-black' : 'bg-white'}`}>
        <Navigation />
        <main className="w-full pt-16 md:pt-0">
          <div className="flex justify-center">
            <div className="w-full max-w-2xl px-4 py-8">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading suggestions...</p>
                </div>
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

      {/* Main Content */}
      <main className="w-full pt-16 md:pt-0">
        <div className="flex justify-center">
          <div className="w-full max-w-2xl px-4 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Link
                  href="/"
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-black'
                  }`}
                >
                  ← Back
                </Link>
              </div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                Discover People
              </h1>
              <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Connect with people from your batch, department, and interests
              </p>
            </div>

            {/* Suggestions Grid */}
            {suggestions.length === 0 ? (
              <div className="text-center py-12">
                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  No more suggestions available
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {suggestions.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between gap-4 p-4 rounded-lg border transition-all duration-200 ${
                      isDark
                        ? 'bg-gray-900 border-gray-800 hover:border-pink-600'
                        : 'bg-white border-gray-200 hover:border-pink-600'
                    }`}
                  >
                    {/* User Info */}
                    <Link
                      href={`/user/profile/${user.id}`}
                      className="flex items-center gap-4 flex-1 min-w-0"
                    >
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {user.username?.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-lg truncate ${isDark ? 'text-white' : 'text-black'}`}>
                          {user.name || user.username}
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                          @{user.username}
                        </p>

                        {/* Department & Batch */}
                        {(user.department || user.batch_year) && (
                          <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {user.department && <span>{user.department}</span>}
                            {user.department && user.batch_year && <span> • </span>}
                            {user.batch_year && <span>Batch '{String(user.batch_year).slice(-2)}</span>}
                          </div>
                        )}

                        {/* Bio */}
                        {user.bio && (
                          <p className={`text-sm mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                            {user.bio}
                          </p>
                        )}

                        {/* Stats */}
                        <div className={`flex gap-3 mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                          <span>📝 {user.post_count || 0} posts</span>
                          <span>👥 {user.follower_count || 0} followers</span>
                        </div>
                      </div>
                    </Link>

                    {/* Follow Button */}
                    <div className="flex-shrink-0">
                      {!followingIds.has(user.id) ? (
                        <button
                          onClick={() => handleFollow(user.id)}
                          className="px-6 py-2 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition-colors"
                        >
                          Follow
                        </button>
                      ) : (
                        <span className={`px-6 py-2 rounded-lg font-semibold inline-block ${
                          isDark
                            ? 'bg-gray-800 text-gray-400'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          Following
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && suggestions.length > 0 && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => fetchSuggestions(false)}
                  disabled={loadingMore}
                  className={`px-6 py-3 font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    isDark
                      ? 'bg-gray-900 text-pink-400 hover:bg-pink-600/20 border border-gray-700 hover:border-pink-600'
                      : 'bg-gray-100 text-pink-600 hover:bg-pink-600/10 border border-gray-300 hover:border-pink-600'
                  } ${loadingMore ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      📥 Load More Suggestions
                    </>
                  )}
                </button>
              </div>
            )}

            {!hasMore && suggestions.length > 0 && (
              <div className="mt-8 text-center">
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  You've seen all available suggestions
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
