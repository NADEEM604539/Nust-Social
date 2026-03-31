'use client';

import React from 'react';
import Navigation from '@/components/Navigation';
import SettingsPage from '@/components/SettingsPage';
import { useTheme } from '@/context/ThemeContext';

export default function Settings() {
  const { isDark } = useTheme();

  return (
    <div
      className={`flex h-screen ${isDark ? 'bg-black' : 'bg-white'}`}
    >
      {/* Navigation Sidebar */}
      <Navigation />

      {/* Main Content */}
      <main
        className={`flex-1 md:ml-[360px] overflow-y-auto ${
          isDark ? 'bg-black text-white' : 'bg-white text-black'
        }`}
      >
        <SettingsPage />
      </main>
    </div>
  );
}
