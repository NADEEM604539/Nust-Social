'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

const POST_TYPES = [
  {
    id: 'RUMOR',
    label: '🔔 Rumor',
    description: 'Share campus rumors, speculation, and hearsay. Keep it spicy!',
    bgcolor: 'from-orange-500/20 to-orange-600/20',
    border: 'border-orange-500/50',
    accent: 'text-orange-500'
  },
  {
    id: 'CONFESSION',
    label: '🤫 Confession',
    description: 'Share your secrets anonymously. What is bothering you?',
    bgcolor: 'from-red-500/20 to-red-600/20',
    border: 'border-red-500/50',
    accent: 'text-red-500'
  },
  {
    id: 'SIMPLE_POST',
    label: '✨ Simple Post',
    description: 'Share your thoughts, updates, and everyday moments.',
    bgcolor: 'from-purple-500/20 to-blue-600/20',
    border: 'border-purple-500/50',
    accent: 'text-purple-500'
  },
];

export default function PostTypeSelector({ onSelectType }) {
  const { isDark } = useTheme();

  return (
    <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
          What do you want to create?
        </h1>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Choose a post type to get started
        </p>
      </div>

      {/* Post Type Cards */}
      <div className="grid grid-cols-1 gap-4">
        {POST_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelectType(type.id)}
            className={`p-6 rounded-xl border-2 transition-all duration-300 text-left hover:scale-105 active:scale-95 ${
              isDark
                ? `bg-gradient-to-br ${type.bgcolor} ${type.border} hover:border-opacity-100`
                : `bg-gradient-to-br ${type.bgcolor} ${type.border} hover:border-opacity-100`
            }`}
          >
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {type.label}
            </h2>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {type.description}
            </p>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className={`mt-12 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
        <p>You can post anonymously on any type • Choose wisely</p>
      </div>
    </div>
  );
}
