'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest, API_ENDPOINTS } from '@/utils/api';
import PostCard from './PostCard';
import { useTheme } from '@/context/ThemeContext';

export default function SocietyPostFeed() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all societies
      const societiesResponse = await apiRequest(API_ENDPOINTS.GET_SOCIETIES);
      
      if (!societiesResponse || !Array.isArray(societiesResponse)) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Fetch posts from all societies
      const allPosts = [];
      for (const society of societiesResponse) {
        try {
          const societyPosts = await apiRequest(
            API_ENDPOINTS.GET_SOCIETY_POSTS(society.id)
          );
          if (Array.isArray(societyPosts)) {
            // Add society info to each post
            const postsWithSociety = societyPosts.map(post => ({
              ...post,
              society: society
            }));
            allPosts.push(...postsWithSociety);
          }
        } catch (err) {
          // Skip if error fetching posts from this society
          console.log(`Error fetching posts from society ${society.id}:`, err);
        }
      }

      // Sort by creation date (newest first)
      allPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setPosts(allPosts);
    } catch (err) {
      console.error('Error fetching society posts:', err);
      setError(err.message || 'Failed to load posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(post => post.id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(posts.map(post => (post.id === updatedPost.id ? updatedPost : post)));
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-8 ${isDark ? 'bg-black' : 'bg-white'}`}>
        <div className="text-gray-500">Loading posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex justify-center items-center py-8 ${isDark ? 'bg-black' : 'bg-white'}`}>
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className={`flex flex-col justify-center items-center py-12 ${isDark ? 'bg-black' : 'bg-white'}`}>
        <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <p className="mb-2">No posts to show</p>
          <p className="text-sm">Join some societies to see their posts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onPostDeleted={handlePostDeleted}
          onPostUpdated={handlePostUpdated}
        />
      ))}
    </div>
  );
}
