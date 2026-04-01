'use client';

import React, { useState } from 'react';
import { apiRequest, API_ENDPOINTS, getAccessToken } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';

const POST_TYPES = [
  { id: 'RUMOR', label: '🔔 Rumor', color: 'border-orange-500' },
  { id: 'CONFESSION', label: '🤫 Confession', color: 'border-red-500' },
  { id: 'SOCIETY_POST', label: '👥 Society Post', color: 'border-blue-500' },
  { id: 'ANNOUNCEMENT', label: '📢 Announcement', color: 'border-green-500' },
  { id: 'MARKETPLACE_POST', label: '🛍️ Marketplace', color: 'border-purple-500' },
];

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const { isDark } = useTheme();
  const [postType, setPostType] = useState('CONFESSION');
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!caption.trim() && !description.trim()) {
      setError('Please enter a caption or description');
      return;
    }

    setIsSubmitting(true);

    try {
      const tagList = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const postData = {
        type: postType,
        caption: caption || null,
        description: description || null,
        is_anonymous: isAnonymous,
        tags: tagList.length > 0 ? tagList : null,
      };

      // apiRequest handles token refresh automatically on 401
      const response = await apiRequest(API_ENDPOINTS.CREATE_POST, {
        method: 'POST',
        body: JSON.stringify(postData),
      });

      if (response.post_id) {
        // Reset form
        setCaption('');
        setDescription('');
        setIsAnonymous(false);
        setTags('');
        setPostType('CONFESSION');

        // Notify parent component
        if (onPostCreated) {
          onPostCreated();
        }

        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-gray-900' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'border-gray-800' : 'border-gray-200'
          }`}
        >
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Create Post
          </h2>
          <button
            onClick={onClose}
            className={`text-2xl transition-colors ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

          {/* Post Type Selection */}
          <div>
            <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Post Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {POST_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setPostType(type.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    postType === type.id
                      ? `${type.color} ${isDark ? 'bg-gray-800' : 'bg-blue-50'}`
                      : `border-gray-300 ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600'}`
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Caption
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.slice(0, 500))}
              placeholder="What's on your mind?"
              maxLength="500"
              className={`w-full px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-gray-50 border-gray-200 text-black placeholder-gray-500'
              }`}
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {caption.length}/500
            </p>
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows="4"
              className={`w-full px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-gray-50 border-gray-200 text-black placeholder-gray-500'
              }`}
            />
          </div>

          {/* Tags */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Tags (Optional)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Separate tags with commas: tag1, tag2, tag3"
              className={`w-full px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-gray-50 border-gray-200 text-black placeholder-gray-500'
              }`}
            />
          </div>

          {/* Anonymous Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <label
              htmlFor="anonymous"
              className={`text-sm font-medium cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Post Anonymously
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                isDark
                  ? 'bg-gray-800 text-white hover:bg-gray-700'
                  : 'bg-gray-200 text-black hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors text-white ${
                isSubmitting
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
              }`}
            >
              {isSubmitting ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
