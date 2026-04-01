'use client';

import React, { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { apiRequest, API_ENDPOINTS } from '@/utils/api';
import { saveFileToPublic, registerMediaWithBackend } from '@/utils/mediaUpload';
import { useTheme } from '@/context/ThemeContext';

export default function CreateSocietyPostModal({ isOpen, onClose, societyId, societyName, onPostCreated }) {
  const { isDark } = useTheme();
  const fileInputRef = useRef(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaItems, setMediaItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files || []);
    
    const newMediaItems = files.map((file) => {
      const uuid = uuidv4();
      const ext = file.name.split('.').pop();
      const filename = `${uuid}.${ext}`;
      const previewUrl = URL.createObjectURL(file);
      
      return {
        id: uuid,
        filename: filename,
        file: file,
        previewUrl: previewUrl,
        type: file.type,
        mediaId: null,
      };
    });

    setMediaItems((prev) => [...prev, ...newMediaItems]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMedia = (uuid) => {
    setMediaItems((prev) => {
      const item = prev.find(m => m.id === uuid);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((m) => m.id !== uuid);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() && !content.trim()) {
      setError('Please enter a title or content');
      return;
    }

    setIsSubmitting(true);

    try {
      let mediaIds = [];
      
      // Process media if any
      if (mediaItems.length > 0) {
        console.log(`Processing ${mediaItems.length} media files...`);
        
        for (const item of mediaItems) {
          try {
            const saveResult = await saveFileToPublic(item.file, item.filename);
            if (!saveResult.success) {
              console.error(`Failed to save ${item.filename}:`, saveResult.error);
              continue;
            }

            const registerResult = await registerMediaWithBackend(
              item.filename,
              item.type
            );
            if (registerResult.success) {
              mediaIds.push(registerResult.id);
            }
          } catch (err) {
            console.error(`Error processing media ${item.filename}:`, err);
          }
        }
      }

      // Create the society post
      const postData = {
        title: title.trim(),
        content: content.trim(),
        media_ids: mediaIds,
      };

      console.log('Creating society post:', postData);
      const response = await apiRequest(
        API_ENDPOINTS.CREATE_SOCIETY_POST(societyId),
        {
          method: 'POST',
          body: JSON.stringify(postData),
        }
      );

      if (response) {
        console.log('Society post created:', response);
        if (onPostCreated) {
          onPostCreated(response?.data || response);
        }
        
        // Reset form and close modal
        setTitle('');
        setContent('');
        setMediaItems([]);
        onClose();
      }
    } catch (err) {
      console.error('Error creating society post:', err);
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto">
      {/* Modal Container */}
      <div
        className={`w-full max-w-2xl mx-4 my-8 rounded-lg ${
          isDark ? 'bg-gray-900' : 'bg-white'
        } flex flex-col`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div>
            <h2
              className={`text-2xl font-bold mb-1 ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              📢 Post to {societyName}
            </h2>
            <p
              className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Share announcements and updates with society members
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className={`text-2xl font-bold hover:opacity-70 transition-opacity ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto max-h-96">
          <div className="p-6 space-y-4">
            {/* Error Message */}
            {error && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  isDark
                    ? 'bg-red-900/30 border border-red-800 text-red-200'
                    : 'bg-red-100 border border-red-300 text-red-700'
                }`}
              >
                {error}
              </div>
            )}

            {/* Title Field */}
            <div>
              <label
                htmlFor="title"
                className={`block text-sm font-semibold mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Post Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Upcoming Event, New Rules, Important Announcement..."
                maxLength={150}
                disabled={isSubmitting}
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
                {title.length}/150
              </p>
            </div>

            {/* Content Field */}
            <div>
              <label
                htmlFor="content"
                className={`block text-sm font-semibold mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Post Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share details about your announcement or event..."
                maxLength={1000}
                rows="5"
                disabled={isSubmitting}
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
                {content.length}/1000
              </p>
            </div>

            {/* Media Preview */}
            {mediaItems.length > 0 && (
              <div>
                <p
                  className={`text-sm font-semibold mb-3 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Attached Media ({mediaItems.length})
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {mediaItems.map((item) => (
                    <div
                      key={item.id}
                      className={`relative rounded-lg overflow-hidden border-2 ${
                        isDark ? 'border-gray-700' : 'border-gray-300'
                      }`}
                    >
                      <img
                        src={item.previewUrl}
                        alt="Preview"
                        className="w-full h-24 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeMedia(item.id)}
                        disabled={isSubmitting}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Media Upload */}
            <div>
              <label
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                  isDark
                    ? 'border-gray-600 hover:border-pink-500 hover:bg-gray-800'
                    : 'border-gray-300 hover:border-pink-500 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">📸</span>
                <span
                  className={`font-semibold ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Add Images (Optional)
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleMediaSelect}
                  disabled={isSubmitting}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className={`flex gap-3 p-6 border-t ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
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
              disabled={isSubmitting || (!title.trim() && !content.trim())}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                isSubmitting || (!title.trim() && !content.trim())
                  ? isDark
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isDark
                  ? 'bg-gradient-to-r from-pink-600 to-blue-600 hover:from-pink-500 hover:to-blue-500 text-white'
                  : 'bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Posting...
                </>
              ) : (
                <>📢 Post to {societyName}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
