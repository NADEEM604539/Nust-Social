'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PostCard from './PostCard';
import { apiRequest, API_ENDPOINTS, getUserId } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';

export default function SocietyFeed() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const observerTarget = useRef(null);
  const allPostsRef = useRef([]);
  const currentPageRef = useRef(0);
  const POSTS_PER_PAGE = 10;
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Get current user ID on mount
  useEffect(() => {
    const userId = getUserId();
    setCurrentUserId(userId);
  }, []);

  // Fetch societies and their posts
  const fetchSocietyPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // First, fetch all societies
      console.log('Fetching societies...');
      const societiesResponse = await apiRequest(
        `${API_ENDPOINTS.GET_SOCIETIES}?limit=100&skip=0`,
        { method: 'GET' }
      );

      let societiesData = [];
      if (Array.isArray(societiesResponse?.data)) {
        societiesData = societiesResponse.data;
      } else if (Array.isArray(societiesResponse)) {
        societiesData = societiesResponse;
      }

      console.log(`Found ${societiesData.length} societies`);

      // Fetch posts from all societies
      if (societiesData.length === 0) {
        setLoading(false);
        setPosts([]);
        setHasMore(false);
        return;
      }

      // Fetch posts from each society
      let allPosts = [];
      for (const society of societiesData) {
        try {
          const postsResponse = await apiRequest(
            `${API_ENDPOINTS.GET_SOCIETY_POSTS(society.id)}?limit=100&skip=0`,
            { method: 'GET' }
          );

          let societyPosts = [];
          if (Array.isArray(postsResponse?.data)) {
            societyPosts = postsResponse.data;
          } else if (Array.isArray(postsResponse)) {
            societyPosts = postsResponse;
          }

          // Add society info to each post and map field names
          societyPosts = societyPosts.map((post) => {
            // Ensure we have a unique id for the post
            const postId = post.post_id || post.id || Math.random();
            console.log(`Processing society post:`, { post_id: post.post_id, id: post.id, mapped_id: postId });
            
            return {
              // Core fields - ensure id is set
              id: postId,
              post_id: post.post_id, // Keep original field for reference
              society_id: society.id,
              society_name: society.name,
              
              // User/Author info from post
              user_id: post.user_id,
              username: `${society.name} Post`, // Society post display name
              
              // Post content
              caption: post.caption || post.title || '',
              description: post.description || post.content || '',
              
              // Post metadata
              created_at: post.created_at,
              media_ids: post.media_ids || [],
              
              // Post state
              is_anonymous: false,
              is_owner: post.user_id === currentUserId,
              is_following: false,
              type: post.type || 'SIMPLE_POST',
              
              // Stats
              stats: {
                likes_count: post.likes_count || 0,
                comments_count: 0,
                rumor_true_votes: post.rumor_true_votes || 0,
                rumor_false_votes: post.rumor_false_votes || 0,
              },
              
              // User reactions
              user_reaction: post.user_reaction || null,
              user_vote: post.user_vote || null,
            };
          });

          allPosts = [...allPosts, ...societyPosts];
        } catch (err) {
          console.error(`Error fetching posts for society ${society.id}:`, err);
        }
      }

      // Sort by created_at (newest first)
      allPosts.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB - dateA;
      });

      allPostsRef.current = allPosts;
      currentPageRef.current = 0;

      // Load first page
      const firstPagePosts = allPosts.slice(0, POSTS_PER_PAGE);
      setPosts(firstPagePosts);
      setHasMore(allPosts.length > POSTS_PER_PAGE);
      currentPageRef.current = 1;

      console.log(`Loaded ${firstPagePosts.length} posts`);
    } catch (err) {
      console.error('Error fetching society feed:', err);
      setError('Failed to load society feed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Initial fetch
  useEffect(() => {
    fetchSocietyPosts();
  }, [fetchSocietyPosts]);

  // Handle post deletion
  const handleDelete = async (postId) => {
    try {
      await apiRequest(API_ENDPOINTS.DELETE_POST(postId), {
        method: 'DELETE',
      });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  // Handle reactions
  const handleReact = async (postId, reactionType) => {
    try {
      const endpoint = reactionType === 'UNREACT' 
        ? API_ENDPOINTS.UNLIKE_POST(postId)
        : API_ENDPOINTS.LIKE_POST(postId);
      
      const body = reactionType === 'UNREACT' 
        ? {} 
        : { reaction_type: reactionType };

      await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.error('Error reacting to post:', err);
    }
  };

  // Handle voting on rumor posts
  const handleVote = async (postId, vote) => {
    try {
      if (vote) {
        await apiRequest(API_ENDPOINTS.VOTE_POST(postId), {
          method: 'POST',
          body: JSON.stringify({ vote }),
        });
      } else {
        await apiRequest(API_ENDPOINTS.UNVOTE_POST(postId), {
          method: 'POST',
          body: JSON.stringify({}),
        });
      }
    } catch (err) {
      console.error('Error voting on post:', err);
    }
  };

  // Handle comments
  const handleComment = async (postId) => {
    console.log('Opening comment modal for post:', postId);
    // TODO: Open comment modal
  };

  // Handle follow
  const handleFollow = async (userId) => {
    try {
      await apiRequest(API_ENDPOINTS.FOLLOW_USER(userId), {
        method: 'POST',
      });
    } catch (err) {
      console.error('Error following user:', err);
    }
  };

  // Handle unfollow
  const handleUnfollow = async (userId) => {
    try {
      await apiRequest(API_ENDPOINTS.UNFOLLOW_USER(userId), {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error unfollowing user:', err);
    }
  };

  // Load more posts
  const loadMorePosts = useCallback(() => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    setTimeout(() => {
      const startIdx = currentPageRef.current * POSTS_PER_PAGE;
      const endIdx = startIdx + POSTS_PER_PAGE;
      const newPosts = allPostsRef.current.slice(startIdx, endIdx);
      
      if (newPosts.length > 0) {
        setPosts((prev) => [...prev, ...newPosts]);
        currentPageRef.current += 1;
        setHasMore(endIdx < allPostsRef.current.length);
      } else {
        setHasMore(false);
      }
      setLoadingMore(false);
    }, 500); // Simulate network delay
  }, [loadingMore, hasMore]);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerTarget.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMorePosts();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMorePosts]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`rounded-lg h-96 animate-pulse ${
              isDark ? 'bg-gray-800' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-lg p-4 text-center ${
          isDark
            ? 'bg-red-900/20 border border-red-800 text-red-200'
            : 'bg-red-100 border border-red-300 text-red-700'
        }`}
      >
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div
        className={`rounded-lg p-8 text-center ${
          isDark
            ? 'bg-gray-900 border border-gray-800'
            : 'bg-gray-50 border border-gray-200'
        }`}
      >
        <p
          className={`text-lg font-semibold ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          📭 No posts from societies yet
        </p>
        <p
          className={`mt-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}
        >
          Join some societies to see their posts here!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={`${post.society_id}-${post.id}`}>
          <PostCard
            post={post}
            currentUserId={currentUserId}
            onDelete={handleDelete}
            onReact={handleReact}
            onVote={handleVote}
            onComment={handleComment}
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
          />
        </div>
      ))}

      {/* Infinite scroll trigger */}
      <div ref={observerTarget} className="h-10" />

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center py-4">
          <div
            className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
              isDark ? 'border-blue-400' : 'border-blue-600'
            }`}
          />
        </div>
      )}
    </div>
  );
}
