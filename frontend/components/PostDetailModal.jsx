'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MediaCarousel from '@/components/MediaCarousel';
import { apiRequest, API_ENDPOINTS, getAccessToken } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';

export default function PostDetailModal({ postId }) {
  const { isDark } = useTheme();
  const router = useRouter();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentReaction, setCurrentReaction] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [isReacting, setIsReacting] = useState(false);
  const [reactionLocked, setReactionLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const postDate = new Date(timestamp);
    
    if (isNaN(postDate.getTime())) return 'Unknown';
    
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return postDate.toLocaleDateString();
  };

  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        setLoading(true);
        setError('');

        const token = getAccessToken();
        console.log('Fetching post with ID:', postId);
        
        try {
          const response = await apiRequest(`${API_ENDPOINTS.POSTS}/${postId}`, {
            method: 'GET',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          console.log('Post Response:', response);

          if (response && response.id) {
            setPost(response);
            setCurrentReaction(response.user_reaction || null);
            setLikeCount(response.stats?.likes_count || 0);
            setIsFollowing(response.is_following || false);
            
            if (response.comments && Array.isArray(response.comments)) {
              setComments(response.comments);
            }
          } else {
            setError('Invalid post data');
          }
        } catch (apiError) {
          // Handle specific API errors
          if (apiError.message.includes('404') || apiError.message.includes('not found')) {
            setError('Post not found. It may have been deleted or is not accessible.');
            // Redirect to home after 2 seconds
            setTimeout(() => {
              router.push('/');
            }, 2000);
          } else if (apiError.message.includes('401') || apiError.message.includes('Unauthorized')) {
            setError('You do not have permission to view this post. Please log in.');
            // Redirect to login after 2 seconds
            setTimeout(() => {
              router.push('/auth/login?redirect=' + encodeURIComponent(`/post/${postId}`));
            }, 2000);
          } else {
            setError(apiError.message || 'Failed to load post');
          }
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError(err.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPostDetails();
    }
  }, [postId]);

  useEffect(() => {
    if (!reactionLocked || lockTimeRemaining <= 0) return;

    const timer = setInterval(() => {
      setLockTimeRemaining((prev) => {
        if (prev <= 0.5) {
          setReactionLocked(false);
          return 0;
        }
        return prev - 0.5;
      });
    }, 500);

    return () => clearInterval(timer);
  }, [reactionLocked, lockTimeRemaining]);

  const handleReaction = async (reactionType) => {
    if (isReacting || reactionLocked || !post) return;

    try {
      setIsReacting(true);

      const token = getAccessToken();
      if (!token) {
        setError('Please log in to react');
        return;
      }

      if (currentReaction === reactionType) {
        setCurrentReaction(null);
        setLikeCount(Math.max(0, likeCount - 1));
        await apiRequest(`${API_ENDPOINTS.POSTS}/${post.id}/react`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        setCurrentReaction(reactionType);
        if (!currentReaction) {
          setLikeCount(likeCount + 1);
        }
        await apiRequest(`${API_ENDPOINTS.POSTS}/${post.id}/react`, {
          method: 'POST',
          body: JSON.stringify({ type: reactionType }),
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setReactionLocked(true);
      setLockTimeRemaining(2.5);
    } catch (error) {
      console.error('Error reacting:', error);
      setError('Failed to react');
      setCurrentReaction(post?.user_reaction || null);
      setLikeCount(post?.stats?.likes_count || 0);
    } finally {
      setIsReacting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !post) return;

    setIsSubmitting(true);
    try {
      const token = getAccessToken();
      if (!token) {
        setError('Please log in to comment');
        return;
      }

      await apiRequest(`${API_ENDPOINTS.POSTS}/${post.id}/comment`, {
        method: 'POST',
        body: JSON.stringify({ 
          content: newComment,
          is_anonymous: false 
        }),
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await apiRequest(`${API_ENDPOINTS.POSTS}/${post.id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response) {
        setPost(response);
        if (response.comments) {
          setComments(response.comments);
        }
      }

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?') || !post) return;

    try {
      const token = getAccessToken();
      if (!token) return;

      await apiRequest(`${API_ENDPOINTS.POSTS}/${post.id}/comment/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment');
    }
  };

  const handleFollow = async () => {
    if (isFollowLoading || !post || post.is_owner || post.is_anonymous) return;

    try {
      setIsFollowLoading(true);
      const token = getAccessToken();
      if (!token) {
        setError('Please log in to follow users');
        return;
      }

      await apiRequest(`${API_ENDPOINTS.USERS}/${post.user_id}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      setIsFollowing(true);
    } catch (error) {
      console.error('Error following user:', error);
      setError('Failed to follow user');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (isFollowLoading || !post || post.is_owner || post.is_anonymous) return;

    try {
      setIsFollowLoading(true);
      const token = getAccessToken();
      if (!token) {
        setError('Please log in to unfollow users');
        return;
      }

      await apiRequest(`${API_ENDPOINTS.USERS}/${post.user_id}/follow`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      setIsFollowing(false);
    } catch (error) {
      console.error('Error unfollowing user:', error);
      setError('Failed to unfollow user');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (!post && !loading && error) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={handleClose}>
        <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-lg p-8 max-w-md w-full mx-4`} onClick={(e) => e.stopPropagation()}>
          <div className="text-center">
            <div className="text-5xl mb-4">❌</div>
            <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Post Not Found
            </h2>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {error}
            </p>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Redirecting to home...
            </p>
            <button 
              onClick={handleClose} 
              className="w-full px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold transition-colors"
            >
              Back to Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className={`relative rounded-lg overflow-hidden max-w-7xl w-full max-h-[95vh] overflow-y-auto shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all"
        >
          ✕
        </button>

        {loading ? (
          <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} h-96 flex items-center justify-center`}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-2"></div>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading...</p>
            </div>
          </div>
        ) : post ? (
          <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} grid grid-cols-1 md:grid-cols-2`}>
            <div className={`${isDark ? 'bg-black' : 'bg-gray-100'} flex items-center justify-center h-full`}>
              {post.media && post.media.length > 0 ? (
                <MediaCarousel media={post.media} isDark={isDark} />
              ) : (
                <div className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No media</div>
              )}
            </div>

            <div className="flex flex-col h-full">
              <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} flex items-center gap-3 justify-between`}>
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {post.is_anonymous ? '🔒' : (post.username?.charAt(0) || 'U').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    {post.is_anonymous ? (
                      <p className={`font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        🔒 {post.encrypted_name?.substring(0, 8) || 'Anonymous'}
                      </p>
                    ) : (
                      <Link href={`/user/profile/${post.user_id}`} className={`font-semibold text-sm hover:underline ${isDark ? 'text-white' : 'text-black'}`}>
                        {post.username || 'Unknown'}
                      </Link>
                    )}
                  </div>
                </div>
                {!post.is_owner && post.is_following !== null && (
                  <button
                    onClick={isFollowing ? handleUnfollow : handleFollow}
                    disabled={isFollowLoading}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-all duration-200 whitespace-nowrap mr-10 ${
                      isFollowing
                        ? isDark
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        : isDark
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    } ${isFollowLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isFollowLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>

              <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                {post.caption && (
                  <div className={`text-sm ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    <span className="font-semibold">
                      {post.is_anonymous ? post.encrypted_name?.substring(0, 8) || 'Anonymous' : post.username || 'Unknown'}
                    </span>
                    {' '}
                    {post.caption}
                  </div>
                )}
                {post.description && (
                  <div className={`text-sm mt-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {post.description}
                  </div>
                )}
                {post.tags && post.tags.length > 0 && (
                  <div className={`text-sm mt-2 ${isDark ? 'text-blue-400' : 'text-blue-600'} space-x-2`}>
                    {post.tags.map((tag) => (
                      <Link key={tag} href={`/explore?tag=${tag}`} className="hover:underline">
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}
                <p className={`text-xs mt-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {getTimeAgo(post.created_at)}
                </p>
              </div>

              <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="flex gap-4 mb-3">
                  <div className="relative">
                    <button
                      onClick={() => handleReaction('LIKE')}
                      disabled={reactionLocked}
                      className={`text-xl transition-all duration-200 ${
                        reactionLocked
                          ? 'opacity-50 cursor-not-allowed'
                          : currentReaction === 'LIKE'
                          ? 'text-red-500 hover:scale-110'
                          : isDark
                          ? 'text-gray-400 hover:text-white'
                          : 'text-gray-600 hover:text-black'
                      }`}
                      title={reactionLocked ? `Wait ${lockTimeRemaining.toFixed(1)}s` : 'Like'}
                    >
                      {currentReaction === 'LIKE' ? '❤️' : '🤍'}
                    </button>
                    {reactionLocked && (
                      <div className="absolute -top-6 -right-2 bg-black text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                        {lockTimeRemaining.toFixed(1)}s
                      </div>
                    )}
                  </div>
                  <button className={`text-xl transition-all duration-200 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>💬</button>
                  <button className={`text-xl transition-all duration-200 ml-auto ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>📌</button>
                </div>
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  {likeCount} like{likeCount !== 1 ? 's' : ''}
                </p>
              </div>

              <div className={`flex-1 overflow-y-auto px-4 py-3 space-y-3 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <h3 className={`font-semibold text-sm sticky top-0 ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-black'} py-2`}>
                  Comments ({comments.length})
                </h3>
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="text-xs">
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {comment.author?.username?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              {comment.is_anonymous ? (
                                <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  🔒 {comment.encrypted_name?.substring(0, 8)}
                                </p>
                              ) : (
                                <Link href={`/user/profile/${comment.author?.id}`} className={`font-semibold hover:underline ${isDark ? 'text-white' : 'text-black'}`}>
                                  {comment.author?.username || 'Unknown'}
                                </Link>
                              )}
                              <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>{comment.content}</p>
                              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{getTimeAgo(comment.created_at)}</p>
                            </div>
                            {comment.is_owner && (
                              <button onClick={() => handleDeleteComment(comment.id)} className="text-red-500 hover:text-red-600">✕</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No comments yet</p>
                )}
              </div>

              <form onSubmit={handleAddComment} className={`px-4 py-3 border-t ${isDark ? 'border-gray-800 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add comment..."
                    className={`flex-1 px-3 py-2 rounded text-xs transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      isDark
                        ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border border-gray-300 text-black placeholder-gray-500'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className={`px-3 py-2 rounded text-xs font-semibold text-white transition-all ${
                      isSubmitting || !newComment.trim()
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} p-6 text-center`}>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Post not found</p>
          </div>
        )}
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
          {error}
        </div>
      )}
    </div>
  );
}
