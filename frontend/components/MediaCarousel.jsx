'use client';

import React, { useState, useEffect } from 'react';

export default function MediaCarousel({ media, isDark }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  if (!media || media.length === 0) {
    return null;
  }

  const currentMedia = media[currentIndex];
  
  // Detect video by type category or URL extension
  const isVideo = 
    (currentMedia.type && currentMedia.type.toUpperCase() === 'VIDEO') ||
    (currentMedia.type && currentMedia.type.startsWith('video')) ||
    (currentMedia.url && /\.(mp4|webm|mov|avi|mkv)$/i.test(currentMedia.url));

  const goToPrevious = () => {
    setFadeOut(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
      setFadeOut(false);
    }, 150);
  };

  const goToNext = () => {
    setFadeOut(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
      setFadeOut(false);
    }, 150);
  };

  const goToSlide = (index) => {
    if (index !== currentIndex) {
      setFadeOut(true);
      setTimeout(() => {
        setCurrentIndex(index);
        setFadeOut(false);
      }, 150);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, media.length]);

  return (
    <div className="relative w-full bg-black aspect-square overflow-hidden">
      {/* Main Media Display with fade transition */}
      <div className={`transition-opacity duration-150 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
        {isVideo ? (
          <video
            key={currentMedia.id}
            src={currentMedia.url}
            className="w-full h-full object-cover"
            controls
            controlsList="nodownload"
            playsInline
          />
        ) : (
          <img
            key={currentMedia.id}
            src={currentMedia.url}
            alt={`Media ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Previous Button - Always visible if multiple items */}
      {media.length > 1 && (
        <button
          onClick={goToPrevious}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white text-black font-bold rounded-full w-12 h-12 flex items-center justify-center transition-all hover:scale-110 z-20 shadow-lg"
          aria-label="Previous media"
          title="Previous (← key)"
        >
          ‹
        </button>
      )}

      {/* Next Button - Always visible if multiple items */}
      {media.length > 1 && (
        <button
          onClick={goToNext}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white text-black font-bold rounded-full w-12 h-12 flex items-center justify-center transition-all hover:scale-110 z-20 shadow-lg"
          aria-label="Next media"
          title="Next (→ key)"
        >
          ›
        </button>
      )}

      {/* Counter Badge */}
      {media.length > 1 && (
        <div className="absolute top-3 right-3 bg-black/80 text-white text-sm px-4 py-2 rounded-full font-bold z-10 backdrop-blur">
          {currentIndex + 1}/{media.length}
        </div>
      )}

      {/* Dots Indicator - Always visible if multiple items */}
      {media.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
          {media.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`rounded-full transition-all cursor-pointer ${
                index === currentIndex
                  ? 'bg-white w-3 h-3 shadow-lg'
                  : 'bg-white/50 w-2 h-2 hover:bg-white/80'
              }`}
              aria-label={`Go to media ${index + 1}`}
              title={`Media ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Media Type Badge */}
      {isVideo && (
        <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-bold z-10 flex items-center gap-1">
          ▶️ VIDEO
        </div>
      )}
    </div>
  );
}
