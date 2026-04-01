'use client';

import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import SocietyFeed from '@/components/SocietyFeed';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';

export default function SocietiesPage() {
  const { isDark } = useTheme();

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
              {/* Page Header */}
              <div
                className={`rounded-lg p-6 ${
                  isDark
                    ? 'bg-gradient-to-br from-pink-900 to-blue-900 border border-gray-800'
                    : 'bg-gradient-to-br from-pink-100 to-blue-100 border border-gray-200'
                }`}
              >
                <h1
                  className={`text-3xl font-bold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Societies Feed
                </h1>
                <p
                  className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Explore posts from all societies at NUST
                </p>
              </div>

              <SocietyFeed />
            </div>
          </div>

          {/* Right Sidebar - Suggestions & CTA (Desktop only, >lg) */}
          <div className="hidden lg:flex w-72 flex-col flex-shrink-0 fixed right-0 top-20 h-screen overflow-y-auto pr-4 pt-4 gap-4">
            {/* Go to Your Societies CTA Button */}
            <Link href="/societies/my">
              <div
                className={`w-full rounded-lg p-6 cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                  isDark
                    ? 'bg-gradient-to-br from-pink-600 to-blue-600 hover:from-pink-500 hover:to-blue-500 shadow-lg shadow-pink-600/20'
                    : 'bg-gradient-to-br from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 shadow-lg shadow-pink-500/20'
                }`}
              >
                <h3 className="text-white font-bold text-lg text-center">
                  ✨ Go to Your Societies
                </h3>
                <p className="text-white text-sm text-center mt-2 opacity-90">
                  Manage and view your joined societies
                </p>
              </div>
            </Link>

            {/* Suggested Users Card - Instagram style */}
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
                Discover Societies
              </h2>
              <div className="space-y-3">
                <p
                  className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Browse featured societies to find communities that match your interests
                </p>
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
                Trending in NUST
              </h2>
              <div className="space-y-3">
                {[
                  '#NUST',
                  '#FeastOnLine',
                  '#StudyBuddy',
                  '#Placement2024',
                  '#CampusLife',
                ].map((tag) => (
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
                ))}
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
    </div>
  );
}
