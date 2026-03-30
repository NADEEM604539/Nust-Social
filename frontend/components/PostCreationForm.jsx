'use client';

import React, { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { apiRequest, API_ENDPOINTS, getAccessToken } from '@/utils/api';
import { saveFileToPublic, registerMediaWithBackend } from '@/utils/mediaUpload';
import { useTheme } from '@/context/ThemeContext';

const POST_TYPE_INFO = {
  'RUMOR': '🔔 Rumor',
  'CONFESSION': '🤫 Confession',
  'SIMPLE_POST': '✨ Simple Post',
};

export default function PostCreationForm({ postType, onSuccess }) {
  const { isDark } = useTheme();
  const fileInputRef = useRef(null);
  
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
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

    // Reset file input
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

    if (!caption.trim() && !description.trim()) {
      setError('Please enter a caption or description');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = getAccessToken();
      if (!token) {
        setError('Please log in to create a post');
        return;
      }

      let mediaIds = [];
      
      // Save and register media with backend
      if (mediaItems.length > 0) {
        console.log(`Processing ${mediaItems.length} media files...`);
        
        const processPromises = mediaItems.map(async (item) => {
          try {
            // Step 1: Save file to public folder
            console.log(`Saving ${item.filename} to public folder...`);
            const saveResult = await saveFileToPublic(item.file, item.filename);
            if (!saveResult.success) {
              console.error(`Failed to save ${item.filename}:`, saveResult.error);
              return false;
            }
            console.log(`File saved: ${item.filename} -> ${saveResult.path}`);

            // Step 2: Register URL with backend
            console.log(`Registering ${item.filename} with backend...`);
            const registerResult = await registerMediaWithBackend(
              item.filename,
              item.type,
              token
            );
            if (registerResult.success) {
              console.log(
                `Media registered: ${item.filename} -> ID: ${registerResult.id}`,
                `URL: ${registerResult.url}`
              );
              mediaIds.push(registerResult.id);
              return true;
            } else {
              console.error(`Failed to register ${item.filename}:`, registerResult.error);
              return false;
            }
          } catch (err) {
            console.error(`Error processing ${item.filename}:`, err);
            return false;
          }
        });

        const processResults = await Promise.allSettled(processPromises);
        const successCount = processResults.filter(r => r.status === 'fulfilled' && r.value).length;
        console.log(`Successfully processed ${successCount}/${mediaItems.length} files`);
      }

      // Create the post
      const postData = {
        type: postType,
        caption: caption || null,
        description: description || null,
        is_anonymous: isAnonymous,
        media_ids: mediaIds.length > 0 ? mediaIds : null,
      };

      console.log('Creating post with data:', postData);

      const response = await apiRequest(API_ENDPOINTS.POSTS, {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Post created:', response);

      if (response.post_id) {
        // Clean up blob URLs
        mediaItems.forEach(item => URL.revokeObjectURL(item.previewUrl));
        // Reset form
        setCaption('');
        setDescription('');
        setIsAnonymous(false);
        setMediaItems([]);
        onSuccess();
      }
    } catch (err) {
      console.error('Post creation error:', err);
      setError(err.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
          {POST_TYPE_INFO[postType]}
        </h1>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Share your thoughts and media
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Caption Input */}
        <div>
          <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Caption *
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 500))}
            placeholder="What's on your mind?"
            maxLength="500"
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-pink-500'
                : 'bg-gray-50 border-gray-200 text-black placeholder-gray-500 focus:border-pink-500'
            }`}
          />
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {caption.length}/500
          </p>
        </div>

        {/* Description Input */}
        <div>
          <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details about your post..."
            rows="4"
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-pink-500'
                : 'bg-gray-50 border-gray-200 text-black placeholder-gray-500 focus:border-pink-500'
            }`}
          />
        </div>

        {/* Media Upload */}
        <div>
          <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Add Photos/Videos (Optional)
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`w-full py-8 rounded-lg border-2 border-dashed transition-all ${
              isDark
                ? 'bg-gray-800/50 border-gray-700 hover:border-pink-500 text-gray-400 hover:text-pink-400'
                : 'bg-gray-50 border-gray-300 hover:border-pink-500 text-gray-600 hover:text-pink-600'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl">📸</span>
              <span className="font-medium">Click to add photos or videos</span>
              <span className="text-xs">or drag and drop</span>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleMediaSelect}
            className="hidden"
          />
        </div>

        {/* Media Previews */}
        {mediaItems.length > 0 && (
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Selected Media ({mediaItems.length})
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {mediaItems.map((item) => (
                <div key={item.id} className="relative rounded-lg overflow-hidden group">
                  {item.type.startsWith('image') ? (
                    <img 
                      src={item.previewUrl} 
                      alt={item.filename} 
                      className="w-full h-32 object-cover" 
                    />
                  ) : (
                    <div className={`w-full h-32 flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <video 
                        src={item.previewUrl} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => removeMedia(item.id)}
                      className="bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {item.type.startsWith('image') ? '🖼️' : '▶️'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anonymous Toggle */}
        <div className="flex items-center gap-3 p-4 rounded-lg" style={{backgroundColor: isDark ? 'rgb(31 41 55)' : 'rgb(249 250 251)'}}>
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-5 h-5 rounded cursor-pointer"
          />
          <label
            htmlFor="anonymous"
            className={`text-sm font-medium cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Post Anonymously
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full p-3 rounded-lg font-bold text-white transition-all ${
            isSubmitting
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 active:scale-95'
          }`}
        >
          {isSubmitting ? 'Creating Post...' : 'Create Post'}
        </button>
      </form>
    </div>
  );
}
