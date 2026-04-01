'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PostCard from './PostCard';
import { apiRequest, API_ENDPOINTS, getUserId } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';

export default function PostFeed() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const observerTarget = useRef(null);
  const offsetRef = useRef(0);

  const LIMIT = 10;

  // Get current user ID on mount
  useEffect(() => {
    const userId = getUserId();
    setCurrentUserId(userId);
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) {
          setLoading(true);
          offsetRef.current = 0;
        } else {
          setLoadingMore(true);
        }
        setError('');

        const fetchOffset = isInitial ? 0 : offsetRef.current;
        const url = `${API_ENDPOINTS.GET_FEED}?limit=${LIMIT}&offset=${fetchOffset}`;
        
        console.log(`Fetching posts with offset=${fetchOffset}, limit=${LIMIT}`);
        
        // apiRequest automatically handles token management and refresh on 401
        const response = await apiRequest(url, {
          method: 'GET',
        });

        console.log('=== API Response ===');
        console.log('Full response:', response);

        // Parse response - the backend returns { message, data: { posts: [...], total, limit, offset, has_more } }
        let newPosts = [];
        let responseHasMore = false;
        
        if (response?.data?.posts && Array.isArray(response.data.posts)) {
          console.log('Using response.data.posts');
          newPosts = response.data.posts;
          responseHasMore = response.data.has_more || false;
        } else if (Array.isArray(response?.data)) {
          console.log('Using response.data (array)');
          newPosts = response.data;
        } else if (Array.isArray(response)) {
          console.log('Using response (array)');
          newPosts = response;
        } else {
          console.warn('Unexpected response structure:', response);
        }

        console.log(`Fetched posts: ${newPosts.length} posts, has_more: ${responseHasMore}`);

        // If no posts returned, we've reached the end
        if (newPosts.length === 0) {
          console.log('No more posts available - reached end of feed');
          setHasMore(false);
          return;
        }

        // Validate posts have required fields
        const validPosts = newPosts.filter((post) => {
          // Normalize field names (handle both user posts and society posts)
          if (post.post_id && !post.id) {
            post.id = post.post_id; // Map post_id to id for society posts
          }
          
          if (!post?.id) {
            console.warn('Post missing id:', post);
            return false;
          }
          
          if (!post?.stats) {
            post.stats = { 
              likes_count: 0, 
              comments_count: 0, 
              views_count: 0,
              rumor_true_votes: 0,
              rumor_false_votes: 0,
            };
          }
          
          if (!post?.created_at) {
            post.created_at = new Date().toISOString();
          }
          
          if (!post?.username && post?.is_anonymous) {
            post.username = null;
          }
          
          // Set is_owner for society posts
          if (post.society_id && !post.hasOwnProperty('is_owner')) {
            post.is_owner = post.user_id === currentUserId;
          }
          
          return true;
        });

        console.log('Valid posts after filtering:', validPosts.length);

        if (isInitial) {
          setPosts(validPosts);
          offsetRef.current = LIMIT;
          setOffset(LIMIT);
          // Use backend's has_more flag instead of calculating it
          setHasMore(responseHasMore);
        } else {
          // Add safeguard to prevent duplicate posts
          setPosts((prev) => {
            const existingIds = new Set(prev.map(p => p.id));
            const newPostsFiltered = validPosts.filter(p => !existingIds.has(p.id));
            
            if (newPostsFiltered.length !== validPosts.length) {
              console.warn(`Prevented ${validPosts.length - newPostsFiltered.length} duplicate posts from being added`);
            }
            
            return [...prev, ...newPostsFiltered];
          });
          offsetRef.current += LIMIT;
          setOffset((prev) => prev + LIMIT);
          // Use backend's has_more flag instead of calculating it
          setHasMore(responseHasMore);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError(err.message || 'Failed to load posts. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [LIMIT]
  );

  // Initial fetch
  useEffect(() => {
    fetchPosts(true);
  }, []);

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
          console.log('Infinite scroll triggered: fetching more posts');
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
  }, [hasMore, loading, loadingMore, fetchPosts]);

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await apiRequest(`${API_ENDPOINTS.DELETE_POST(postId)}`, {
        method: 'DELETE',
      });

      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      setError(err.message || 'Failed to delete post');
    }
  };

  const handleReact = async (postId, reactionType) => {
    try {
      console.log(`PostFeed: Reacting to post ${postId} with ${reactionType}`);

      // Make API call FIRST - apiRequest handles token refresh on 401
      if (reactionType === 'UNREACT') {
        console.log(`PostFeed: DELETE reaction for post ${postId}`);
        await apiRequest(`${API_ENDPOINTS.UNLIKE_POST(postId)}`, {
          method: 'DELETE',
        });
      } else {
        console.log(`PostFeed: POST reaction ${reactionType} for post ${postId}`);
        await apiRequest(`${API_ENDPOINTS.LIKE_POST(postId)}`, {
          method: 'POST',
          body: JSON.stringify({ type: reactionType }),
        });
      }
      
      console.log(`PostFeed: Reaction successful, refreshing posts`);
      
      // THEN refresh the specific post to get accurate state from backend
      const response = await apiRequest(`${API_ENDPOINTS.GET_POST(postId)}`, {
        method: 'GET',
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
      // apiRequest handles token refresh automatically on 401
      await apiRequest(`${API_ENDPOINTS.CREATE_COMMENT(postId)}`, {
        method: 'POST',
        body: JSON.stringify({ content: content, is_anonymous: false }),
      });

      // Refresh posts to show new comment
      fetchPosts(true);
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err.message || 'Failed to add comment');
    }
  };

  const handleVote = async (postId) => {
    try {
      console.log(`PostFeed: Voting on post ${postId}, refreshing post data`);

      // Refresh the specific post to get accurate vote counts from backend
      // apiRequest handles token refresh automatically on 401
      const response = await apiRequest(`${API_ENDPOINTS.GET_POST(postId)}`, {
        method: 'GET',
      });

      console.log(`PostFeed: Got updated post data after vote:`, response);

      if (response && response.id) {
        const updatedPost = response;
        
        console.log(`PostFeed: Updated post ${postId} with votes - TRUE: ${updatedPost.stats?.rumor_true_votes}, FALSE: ${updatedPost.stats?.rumor_false_votes}`);
        
        // Merge updated vote counts and user's vote with existing post data
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id === postId) {
              // Merge: keep existing data, update vote and stats
              return {
                ...post,
                ...updatedPost,
                stats: updatedPost.stats || post.stats,
                user_vote: updatedPost.user_vote,
              };
            }
            return post;
          })
        );
      } else {
        console.warn(`PostFeed: Unexpected response format after vote:`, response);
      }
    } catch (err) {
      console.error('Error voting on post:', err);
      setError(err.message || 'Failed to vote on post');
      // On error, refetch to ensure we're in sync
      fetchPosts(true);
    }
  };

  const handleFollow = async (userId) => {
    try {
      // apiRequest handles token refresh automatically on 401
      await apiRequest(`${API_ENDPOINTS.FOLLOW_USER(userId)}`, {
        method: 'POST',
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
      await apiRequest(`${API_ENDPOINTS.UNFOLLOW_USER(userId)}`, {
        method: 'DELETE',
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
              currentUserId={currentUserId}
              onDelete={handleDelete}
              onReact={handleReact}
              onVote={handleVote}
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
