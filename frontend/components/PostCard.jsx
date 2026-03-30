'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MediaCarousel from './MediaCarousel';
import { useTheme } from '@/context/ThemeContext';

export default function PostCard({ post, onDelete, onReact, onComment, onFollow, onUnfollow }) {
  const { isDark } = useTheme();
  const [currentReaction, setCurrentReaction] = useState(post.user_reaction || null);
  const [likeCount, setLikeCount] = useState(post.stats?.likes_count || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [reactionLocked, setReactionLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const [isFollowing, setIsFollowing] = useState(post.is_following || false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Sync state when post data changes (from parent PostFeed updates)
  // This is the source of truth - always sync from parent
  useEffect(() => {
    console.log(`PostCard[${post.id}]: Syncing from parent - reaction: ${post.user_reaction}, likes: ${post.stats?.likes_count}`);
    setCurrentReaction(post.user_reaction || null);
    setLikeCount(post.stats?.likes_count || 0);
    setIsFollowing(post.is_following || false);
  }, [post.id, post.stats?.likes_count, post.user_reaction, post.is_following]);

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
            {post.is_anonymous ? '🔒' : post.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col flex-1">
            {post.is_anonymous ? (
              <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {post.encrypted_name?.substring(0, 8) || 'Anonymous'}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href={`/user/profile/${post.user_id}`}
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

      {/* Likes Count */}
      <div className={`px-4 py-2 text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
        {likeCount} like{likeCount !== 1 ? 's' : ''}
      </div>

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
