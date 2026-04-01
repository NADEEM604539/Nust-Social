'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, API_ENDPOINTS, getAccessToken } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';

export default function ProfilePostCard({ post, isDark, onDeleted, showComments = true, onPostUpdated }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption || '');
  const [editDescription, setEditDescription] = useState(post.description || '');
  const [userVote, setUserVote] = useState(post.user_vote || null);
  const [trueVotes, setTrueVotes] = useState(post.stats?.rumor_true_votes || 0);
  const [falseVotes, setFalseVotes] = useState(post.stats?.rumor_false_votes || 0);
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteLocked, setVoteLocked] = useState(false);
  const [voteLockTimeRemaining, setVoteLockTimeRemaining] = useState(0);
  const token = getAccessToken();
  const router = useRouter();
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

  // Countdown timer for vote lock
  useEffect(() => {
    if (!voteLocked || voteLockTimeRemaining <= 0) return;

    const timer = setInterval(() => {
      setVoteLockTimeRemaining((prev) => {
        if (prev <= 0.5) {
          setVoteLocked(false);
          return 0;
        }
        return prev - 0.5;
      });
    }, 500);

    return () => clearInterval(timer);
  }, [voteLocked, voteLockTimeRemaining]);

  const isOwner = currentUserId === post.user_id || (post.is_anonymous && post.is_owner);

  const handlePostClick = (e) => {
    // Don't navigate if clicking on menu or interactive elements
    if (e.target.closest('[data-no-navigate]')) {
      return;
    }
    router.push(`/post/${post.id}`);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      // apiRequest handles token refresh automatically on 401
      await apiRequest(`${API_ENDPOINTS.DELETE_POST(post.id)}`, {
        method: 'DELETE',
      });
      setShowDeleteConfirm(false);
      setShowMenu(false);
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

  const handleSaveEdit = async () => {
    if (!editCaption.trim() && !editDescription.trim()) {
      alert('Post must have either caption or description');
      return;
    }

    try {
      setIsUpdating(true);
      const response = await apiRequest(`${API_ENDPOINTS.UPDATE_POST(post.id)}`, {
        method: 'PUT',
        body: JSON.stringify({
          caption: editCaption,
          description: editDescription,
        }),
      });

      // Update the post data
      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          caption: editCaption,
          description: editDescription,
        });
      }

      setShowEditModal(false);
      setShowMenu(false);
      alert('Post updated successfully');
    } catch (err) {
      console.error('Error updating post:', err);
      alert(err.message || 'Failed to update post');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRumorVote = async (voteType) => {
    // Prevent multiple simultaneous requests or while locked
    if (voteLoading || voteLocked || post.type !== 'RUMOR') {
      console.log(`Vote locked or already voting, ignoring click`);
      return;
    }

    try {
      setVoteLoading(true);
      console.log(`ProfilePostCard[${post.id}]: Voting ${voteType}, current vote: ${userVote}`);

      // Store previous state for potential revert
      const previousVote = userVote;
      const previousTrueVotes = trueVotes;
      const previousFalseVotes = falseVotes;

      // Calculate new counts BEFORE API call
      let newTrueVotes = trueVotes;
      let newFalseVotes = falseVotes;
      let newUserVote = userVote;

      if (userVote === voteType) {
        // Clicking same button - remove vote
        console.log(`ProfilePostCard[${post.id}]: Removing vote for ${voteType}`);
        newUserVote = null;
        if (voteType === 'TRUE') {
          newTrueVotes = Math.max(0, trueVotes - 1);
        } else {
          newFalseVotes = Math.max(0, falseVotes - 1);
        }
      } else {
        // Adding new vote or switching
        console.log(`ProfilePostCard[${post.id}]: Changing vote from ${userVote} to ${voteType}`);
        if (userVote === 'TRUE') {
          newTrueVotes = Math.max(0, trueVotes - 1);
        } else if (userVote === 'FALSE') {
          newFalseVotes = Math.max(0, falseVotes - 1);
        }

        newUserVote = voteType;
        if (voteType === 'TRUE') {
          newTrueVotes = newTrueVotes + 1;
        } else {
          newFalseVotes = newFalseVotes + 1;
        }
      }

      // Update UI optimistically
      setUserVote(newUserVote);
      setTrueVotes(newTrueVotes);
      setFalseVotes(newFalseVotes);

      // Handle API calls - if removing vote, DELETE only; if switching, DELETE then POST
      let voteResponse = null;
      if (userVote === voteType) {
        // Removing vote - just call DELETE
        console.log(`ProfilePostCard[${post.id}]: Calling DELETE to unvote`);
        await apiRequest(`${API_ENDPOINTS.UNVOTE_POST(post.id)}`, {
          method: 'DELETE',
        });
      } else if (userVote) {
        // Switching vote - DELETE previous, then POST new
        console.log(`ProfilePostCard[${post.id}]: Unvoting ${userVote}, then voting ${voteType}`);
        await apiRequest(`${API_ENDPOINTS.UNVOTE_POST(post.id)}`, {
          method: 'DELETE',
        });
        voteResponse = await apiRequest(`${API_ENDPOINTS.VOTE_POST(post.id)}`, {
          method: 'POST',
          body: JSON.stringify({ vote: voteType }),
        });
      } else {
        // Adding new vote - just POST
        console.log(`ProfilePostCard[${post.id}]: Calling POST to vote ${voteType}`);
        voteResponse = await apiRequest(`${API_ENDPOINTS.VOTE_POST(post.id)}`, {
          method: 'POST',
          body: JSON.stringify({ vote: voteType }),
        });
      }
      console.log(`ProfilePostCard[${post.id}]: Vote completed successfully, response:`, voteResponse);

      // CRITICAL: Refetch post from backend to get latest vote counts from ALL users
      console.log(`ProfilePostCard[${post.id}]: Refetching post data after vote`);
      try {
        const response = await apiRequest(`${API_ENDPOINTS.GET_POST(post.id)}`, {
          method: 'GET',
        });

        setTrueVotes(response.stats?.rumor_true_votes || 0);
        setFalseVotes(response.stats?.rumor_false_votes || 0);
        setUserVote(response.user_vote || null);
        console.log(`ProfilePostCard[${post.id}]: Updated vote counts - TRUE: ${response.stats?.rumor_true_votes}, FALSE: ${response.stats?.rumor_false_votes}`);
        if (onPostUpdated) {
          onPostUpdated(response);
        }
      } catch (refetchError) {
        console.error('Error refetching post after vote:', refetchError);
      }

    } catch (error) {
      console.error(`ProfilePostCard[${post.id}]: Error voting:`, error);
      
      // Check if error is rate limit error
      const errorMsg = error.message || '';
      if (errorMsg.includes('wait') || errorMsg.includes('Please wait') || errorMsg.includes('seconds')) {
        // Extract wait time from error message if possible
        const match = errorMsg.match(/(\d+)\s*seconds?/);
        if (match) {
          const waitSeconds = parseInt(match[1]) + 0.5;
          console.log(`ProfilePostCard[${post.id}]: Rate limited, waiting ${waitSeconds} seconds`);
          setVoteLocked(true);
          setVoteLockTimeRemaining(waitSeconds);
        } else {
          setVoteLocked(true);
          setVoteLockTimeRemaining(5.5);
        }
      }

      // REVERT: On error, revert to previous state
      console.log(`ProfilePostCard[${post.id}]: Reverting vote on error`);
      setUserVote(previousVote);
      setTrueVotes(previousTrueVotes);
      setFalseVotes(previousFalseVotes);
    } finally {
      setVoteLoading(false);
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
    <>
      <div 
        onClick={handlePostClick}
        className={`rounded-lg overflow-hidden border cursor-pointer transition-all duration-200 hover:shadow-lg ${isDark ? 'bg-gray-900 border-gray-800 hover:border-pink-500' : 'bg-white border-gray-200 hover:border-pink-500'}`}
      >
        {/* Post Header */}
        <div className="flex items-center justify-between p-4" data-no-navigate>
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
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold hover:underline"
                >
                  <p className={isDark ? 'text-white hover:text-pink-400' : 'text-black hover:text-pink-600'}>
                    {post.username}
                  </p>
                </Link>
              )}
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {new Date(post.created_at).toLocaleDateString()} {post.edited_at && '(edited)'}
              </p>
            </div>
          </div>
          
          {isOwner && (
            <div className="relative" data-no-navigate>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className={`text-xl px-2 py-1 rounded hover:${isDark ? 'bg-gray-800' : 'bg-gray-100'} transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              >
                •••
              </button>
              
              {showMenu && (
                <div className={`absolute right-0 mt-2 w-40 rounded-lg shadow-lg z-50 overflow-hidden ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditCaption(post.caption || '');
                      setEditDescription(post.description || '');
                      setShowEditModal(true);
                    }}
                    className={`w-full px-4 py-2 text-left hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'} transition-colors ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                    }}
                    className={`w-full px-4 py-2 text-left hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'} transition-colors border-t ${isDark ? 'border-gray-700 text-red-400' : 'border-gray-200 text-red-600'}`}
                  >
                    🗑️ Delete
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
          {post.caption && (
            <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {post.caption}
            </p>
          )}
          <p className={`text-base leading-relaxed line-clamp-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {post.description}
          </p>
        </div>

        {/* Media Carousel */}
        {post.media && post.media.length > 0 && (
          <div className={`mt-4 max-h-96 overflow-hidden rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
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
            {post.media.length > 1 && (
              <div className={`px-3 py-2 text-xs font-semibold ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                📸 {post.media.length} images
              </div>
            )}
          </div>
        )}

        {/* Post Stats and View Details */}
        <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          {post.type === 'RUMOR' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  ❤️ {post.stats?.likes_count || 0}
                </span>
                {showComments && (
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    💬 {post.stats?.comments_count || 0}
                  </span>
                )}
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  📊 {post.stats?.views_count || 0}
                </span>
              </div>

              <div>
                <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Is this true?</p>
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRumorVote('TRUE');
                      }}
                      disabled={voteLoading || voteLocked}
                      data-no-navigate
                      className={`w-full px-2 py-1.5 rounded text-xs font-semibold transition-all ${
                        voteLocked
                          ? 'opacity-50 cursor-not-allowed'
                          : userVote === 'TRUE'
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : isDark
                          ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      } ${voteLoading ? 'opacity-50' : ''}`}
                      title={voteLocked ? `Wait ${voteLockTimeRemaining.toFixed(1)}s` : 'Vote True'}
                    >
                      ✅ True ({trueVotes})
                    </button>
                    {voteLocked && (
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                        {voteLockTimeRemaining.toFixed(1)}s
                      </div>
                    )}
                  </div>
                  <div className="flex-1 relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRumorVote('FALSE');
                      }}
                      disabled={voteLoading || voteLocked}
                      data-no-navigate
                      className={`w-full px-2 py-1.5 rounded text-xs font-semibold transition-all ${
                        voteLocked
                          ? 'opacity-50 cursor-not-allowed'
                          : userVote === 'FALSE'
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : isDark
                          ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      } ${voteLoading ? 'opacity-50' : ''}`}
                      title={voteLocked ? `Wait ${voteLockTimeRemaining.toFixed(1)}s` : 'Vote False'}
                    >
                      ❌ False ({falseVotes})
                    </button>
                    {voteLocked && (
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                        {voteLockTimeRemaining.toFixed(1)}s
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-6 text-sm mb-3">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                ❤️ {post.stats?.likes_count || 0}
              </span>
              {showComments && (
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  💬 {post.stats?.comments_count || 0}
                </span>
              )}
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                📊 {post.stats?.views_count || 0}
              </span>
            </div>
          )}
          
          {/* View Details Button */}
          <button
            onClick={handlePostClick}
            className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              isDark
                ? 'bg-gray-800 text-pink-400 hover:bg-pink-600/20 border border-gray-700 hover:border-pink-600'
                : 'bg-gray-50 text-pink-600 hover:bg-pink-600/10 border border-gray-200 hover:border-pink-600'
            }`}
          >
            👁️ View Details
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-sm w-full mx-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
              Delete Post?
            </h3>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isDark
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : 'bg-gray-200 text-black hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-colors ${
                  isDeleting
                    ? 'bg-red-600/50 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
              Edit Post
            </h3>

            {/* Caption Field */}
            <div className="mb-4">
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Caption (optional)
              </label>
              <input
                type="text"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="Add a short caption..."
                maxLength={100}
                className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-pink-500'
                    : 'bg-white border-gray-200 text-black placeholder-gray-400 focus:border-pink-500'
                }`}
              />
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {editCaption.length}/100
              </p>
            </div>

            {/* Description Field */}
            <div className="mb-6">
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add post description..."
                rows={6}
                maxLength={2000}
                className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors resize-none ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-pink-500'
                    : 'bg-white border-gray-200 text-black placeholder-gray-400 focus:border-pink-500'
                }`}
              />
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {editDescription.length}/2000
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isUpdating}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isDark
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : 'bg-gray-200 text-black hover:bg-gray-300'
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isUpdating}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-colors ${
                  isUpdating
                    ? 'bg-pink-600/50 cursor-not-allowed'
                    : 'bg-pink-600 hover:bg-pink-700'
                }`}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
