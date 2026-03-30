'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PostCard from '@/components/PostCard';
import { apiRequest, API_ENDPOINTS, getAccessToken } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';

export default function UserProfilePage() {
  const { isDark } = useTheme();
  const params = useParams();
  const userId = params.id;
  
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError('');
        
        const token = getAccessToken();
        
        // Fetch user profile
        const userResponse = await apiRequest(
          `${API_ENDPOINTS.USERS}/profile/${userId}`,
          {
            method: 'GET',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        
        if (userResponse?.data) {
          setUser(userResponse.data);
        }
        
        // Fetch user's posts
        const postsResponse = await apiRequest(API_ENDPOINTS.POSTS, {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (postsResponse?.data?.posts) {
          // Filter posts by user_id
          const userPosts = postsResponse.data.posts.filter(post => post.user_id === parseInt(userId));
          setPosts(userPosts);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const handleDeletePost = async (postId) => {
    // Placeholder for post deletion
    console.log('Delete post:', postId);
  };

  const handleReactPost = async (postId, reactionType) => {
    // Placeholder for post reaction
    console.log('React to post:', postId, reactionType);
  };

  const handleCommentPost = async (postId, content) => {
    // Placeholder for adding comment
    console.log('Comment on post:', postId, content);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
            {error}
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
    <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Profile Header */}
      <div className={`border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/"
            className={`mb-4 inline-flex items-center gap-2 text-sm font-medium hover:underline ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}
          >
            ← Back home
          </Link>
          
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {user?.encrypted_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            
            {/* User Info */}
            <div>
              <h1 className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
                {user?.encrypted_name || 'Unknown User'}
              </h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {posts.length} post{posts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No posts yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={handleDeletePost}
                onReact={handleReactPost}
                onComment={handleCommentPost}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
