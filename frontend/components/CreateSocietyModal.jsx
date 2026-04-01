'use client';

import React, { useState } from 'react';
import { apiRequest, API_ENDPOINTS } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';

export default function CreateSocietyModal({ isOpen, onClose, onSocietyCreated }) {
  const { isDark } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Society name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await apiRequest(API_ENDPOINTS.GET_SOCIETIES, {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });

      if (response) {
        // Call the callback to add the society to the list
        if (onSocietyCreated) {
          onSocietyCreated(response?.data || response);
        }
        
        // Reset form and close modal
        setName('');
        setDescription('');
        onClose();
      }
    } catch (err) {
      console.error('Error creating society:', err);
      setError(err.message || 'Failed to create society. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* Modal Container */}
      <div
        className={`w-full max-w-md mx-4 rounded-lg ${
          isDark ? 'bg-gray-900' : 'bg-white'
        } flex flex-col max-h-screen md:max-h-auto`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <h2
            className={`text-xl font-bold ${
              isDark ? 'text-white' : 'text-black'
            }`}
          >
            ✨ Create New Society
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className={`text-2xl font-bold hover:opacity-70 transition-opacity ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
          {/* Error Message */}
          {error && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                isDark
                  ? 'bg-red-900/30 border border-red-800 text-red-200'
                  : 'bg-red-100 border border-red-300 text-red-700'
              }`}
            >
              {error}
            </div>
          )}

          {/* Society Name Field */}
          <div className="mb-4">
            <label
              htmlFor="name"
              className={`block text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Society Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Photography Club, Coding Society..."
              maxLength={100}
              disabled={loading}
              className={`w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-black placeholder-gray-400'
              } disabled:opacity-50`}
            />
            <p
              className={`text-xs mt-1 ${
                isDark ? 'text-gray-500' : 'text-gray-600'
              }`}
            >
              {name.length}/100
            </p>
          </div>

          {/* Description Field */}
          <div className="mb-6">
            <label
              htmlFor="description"
              className={`block text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this society about? (optional)"
              maxLength={500}
              rows="4"
              disabled={loading}
              className={`w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-black placeholder-gray-400'
              } disabled:opacity-50`}
            />
            <p
              className={`text-xs mt-1 ${
                isDark ? 'text-gray-500' : 'text-gray-600'
              }`}
            >
              {description.length}/500
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-black'
              } disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                loading || !name.trim()
                  ? isDark
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isDark
                  ? 'bg-gradient-to-r from-pink-600 to-blue-600 hover:from-pink-500 hover:to-blue-500 text-white'
                  : 'bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 text-white'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>✨ Create Society</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
