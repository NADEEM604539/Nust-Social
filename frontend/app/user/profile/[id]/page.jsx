'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import FollowersModal from '@/components/FollowersModal';
import FollowingModal from '@/components/FollowingModal';
import { apiRequest, API_ENDPOINTS, getAccessToken } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';

export default function UserProfilePage() {
  const { isDark } = useTheme();
  const params = useParams();
  const router = useRouter();
  const userId = params.id;
  
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  useEffect(() => {
    // Redirect to /profile if viewing own profile
    if (isOwnProfile && currentUserId && !loading) {
      router.push('/profile');
    }
  }, [isOwnProfile, currentUserId, loading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const token = getAccessToken();
        
        // Get current user ID from token if available
        if (token) {
          try {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            const currUserId = decodedToken.sub || decodedToken.user_id;
            setCurrentUserId(currUserId);
            setIsOwnProfile(currUserId === parseInt(userId));
          } catch (e) {
            console.error('Error decoding token:', e);
          }
        }

        // Fetch user profile
        const userResponse = await apiRequest(
          API_ENDPOINTS.GET_USER(userId),
          { method: 'GET' }
        );
        
        if (userResponse) {
          setUser(userResponse);
        }
        
        // Fetch user follow stats
        const statsResponse = await apiRequest(
          API_ENDPOINTS.GET_USER_STATS(userId),
          { method: 'GET' }
        );
        
        if (statsResponse?.stats) {
          setStats(statsResponse.stats);
          setIsFollowing(statsResponse.stats.is_following || false);
        }
        
        // Fetch all posts and filter by user_id and non-anonymous
        const postsResponse = await apiRequest(API_ENDPOINTS.GET_FEED, {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (postsResponse?.data?.posts) {
          // Filter: only this user's posts AND only non-anonymous AND exclude SOCIETY_POST
          const userPosts = postsResponse.data.posts.filter(
            post => post.user_id === parseInt(userId) && !post.is_anonymous && post.type !== 'SOCIETY_POST'
          );
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
      fetchData();
    }
  }, [userId]);

  const handleFollow = async () => {
    if (isFollowLoading || !user || isOwnProfile) return;

    try {
      setIsFollowLoading(true);
      const token = getAccessToken();
      if (!token) {
        setError('Please log in to follow users');
        return;
      }

      await apiRequest(API_ENDPOINTS.FOLLOW_USER(userId), {
        method: 'POST',
      });

      setIsFollowing(true);
    } catch (err) {
      console.error('Error following user:', err);
      setError('Failed to follow user');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (isFollowLoading || !user || isOwnProfile) return;

    try {
      setIsFollowLoading(true);
      const token = getAccessToken();
      if (!token) {
        setError('Please log in to unfollow users');
        return;
      }

      await apiRequest(API_ENDPOINTS.UNFOLLOW_USER(userId), {
        method: 'DELETE',
      });

      setIsFollowing(false);
    } catch (err) {
      console.error('Error unfollowing user:', err);
      setError('Failed to unfollow user');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleFollow_Feed = async (userId_) => {
    if (isOwnProfile) return;
    await handleFollow();
  };

  const handleUnfollow_Feed = async (userId_) => {
    if (isOwnProfile) return;
    await handleUnfollow();
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

  if (error || !user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
            {error || 'User not found'}
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
    <div className={`flex min-h-screen ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      {/* Navigation Sidebar */}
      <Navigation />

      {/* Main Content Area - Centered */}
      <main className="w-full md:pt-0 pt-16">
        <div className="flex justify-center">
          <div className="w-full max-w-3xl px-4 py-8">
            
            {/* Profile Header */}
            <div className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} pb-8 mb-8`}>
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-center justify-center">
              {/* Avatar - Centered */}
              <div className="flex-shrink-0">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              
              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                {/* Username and Buttons */}
                <div className="flex flex-col items-center md:items-start gap-4 mb-6">
                  <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                    {user?.username || 'Unknown User'}
                  </h1>
                  
                  {/* Buttons Row */}
                  <div className="flex gap-3">
                    {/* Follow Button */}
                    {!isOwnProfile && stats?.is_following !== null && (
                      <button
                        onClick={isFollowing ? handleUnfollow : handleFollow}
                        disabled={isFollowLoading}
                        className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
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
                    
                    {/* Edit Profile Button */}
                    {isOwnProfile && (
                      <Link
                        href={`/user/profile/${userId}/edit`}
                        className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                          isDark
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        }`}
                      >
                        Edit Profile
                      </Link>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-8 mb-6 justify-center md:justify-start">
                  <div className="text-center">
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                      {posts.length}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      post{posts.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setShowFollowersModal(true)}
                    className="hover:opacity-75 transition-opacity text-center cursor-pointer"
                  >
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                      {stats?.followers_count || 0}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      follower{stats?.followers_count !== 1 ? 's' : ''}
                    </p>
                  </button>
                  
                  <button
                    onClick={() => setShowFollowingModal(true)}
                    className="hover:opacity-75 transition-opacity text-center cursor-pointer"
                  >
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                      {stats?.following_count || 0}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      following
                    </p>
                  </button>
                </div>

                {/* Name, Bio, Batch (display only if not null) */}
                <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                  {user?.name && (
                    <p className="font-semibold mb-2">{user.name}</p>
                  )}
                  
                  {user?.bio && (
                    <p className="mb-2">{user.bio}</p>
                  )}
                  
                  {user?.batch_year && (
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      📚 Batch {user.batch_year}
                    </p>
                  )}
                </div>
              </div>
            </div>
            </div>

            {/* Posts Grid - Instagram Style */}
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {isOwnProfile ? 'You have no posts yet' : 'No posts yet'}
                </p>
              </div>
            ) : (
              <>
                {/* Posts Grid */}
                <div className="grid grid-cols-3 md:grid-cols-3 gap-1 md:gap-3 auto-rows-max">
                  {posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/post/${post.id}`}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer group ${
                        isDark ? 'bg-gray-800' : 'bg-gray-100'
                      }`}
                    >
                      {/* Post Thumbnail */}
                      {post.media && post.media.length > 0 ? (
                        <div className="w-full h-full relative">
                          <img
                            src={post.media[0].url}
                            alt={`Post ${post.id}`}
                            className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                          />
                          {post.media.length > 1 && (
                            <div className="absolute top-2 right-2 bg-white/80 px-2 py-1 rounded text-xs font-semibold">
                              📸
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-2xl ${
                          isDark ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          📝
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                        <div className="text-white text-center">
                          <div className="text-2xl">❤️</div>
                          <div className="text-sm">{post.stats?.likes_count || 0}</div>
                        </div>
                        <div className="text-white text-center">
                          <div className="text-2xl">💬</div>
                          <div className="text-sm">{post.stats?.comments_count || 0}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <FollowersModal 
        userId={userId} 
        isOpen={showFollowersModal} 
        onClose={() => setShowFollowersModal(false)}
        username={user?.username}
      />
      <FollowingModal 
        userId={userId} 
        isOpen={showFollowingModal} 
        onClose={() => setShowFollowingModal(false)}
        username={user?.username}
      />
    </div>
  );
}
