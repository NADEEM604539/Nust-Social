'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

export default function CreatePostButton() {
  const { isDark } = useTheme();

  return (
    <Link href="/create" className="w-full block">
      <button
        className={`w-full p-4 rounded-lg border-2 font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
          isDark
            ? 'bg-gradient-to-r from-pink-900/20 to-purple-900/20 border-pink-600 text-pink-400 hover:from-pink-900/40 hover:to-purple-900/40'
            : 'bg-gradient-to-r from-pink-50 to-purple-50 border-pink-300 text-pink-600 hover:from-pink-100 hover:to-purple-100'
        }`}
      >
        <span className="text-xl">✨</span>
        Create Post
      </button>
    </Link>
  );
}
