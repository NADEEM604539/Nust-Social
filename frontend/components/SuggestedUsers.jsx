'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest, API_ENDPOINTS, getAccessToken } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';

export default function SuggestedUsers() {
  const { isDark } = useTheme();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState(new Set());

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        const token = getAccessToken();

        if (!token) {
          setLoading(false);
          return;
        }

        const response = await apiRequest(
          `${API_ENDPOINTS.GET_SUGGESTIONS}?limit=5&offset=0`,
          {
            method: 'GET',
          }
        );

        console.log('Suggestions response:', response);

        if (response?.data) {
          setSuggestions(response.data);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  const handleFollow = async (userId) => {
    try {
      await apiRequest(`${API_ENDPOINTS.FOLLOW_USER(userId)}`, {
        method: 'POST',
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
          Suggested For You
        </h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex-shrink-0 ${
                    isDark ? 'bg-gray-800' : 'bg-gray-300'
                  }`}
                />
                <div className="flex flex-col flex-1 gap-2">
                  <div
                    className={`h-3 rounded flex-1 ${
                      isDark ? 'bg-gray-800' : 'bg-gray-300'
                    }`}
                  />
                  <div
                    className={`h-2 w-20 rounded ${
                      isDark ? 'bg-gray-800' : 'bg-gray-300'
                    }`}
                  />
                </div>
              </div>
              <div
                className={`h-8 w-16 rounded ${
                  isDark ? 'bg-gray-800' : 'bg-gray-300'
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
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
        Suggested For You
      </h2>

      {suggestions.length === 0 ? (
        <p className={`text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          No more suggestions
        </p>
      ) : (
        <div className="space-y-3">
          {suggestions.map((user) => (
            <div
              key={user.id}
              className={`flex items-center justify-between gap-3 p-2 rounded transition-all duration-200 ${
                isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
            >
              <Link href={`/user/profile/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <p className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-black'}`}>
                    {user.username}
                  </p>
                  <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    {user.department && user.batch_year ? `${user.department} '${String(user.batch_year).slice(-2)}` : 'NUST'}
                  </p>
                </div>
              </Link>

              {!followingIds.has(user.id) ? (
                <button
                  onClick={() => handleFollow(user.id)}
                  className="px-3 py-1 text-xs font-semibold rounded-full bg-pink-600 text-white hover:bg-pink-700 transition-colors flex-shrink-0"
                >
                  Follow
                </button>
              ) : (
                <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${
                  isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-700'
                }`}>
                  Following
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* See More Button */}
      {suggestions.length > 0 && (
        <Link
          href="/suggestions"
          className={`mt-4 w-full px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            isDark
              ? 'bg-gray-800 text-blue-400 hover:bg-gray-700 border border-gray-700'
              : 'bg-gray-200 text-blue-600 hover:bg-gray-300 border border-gray-300'
          }`}
        >
          👁️ See All Suggestions
        </Link>
      )}
    </div>
  );
}
