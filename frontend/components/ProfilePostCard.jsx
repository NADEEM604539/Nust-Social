'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest, API_ENDPOINTS, getAccessToken } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';

export default function PostCard({ post, isDark, onDeleted, showComments = true }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const token = getAccessToken();
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(decodedToken.sub || decodedToken.user_id);
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }
  }, [token]);

  const isOwner = currentUserId === post.user_id;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await apiRequest(`${API_ENDPOINTS.POSTS}/${post.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowDeleteConfirm(false);
      if (onDeleted) {
        onDeleted();
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryBadge = () => {
    if (post.type === 'CONFESSION') return '🤐 Confession';
    if (post.type === 'RUMOR') return '🗣️ Rumor';
    return null;
  };

  const getUserDisplay = () => {
    if (post.is_anonymous) {
      return `🔒 ${post.encrypted_name?.substring(0, 8) || 'Anonymous'}`;
    }
    return post.username || 'User';
  };

  return (
    <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
            {getUserDisplay().charAt(0).toUpperCase()}
          </div>
          <div>
            {post.is_anonymous ? (
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                {getUserDisplay()}
              </p>
            ) : (
              <Link
                href={`/user/profile/${post.user_id}`}
                className="font-semibold hover:underline"
              >
                <p className={isDark ? 'text-white hover:text-pink-400' : 'text-black hover:text-pink-600'}>
                  {post.username}
                </p>
              </Link>
            )}
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className={`text-xl ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
            >
              •••
            </button>
            
            {showDeleteConfirm && (
              <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`w-full px-4 py-2 text-left text-red-500 hover:bg-red-500/20 rounded-lg ${
                    isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Post'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Badge */}
      {getCategoryBadge() && (
        <div className="px-4 pb-2">
          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
            isDark ? 'bg-purple-900/50 text-purple-200' : 'bg-purple-100 text-purple-700'
          }`}>
            {getCategoryBadge()}
          </span>
        </div>
      )}

      {/* Post Content */}
      <div className="px-4 py-2">
        <p className={`text-base leading-relaxed ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          {post.content}
        </p>
      </div>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div className={`mt-4 max-h-96 overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          {post.media[0]?.type === 'image' ? (
            <img
              src={post.media[0]?.url}
              alt="Post media"
              className="w-full h-auto object-cover"
            />
          ) : (
            <video
              src={post.media[0]?.url}
              controls
              className="w-full h-auto object-cover"
            />
          )}
        </div>
      )}

      {/* Post Stats */}
      <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex gap-6 text-sm">
          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            ❤️ {post.stats?.likes_count || 0} likes
          </span>
          {showComments && (
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              💬 {post.stats?.comments_count || 0} comments
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
