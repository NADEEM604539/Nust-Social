'use client';

import React, { useState, useEffect } from 'react';
import ProfilePostCard from './ProfilePostCard';
import { apiRequest, API_ENDPOINTS, getAccessToken } from '@/utils/api';

export default function ProfilePostsSection({ userId, category, isDark, refreshTrigger, onPostDeleted }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handlePostUpdated = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError('');
        const token = getAccessToken();

        // Fetch all user's posts
        const response = await apiRequest(API_ENDPOINTS.POSTS, {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        console.log('API Response:', response); // Debug

        // Handle response structure
        const allPosts = response?.data?.posts || [];
        console.log('All posts:', allPosts.length, allPosts); // Debug

        // Filter by user first
        let userPosts = allPosts.filter(post => {
          // Include posts where user_id matches OR anonymous posts where user is owner
          return post.user_id === userId || (post.is_anonymous && post.is_owner);
        });
        console.log(`Posts for user ${userId}:`, userPosts.length, userPosts); // Debug

        // Helper to check if anonymous (handle both boolean and integer)
        const isAnonymous = (post) => post.is_anonymous === true || post.is_anonymous === 1;
        const isNotAnonymous = (post) => post.is_anonymous === false || post.is_anonymous === 0;

        // Then filter by category (and exclude SOCIETY_POST from all)
        let filteredPosts = [];
        
        if (category === 'posts') {
          // Posts Tab: Non-anonymous SIMPLE_POST only (excludes SOCIETY_POST automatically)
          filteredPosts = userPosts.filter(
            post => isNotAnonymous(post) && post.type === 'SIMPLE_POST'
          );
          console.log('Posts (SIMPLE_POST, non-anonymous):', filteredPosts.length, filteredPosts);
        } else if (category === 'confessions') {
          // Confessions Tab: Non-anonymous CONFESSION or RUMOR (excludes SOCIETY_POST automatically)
          filteredPosts = userPosts.filter(
            post => isNotAnonymous(post) && (post.type === 'CONFESSION' || post.type === 'RUMOR')
          );
          console.log('Confessions (CONFESSION/RUMOR, non-anonymous):', filteredPosts.length, filteredPosts);
        } else if (category === 'anonymous') {
          // Anonymous Tab: ALL anonymous posts except SOCIETY_POST
          filteredPosts = userPosts.filter(post => isAnonymous(post) && post.type !== 'SOCIETY_POST');
          console.log('Anonymous (is_anonymous=true, exclude SOCIETY_POST):', filteredPosts.length, filteredPosts);
        }

        console.log('Final filtered posts:', filteredPosts); // Debug

        setPosts(filteredPosts);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError(`Failed to load posts: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchPosts();
    }
  }, [userId, category, refreshTrigger]);

  if (loading) {
    return (
      <div className={`py-12 text-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-3"></div>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`py-12 text-center`}>
        <p className={isDark ? 'text-red-400' : 'text-red-600'}>{error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    const emptyMessages = {
      posts: 'No posts yet',
      confessions: 'No confessions or rumors yet',
      anonymous: 'No anonymous posts yet',
    };

    return (
      <div className={`py-16 text-center`}>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {emptyMessages[category]}
        </p>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-6">
      {posts.map(post => (
        <div key={post.id} className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} pb-6 last:border-b-0`}>
          <ProfilePostCard
            post={post}
            isDark={isDark}
            onDeleted={onPostDeleted}
            onPostUpdated={handlePostUpdated}
            showComments={false}
          />
        </div>
      ))}
    </div>
  );
}
