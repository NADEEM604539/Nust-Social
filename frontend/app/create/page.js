'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PostTypeSelector from '@/components/PostTypeSelector';
import PostCreationForm from '@/components/PostCreationForm';
import { useTheme } from '@/context/ThemeContext';

export default function CreatePage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState(null);

  const handleBack = () => {
    if (selectedType) {
      setSelectedType(null);
    } else {
      router.push('/');
    }
  };

  const handlePostCreated = () => {
    router.push('/');
  };

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Back Button - Fixed on left */}
      <button
        onClick={handleBack}
        className={`fixed top-4 left-4 p-2 rounded-full transition-all z-50 ${
          isDark
            ? 'bg-gray-900 text-white hover:bg-gray-800'
            : 'bg-gray-100 text-black hover:bg-gray-200'
        }`}
      >
        ← Back
      </button>

      {/* Center Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        {!selectedType ? (
          <PostTypeSelector onSelectType={setSelectedType} />
        ) : (
          <PostCreationForm 
            postType={selectedType} 
            onSuccess={handlePostCreated}
          />
        )}
      </div>
    </div>
  );
}
