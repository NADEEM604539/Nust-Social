'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PostCard from './PostCard';
import { apiRequest, API_ENDPOINTS, getAccessToken } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';

export default function PostFeed() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef(null);

  const LIMIT = 10;

  // Fetch posts
  const fetchPosts = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError('');

        const token = getAccessToken();
        const url = `${API_ENDPOINTS.POSTS}?limit=${LIMIT}&offset=${isInitial ? 0 : offset}`;
        
        console.log(`Fetching posts with offset=${isInitial ? 0 : offset}, limit=${LIMIT}`);
        
        const response = await apiRequest(url, {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        console.log('=== API Response ===');
        console.log('Full response:', response);

        // Parse response - the backend returns { message, data: { posts: [...], total, limit, offset, has_more } }
        let newPosts = [];
        
        if (response?.data?.posts && Array.isArray(response.data.posts)) {
          console.log('Using response.data.posts');
          newPosts = response.data.posts;
        } else if (Array.isArray(response?.data)) {
          console.log('Using response.data (array)');
          newPosts = response.data;
        } else if (Array.isArray(response)) {
          console.log('Using response (array)');
          newPosts = response;
        } else {
          console.warn('Unexpected response structure:', response);
        }

        console.log('Fetched posts:', newPosts.length, 'posts');

        // Validate posts have required fields
        const validPosts = newPosts.filter((post) => {
          if (!post?.id) {
            console.warn('Post missing id:', post);
            return false;
          }
          if (!post?.stats) {
            post.stats = { likes_count: 0, comments_count: 0, views_count: 0 };
          }
          if (!post?.created_at) {
            post.created_at = new Date().toISOString();
          }
          if (!post?.username && post?.is_anonymous) {
            post.username = null;
          }
          return true;
        });

        console.log('Valid posts after filtering:', validPosts.length);

        if (isInitial) {
          setPosts(validPosts);
          setOffset(LIMIT);
        } else {
          setPosts((prev) => [...prev, ...validPosts]);
          setOffset((prev) => prev + LIMIT);
        }

        // Check if more posts available
        setHasMore(validPosts.length === LIMIT);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError(err.message || 'Failed to load posts. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [offset, LIMIT]
  );

  // Initial fetch
  useEffect(() => {
    fetchPosts(true);
  }, [fetchPosts]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loading &&
          !loadingMore &&
          posts.length > 0
        ) {
          fetchPosts(false);
        }
      },
      { threshold: 0.1, rootMargin: '300px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, loadingMore, posts.length, fetchPosts]);

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const token = getAccessToken();
      if (!token) {
        setError('Please log in to delete posts');
        return;
      }

      await apiRequest(`${API_ENDPOINTS.POSTS}/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      setError(err.message || 'Failed to delete post');
    }
  };

  const handleReact = async (postId, reactionType) => {
    try {
      const token = getAccessToken();
      if (!token) {
        setError('Please log in to react to posts');
        return;
      }

      console.log(`PostFeed: Reacting to post ${postId} with ${reactionType}`);

      // Make API call FIRST
      if (reactionType === 'UNREACT') {
        console.log(`PostFeed: DELETE reaction for post ${postId}`);
        await apiRequest(`${API_ENDPOINTS.POSTS}/${postId}/react`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        console.log(`PostFeed: POST reaction ${reactionType} for post ${postId}`);
        await apiRequest(`${API_ENDPOINTS.POSTS}/${postId}/react`, {
          method: 'POST',
          body: JSON.stringify({ type: reactionType }),
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      
      console.log(`PostFeed: Reaction successful, refreshing posts`);
      
      // THEN refresh the specific post to get accurate state from backend
      const response = await apiRequest(`${API_ENDPOINTS.POSTS}/${postId}`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      console.log(`PostFeed: Got updated post data:`, response);

      if (response && response.id) {
        // Response IS the post object
        const updatedPost = response;
        
        console.log(`PostFeed: Updated post ${postId} with user_reaction: ${updatedPost.user_reaction}, likes: ${updatedPost.stats?.likes_count}`);
        
        // Merge updated reaction/stats with existing post data
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id === postId) {
              // Merge: keep existing data, update reaction and stats
              return {
                ...post,
                ...updatedPost,
                stats: updatedPost.stats || post.stats,
                user_reaction: updatedPost.user_reaction,
              };
            }
            return post;
          })
        );
      } else {
        console.warn(`PostFeed: Unexpected response format:`, response);
      }
    } catch (err) {
      console.error('Error reacting to post:', err);
      setError(err.message || 'Failed to react to post');
      // On error, refetch to ensure we're in sync
      fetchPosts(true);
    }
  };

  const handleComment = async (postId, content) => {
    try {
      const token = getAccessToken();
      if (!token) {
        setError('Please log in to comment');
        return;
      }

      await apiRequest(`${API_ENDPOINTS.POSTS}/${postId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ content: content, is_anonymous: false }),
        headers: { Authorization: `Bearer ${token}` },
      });

      // Refresh posts to show new comment
      fetchPosts(true);
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err.message || 'Failed to add comment');
    }
  };

  const handleFollow = async (userId) => {
    try {
      const token = getAccessToken();
      if (!token) {
        setError('Please log in to follow users');
        return;
      }

      await apiRequest(`${API_ENDPOINTS.USERS}/${userId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update posts to reflect follow status
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.user_id === userId) {
            return { ...post, is_following: true };
          }
          return post;
        })
      );
    } catch (err) {
      console.error('Error following user:', err);
      setError(err.message || 'Failed to follow user');
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      const token = getAccessToken();
      if (!token) {
        setError('Please log in to unfollow users');
        return;
      }

      await apiRequest(`${API_ENDPOINTS.USERS}/${userId}/follow`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update posts to reflect follow status
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.user_id === userId) {
            return { ...post, is_following: false };
          }
          return post;
        })
      );
    } catch (err) {
      console.error('Error unfollowing user:', err);
      setError(err.message || 'Failed to unfollow user');
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Error Message */}
      {error && (
        <div
          className={`rounded-lg p-4 text-sm font-medium ${
            isDark
              ? 'bg-red-900/20 border border-red-800 text-red-300'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && posts.length === 0 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`rounded-lg animate-pulse ${
                isDark ? 'bg-gray-800' : 'bg-gray-200'
              } h-96`}
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div
          className={`rounded-lg p-8 text-center ${
            isDark ? 'bg-gray-900' : 'bg-gray-100'
          }`}
        >
          <p className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            No posts to show
          </p>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Follow some users to see their posts
          </p>
        </div>
      ) : (
        <>
          {/* Posts Grid */}
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handleDelete}
              onReact={handleReact}
              onComment={handleComment}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
            />
          ))}

          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 rounded-full border-4 border-transparent border-t-pink-500 border-r-pink-500 animate-spin" />
            </div>
          )}

          {/* Infinite Scroll Target */}
          <div ref={observerTarget} className="h-4" />

          {/* No More Posts Message */}
          {!hasMore && posts.length > 0 && (
            <div
              className={`rounded-lg p-8 text-center ${
                isDark ? 'bg-gray-900' : 'bg-gray-100'
              }`}
            >
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                You've reached the end of the feed
              </p>
            </div>
          )}
        </>  
      )}
    </div>
  );
}
