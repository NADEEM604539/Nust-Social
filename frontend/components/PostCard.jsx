'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import MediaCarousel from './MediaCarousel';
import { useTheme } from '@/context/ThemeContext';
import { apiRequest, API_ENDPOINTS } from '@/utils/api';

export default function PostCard({ post, currentUserId, onDelete, onReact, onVote, onComment, onFollow, onUnfollow }) {
  const { isDark } = useTheme();
  const [currentReaction, setCurrentReaction] = useState(post.user_reaction || null);
  const [likeCount, setLikeCount] = useState(post.stats?.likes_count || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [reactionLocked, setReactionLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const [isFollowing, setIsFollowing] = useState(post.is_following || false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [userVote, setUserVote] = useState(post.user_vote || null);
  const [trueVotes, setTrueVotes] = useState(post.stats?.rumor_true_votes || 0);
  const [falseVotes, setFalseVotes] = useState(post.stats?.rumor_false_votes || 0);
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteLocked, setVoteLocked] = useState(false);
  const [voteLockTimeRemaining, setVoteLockTimeRemaining] = useState(0);
  const [isAdminOrModerator, setIsAdminOrModerator] = useState(false);

  // Sync state when post data changes (from parent PostFeed updates)
  // This is the source of truth - always sync from parent
  useEffect(() => {
    console.log(`PostCard[${post.id}]: Syncing from parent - reaction: ${post.user_reaction}, likes: ${post.stats?.likes_count}, vote: ${post.user_vote}`);
    setCurrentReaction(post.user_reaction || null);
    setLikeCount(post.stats?.likes_count || 0);
    setIsFollowing(post.is_following || false);
    setUserVote(post.user_vote || null);
    setTrueVotes(post.stats?.rumor_true_votes || 0);
    setFalseVotes(post.stats?.rumor_false_votes || 0);
  }, [post.id, post.stats?.likes_count, post.user_reaction, post.is_following, post.user_vote, post.stats?.rumor_true_votes, post.stats?.rumor_false_votes]);

  // Check if user is admin/moderator of the society
  useEffect(() => {
    if (!post.society_id || !currentUserId || typeof post.society_id !== 'number') {
      setIsAdminOrModerator(false);
      return;
    }

    let isMounted = true;

    const checkAdminStatus = async () => {
      try {
        const endpoint = API_ENDPOINTS.IS_SOCIETY_ADMIN_OR_MOD(post.society_id);
        const response = await apiRequest(endpoint, {
          method: 'GET',
        });

        if (isMounted) {
          setIsAdminOrModerator(response?.is_admin_or_moderator || false);
        }
      } catch (error) {
        if (isMounted) {
          // Silently fail - admin status is optional information
          // Default to regular view if check fails
          setIsAdminOrModerator(false);
        }
      }
    };

    // Fire check in background
    checkAdminStatus();

    return () => {
      isMounted = false;
    };
  }, [post.society_id, currentUserId]);

  // Countdown timer for reaction lock
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

  const handleReaction = async (reactionType) => {
    // Prevent multiple simultaneous requests or while locked
    if (isReacting || reactionLocked) {
      console.log('Button locked or already reacting, ignoring click');
      return;
    }

    try {
      setIsReacting(true);
      console.log(`PostCard[${post.id}]: Reacting with ${reactionType}, current: ${currentReaction}`);

      // OPTIMISTIC: Update UI immediately for instant feedback
      const previousReaction = currentReaction;
      const previousCount = likeCount;

      if (currentReaction === reactionType) {
        // User clicking same button - unliking
        console.log(`PostCard[${post.id}]: Unreacting from ${reactionType} (optimistic)`);
        setCurrentReaction(null);
        setLikeCount(Math.max(0, likeCount - 1));
        await onReact(post.id, 'UNREACT');
      } else {
        // User clicking new reaction or different reaction
        console.log(`PostCard[${post.id}]: Posting reaction ${reactionType} (optimistic)`);
        setCurrentReaction(reactionType);
        // Only increment if there was no previous reaction
        if (!previousReaction) {
          setLikeCount(likeCount + 1);
        }
        await onReact(post.id, reactionType);
      }
            // REFETCH: Get fresh data from backend like PostDetailModal does
      console.log(`PostCard[${post.id}]: Refetching post data after reaction`);
      try {
        const response = await apiRequest(`${API_ENDPOINTS.GET_POST(post.id)}`, {
          method: 'GET',
        });

        if (response && response.id) {
          // Update local state directly from fresh backend data
          console.log(`PostCard[${post.id}]: Synced reaction state - current: ${response.user_reaction}, likes: ${response.stats?.likes_count}`);
          setCurrentReaction(response.user_reaction || null);
          setLikeCount(response.stats?.likes_count || 0);
        }
      } catch (err) {
        console.error(`PostCard[${post.id}]: Error refetching after react:`, err);
        // Continue anyway - UI already updated optimistically
      }
      
      // Lock button for 2.5 seconds after reaction
      setReactionLocked(true);
      setLockTimeRemaining(2.5);
      
    } catch (error) {
      console.error(`PostCard[${post.id}]: Error reacting:`, error);
      // REVERT: On error, revert to previous state
      console.log(`PostCard[${post.id}]: Reverting reaction on error`);
      setCurrentReaction(post.user_reaction || null);
      setLikeCount(post.stats?.likes_count || 0);
    } finally {
      setIsReacting(false);
    }
  };

  const handleLike = () => handleReaction('LIKE');

  const handleRumorVote = async (voteType) => {
    // Prevent multiple simultaneous requests or while locked
    if (voteLoading || voteLocked || post.type !== 'RUMOR') {
      console.log(`Vote locked or already voting, ignoring click`);
      return;
    }

    try {
      setVoteLoading(true);
      console.log(`PostCard[${post.id}]: Voting ${voteType}, current vote: ${userVote}`);

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
        console.log(`PostCard[${post.id}]: Removing vote for ${voteType}`);
        newUserVote = null;
        if (voteType === 'TRUE') {
          newTrueVotes = Math.max(0, trueVotes - 1);
        } else {
          newFalseVotes = Math.max(0, falseVotes - 1);
        }
      } else {
        // Adding new vote or switching
        console.log(`PostCard[${post.id}]: Changing vote from ${userVote} to ${voteType}`);
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
        console.log(`PostCard[${post.id}]: Calling DELETE to unvote`);
        await apiRequest(`${API_ENDPOINTS.UNVOTE_POST(post.id)}`, {
          method: 'DELETE',
        });
      } else if (userVote) {
        // Switching vote - DELETE previous, then POST new
        console.log(`PostCard[${post.id}]: Unvoting ${userVote}, then voting ${voteType}`);
        await apiRequest(`${API_ENDPOINTS.UNVOTE_POST(post.id)}`, {
          method: 'DELETE',
        });
        voteResponse = await apiRequest(`${API_ENDPOINTS.VOTE_POST(post.id)}`, {
          method: 'POST',
          body: JSON.stringify({ vote: voteType }),
        });
      } else {
        // Adding new vote - just POST
        console.log(`PostCard[${post.id}]: Calling POST to vote ${voteType}`);
        voteResponse = await apiRequest(`${API_ENDPOINTS.VOTE_POST(post.id)}`, {
          method: 'POST',
          body: JSON.stringify({ vote: voteType }),
        });
      }

      console.log(`PostCard[${post.id}]: Vote completed successfully, response:`, voteResponse);

      // REFETCH: Get fresh vote counts from backend like PostDetailModal does
      console.log(`PostCard[${post.id}]: Refetching post data after vote`);
      const fetchResponse = await apiRequest(`${API_ENDPOINTS.GET_POST(post.id)}`, {
        method: 'GET',
      });

      if (fetchResponse && fetchResponse.id) {
        // Update local state directly from fresh backend data
        console.log(`PostCard[${post.id}]: Synced vote state - user_vote: ${fetchResponse.user_vote}, TRUE: ${fetchResponse.stats?.rumor_true_votes}, FALSE: ${fetchResponse.stats?.rumor_false_votes}`);
        setUserVote(fetchResponse.user_vote || null);
        setTrueVotes(fetchResponse.stats?.rumor_true_votes || 0);
        setFalseVotes(fetchResponse.stats?.rumor_false_votes || 0);

        // Also call parent callback to sync parent state
        if (onVote) {
          console.log(`PostCard[${post.id}]: Calling parent onVote callback`);
          await onVote(post.id);
        }
      } else {
        console.warn(`PostCard[${post.id}]: Unexpected refetch response after vote`);
      }

    } catch (error) {
      console.error(`PostCard[${post.id}]: Error voting:`, error);
      
      // Check if error is rate limit error (only lock on rate limit, not other errors)
      const errorMsg = error.message || '';
      if (errorMsg.includes('wait') || errorMsg.includes('Please wait') || errorMsg.includes('seconds')) {
        // Extract wait time from error message if possible
        const match = errorMsg.match(/(\d+)\s*seconds?/);
        if (match) {
          const waitSeconds = parseInt(match[1]) + 0.5;
          console.log(`PostCard[${post.id}]: Rate limited, locking for ${waitSeconds} seconds`);
          setVoteLocked(true);
          setVoteLockTimeRemaining(waitSeconds);
        } else {
          // Generic rate limit - lock for 5 minutes
          console.log(`PostCard[${post.id}]: Rate limited, locking for 5 minutes`);
          setVoteLocked(true);
          setVoteLockTimeRemaining(300.5);
        }
      }

      // REVERT: On error, revert to previous state
      console.log(`PostCard[${post.id}]: Reverting vote on error`);
      setUserVote(previousVote);
      setTrueVotes(previousTrueVotes);
      setFalseVotes(previousFalseVotes);
    } finally {
      setVoteLoading(false);
    }
  };

  const handleFollow = async () => {
    if (isFollowLoading || post.is_owner || post.is_anonymous) return;

    try {
      setIsFollowLoading(true);
      
      if (isFollowing && onUnfollow) {
        await onUnfollow(post.user_id);
        setIsFollowing(false);
      } else if (!isFollowing && onFollow) {
        await onFollow(post.user_id);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Time formatter
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const postDate = new Date(timestamp);
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

  return (
    <div
      className={`w-full rounded-lg border transition-all duration-200 ${
        isDark
          ? 'bg-gray-900 border-gray-800 hover:border-gray-700'
          : 'bg-white border-gray-200 hover:border-gray-300'
      } shadow-sm hover:shadow-md overflow-hidden`}
    >
      {/* Post Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${
          isDark ? 'border-gray-800' : 'border-gray-100'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
            {post.society_id 
              ? post.society_name?.charAt(0).toUpperCase() 
              : post.is_anonymous ? '🔒' : post.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col flex-1">
            {/* Show society name if it's a society post, otherwise show username */}
            {post.society_id ? (
              <div className="flex items-center gap-2">
                <Link
                  href={isAdminOrModerator ? `/societies/${post.society_id}` : `/society/${post.society_id}`}
                  className={`font-semibold hover:underline ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}
                >
                  {post.society_name || 'Society'}
                </Link>
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  📢 Official
                </span>
              </div>
            ) : post.is_anonymous ? (
              <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {post.encrypted_name?.substring(0, 8) || 'Anonymous'}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href={post.user_id === currentUserId ? '/profile' : `/user/profile/${post.user_id}`}
                  className={`font-semibold hover:underline ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                >
                  {post.username || 'Unknown'}
                </Link>
                {!post.is_owner && post.is_following !== null && (
                  <button
                    onClick={handleFollow}
                    disabled={isFollowLoading}
                    className={`text-xs px-2 py-1 rounded-full font-medium transition-all duration-200 ${
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
            )}
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {getTimeAgo(post.created_at)}
            </span>
          </div>
        </div>

        {/* Menu Button */}
        {post.is_owner && (
          <div className="relative group hidden">
            <button
              className={`text-xl transition-all duration-200 ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
              }`}
            >
              ⋯
            </button>
            <div
              className={`absolute right-0 top-8 rounded-lg shadow-lg z-10 hidden group-hover:block ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <button
                className={`block px-4 py-2 text-sm font-medium transition-colors ${
                  isDark
                    ? 'text-red-400 hover:bg-red-900/20'
                    : 'text-red-600 hover:bg-red-50'
                } w-full text-left`}
                onClick={() => onDelete(post.id)}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Post Image/Media - Using Carousel */}
      {post.media && post.media.length > 0 && (
        <MediaCarousel media={post.media} isDark={isDark} />
      )}

      {/* Post Reactions Bar */}
      <div
        className={`flex gap-4 px-4 py-3 border-b ${
          isDark ? 'border-gray-800' : 'border-gray-100'
        }`}
      >
        <div className="relative">
          <button
            onClick={handleLike}
            disabled={reactionLocked}
            className={`flex items-center gap-1 transition-all duration-200 text-2xl ${
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
        <Link
          href={`/post/${post.id}`}
          className={`flex items-center gap-1 transition-all duration-200 text-2xl ${
            isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
          }`}
          title={`${post.stats?.comments_count || 0} comments - click to view`}
        >
          💬 ({post.stats?.comments_count || 0})
        </Link>
        <Link
          href={`/post/${post.id}`}
          className={`flex items-center gap-1 transition-all duration-200 text-2xl ${
            isDark ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-black'
          }`}
          title="View full discussion"
        >
          ↗️
        </Link>
        <button
          className={`flex items-center gap-1 transition-all duration-200 text-2xl ml-auto ${
            isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
          }`}
          title="Save"
        >
          📌
        </button>
      </div>

      {/* Likes Count or Rumor Voting */}
      {post.type === 'RUMOR' ? (
        <div className={`px-4 py-3 space-y-2 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          <p className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Is this true?</p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <button
                onClick={() => handleRumorVote('TRUE')}
                disabled={voteLoading || voteLocked}
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
                onClick={() => handleRumorVote('FALSE')}
                disabled={voteLoading || voteLocked}
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
      ) : (
        <div className={`px-4 py-2 text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
          {likeCount} like{likeCount !== 1 ? 's' : ''}
        </div>
      )}

      {/* Post Caption */}
      {post.caption && (
        <div className={`px-4 py-2 text-sm ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          <span className="font-semibold">
            {post.is_anonymous ? post.encrypted_name?.substring(0, 8) || 'Anonymous' : post.username || 'Unknown'}
          </span>
          {' '}
          {post.caption}
        </div>
      )}

      {/* Post Description */}
      {post.description && (
        <div className={`px-4 py-3 text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          {post.description}
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className={`px-4 py-1 text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'} space-x-2`}>
          {post.tags.map((tag) => (
            <Link key={tag} href={`/explore?tag=${tag}`} className="hover:underline">
              #{tag}
            </Link>
          ))}
        </div>
      )}


    </div>
  );
}
