'use client';

import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import PostFeed from '@/components/PostFeed';
import CreatePostButton from '@/components/CreatePostButton';
import { useTheme } from '@/context/ThemeContext';

export default function HomePage() {
  const { isDark } = useTheme();
  const [refreshFeed, setRefreshFeed] = useState(false);

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Navigation */}
      <Navigation />

      {/* Main Content Area */}
      <main className="w-full md:pt-0 pt-16">
        {/* Desktop Layout: Sidebar + Feed + Sidebar */}
        <div className="flex w-full gap-4 px-4 md:px-0">
          {/* Left Padding for Desktop Sidebar */}
          <div className="hidden md:block w-64 flex-shrink-0 pt-4" />

          {/* Main Feed - Centered */}
          <div className="flex-1 max-w-2xl mx-auto w-full pt-4 md:pt-4 pb-8">
            <div className="space-y-4">
              <CreatePostButton />
              <PostFeed />
            </div>
          </div>

          {/* Right Sidebar - Suggestions (Desktop only, >lg) */}
          <div className="hidden lg:flex w-72 flex-col flex-shrink-0 fixed right-0 top-20 h-screen overflow-y-auto pr-4 pt-4 gap-4">
            {/* Suggested Users Card */}
            <div
              className={`rounded-lg p-4 ${
                isDark
                  ? 'bg-gray-900 border border-gray-800'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <h2
                className={`font-bold text-lg mb-4 ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                Suggested For You
              </h2>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 animate-pulse"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex-shrink-0 ${
                          isDark ? 'bg-gray-800' : 'bg-gray-300'
                        }`}
                      />
                      <div className="flex flex-col flex-1 gap-2">
                        <div
                          className={`h-3 rounded flex-1 ${
                            isDark ? 'bg-gray-800' : 'bg-gray-300'
                          }`}
                        />
                        <div
                          className={`h-2 w-20 rounded ${
                            isDark ? 'bg-gray-800' : 'bg-gray-300'
                          }`}
                        />
                      </div>
                    </div>
                    <div
                      className={`h-8 w-16 rounded ${
                        isDark ? 'bg-gray-800' : 'bg-gray-300'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Hashtags Card */}
            <div
              className={`rounded-lg p-4 ${
                isDark
                  ? 'bg-gray-900 border border-gray-800'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <h2
                className={`font-bold text-lg mb-4 ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                Trending In NUST
              </h2>
              <div className="space-y-3">
                {['#NUST', '#FeastOnLine', '#StudyBuddy', '#Placement2024', '#CampusLife'].map(
                  (tag) => (
                    <a
                      key={tag}
                      href={`/explore?tag=${tag.replace('#', '')}`}
                      className={`block px-3 py-2 rounded transition-all duration-200 ${
                        isDark
                          ? 'hover:bg-gray-800 text-blue-400'
                          : 'hover:bg-gray-200 text-blue-600'
                      }`}
                    >
                      <p className="font-semibold">{tag}</p>
                      <p
                        className={`text-xs ${
                          isDark ? 'text-gray-500' : 'text-gray-600'
                        }`}
                      >
                        123K posts
                      </p>
                    </a>
                  )
                )}
              </div>
            </div>

            {/* Footer Links */}
            <div
              className={`text-xs space-y-2 p-4 text-center ${
                isDark ? 'text-gray-500' : 'text-gray-600'
              }`}
            >
              <div className="space-x-2">
                <a href="/about" className="hover:underline">
                  About
                </a>
                <a href="/privacy" className="hover:underline">
                  Privacy
                </a>
                <a href="/terms" className="hover:underline">
                  Terms
                </a>
              </div>
              <p>© 2026 NUST Social. All rights reserved.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navbar - Fixed */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 h-16 flex items-center justify-around border-t z-40 ${
          isDark
            ? 'bg-black border-gray-800'
            : 'bg-white border-gray-200'
        }`}
      >
        <a
          href="/"
          className="flex flex-col items-center gap-1 p-2 transition-all duration-200 text-pink-500"
          title="Home"
        >
          <span className="text-2xl">🏠</span>
          <span className="text-xs font-semibold">Home</span>
        </a>
        <a
          href="/explore"
          className={`flex flex-col items-center gap-1 p-2 transition-all duration-200 ${
            isDark
              ? 'text-gray-400 hover:text-white'
              : 'text-gray-600 hover:text-black'
          }`}
          title="Explore"
        >
          <span className="text-2xl">🔍</span>
          <span className="text-xs font-semibold">Explore</span>
        </a>
        <a
          href="/create"
          className={`flex flex-col items-center gap-1 p-2 transition-all duration-200 ${
            isDark
              ? 'text-gray-400 hover:text-white'
              : 'text-gray-600 hover:text-black'
          }`}
          title="Create"
        >
          <span className="text-2xl">➕</span>
          <span className="text-xs font-semibold">Create</span>
        </a>
        <a
          href="/messages"
          className={`flex flex-col items-center gap-1 p-2 transition-all duration-200 ${
            isDark
              ? 'text-gray-400 hover:text-white'
              : 'text-gray-600 hover:text-black'
          }`}
          title="Messages"
        >
          <span className="text-2xl">💬</span>
          <span className="text-xs font-semibold">Messages</span>
        </a>
        <a
          href="/profile"
          className={`flex flex-col items-center gap-1 p-2 transition-all duration-200 ${
            isDark
              ? 'text-gray-400 hover:text-white'
              : 'text-gray-600 hover:text-black'
          }`}
          title="Profile"
        >
          <span className="text-2xl">👤</span>
          <span className="text-xs font-semibold">Profile</span>
        </a>
      </nav>

      {/* Mobile Bottom Padding */}
      <div className="h-16 md:hidden w-full" />
    </div>
  );
}
     