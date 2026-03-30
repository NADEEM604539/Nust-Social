'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => pathname === path;

  const navItems = [
    { name: 'Home', icon: '🏠', path: '/', section: 'home' },
    { name: 'Explore', icon: '🔍', path: '/explore', section: 'explore' },
    { name: 'Societies', icon: '👥', path: '/societies', section: 'societies' },
    { name: 'Marketplace', icon: '🛍️', path: '/marketplace', section: 'marketplace' },
    { name: 'Messages', icon: '💬', path: '/messages', section: 'messages' },
    { name: 'Notifications', icon: '🔔', path: '/notifications', section: 'notifications' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    router.push('/auth/login');
  };

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-screen flex-col transition-all duration-300 z-40 ${
          isDark
            ? 'bg-black border-gray-800'
            : 'bg-white border-gray-200'
        } border-r ${isSidebarOpen ? 'w-64' : 'w-20'}`}
      >
        {/* Logo */}
        <Link
          href="/"
          className={`flex items-center justify-center h-16 flex-shrink-0 ${
            isDark ? 'border-gray-800' : 'border-gray-200'
          } border-b`}
        >
          <div
            className={`flex items-center gap-2 ${!isSidebarOpen && 'justify-center'}`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              NS
            </div>
            {isSidebarOpen && (
              <span className={`font-bold text-xl ${isDark ? 'text-white' : 'text-black'}`}>
                NUST
              </span>
            )}
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive(item.path)
                  ? isDark
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-black'
                  : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-gray-900'
                  : 'text-gray-700 hover:text-black hover:bg-gray-100'
              }`}
              title={!isSidebarOpen ? item.name : ''}
            >
              <span className="text-2xl">{item.icon}</span>
              {isSidebarOpen && <span className="font-semibold text-base">{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div
          className={`flex flex-col gap-2 p-4 border-t ${
            isDark ? 'border-gray-800' : 'border-gray-200'
          }`}
        >
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
              isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-900'
                : 'text-gray-700 hover:text-black hover:bg-gray-100'
            }`}
            title={!isSidebarOpen ? (isDark ? 'Light Mode' : 'Dark Mode') : ''}
          >
            <span className="text-2xl">{isDark ? '☀️' : '🌙'}</span>
            {isSidebarOpen && (
              <span className="font-semibold text-base">
                {isDark ? 'Light' : 'Dark'}
              </span>
            )}
          </button>

          {/* Profile */}
          <Link
            href="/profile"
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive('/profile')
                ? isDark
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-black'
                : isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-900'
                : 'text-gray-700 hover:text-black hover:bg-gray-100'
            }`}
            title={!isSidebarOpen ? 'Profile' : ''}
          >
            <span className="text-2xl">👤</span>
            {isSidebarOpen && <span className="font-semibold text-base">Profile</span>}
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
              isDark
                ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                : 'text-red-600 hover:text-red-700 hover:bg-red-50'
            }`}
            title={!isSidebarOpen ? 'Logout' : ''}
          >
            <span className="text-2xl">🚪</span>
            {isSidebarOpen && <span className="font-semibold text-base">Logout</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`hidden xl:flex absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full items-center justify-center transition-all duration-200 ${
            isDark
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          } shadow-lg`}
          title={isSidebarOpen ? 'Collapse' : 'Expand'}
        >
          {isSidebarOpen ? '◀' : '▶'}
        </button>
      </aside>

      {/* Mobile Top Navbar */}
      <nav
        className={`md:hidden fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-40 ${
          isDark
            ? 'bg-black border-gray-800'
            : 'bg-white border-gray-200'
        } border-b`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            NS
          </div>
          <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>
            NUST
          </span>
        </Link>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`text-2xl transition-all duration-200 ${
            isDark ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-700'
          }`}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div
          className={`md:hidden fixed top-16 left-0 right-0 flex flex-col z-30 ${
            isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
          } border-b max-h-[calc(100vh-64px)] overflow-y-auto`}
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-4 px-4 py-4 border-b transition-all duration-200 ${
                isActive(item.path)
                  ? isDark
                    ? 'bg-gray-900 text-white border-gray-700'
                    : 'bg-gray-100 text-black border-gray-200'
                  : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-gray-900 border-gray-800'
                  : 'text-gray-700 hover:text-black hover:bg-gray-100 border-gray-200'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="font-semibold">{item.name}</span>
            </Link>
          ))}

          <button
            onClick={() => {
              toggleTheme();
              setIsMobileMenuOpen(false);
            }}
            className={`flex items-center gap-4 px-4 py-4 border-b transition-all duration-200 ${
              isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-900 border-gray-800'
                : 'text-gray-700 hover:text-black hover:bg-gray-100 border-gray-200'
            }`}
          >
            <span className="text-2xl">{isDark ? '☀️' : '🌙'}</span>
            <span className="font-semibold">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <Link
            href="/profile"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-4 px-4 py-4 border-b transition-all duration-200 ${
              isActive('/profile')
                ? isDark
                  ? 'bg-gray-900 text-white border-gray-700'
                  : 'bg-gray-100 text-black border-gray-200'
                : isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-900 border-gray-800'
                : 'text-gray-700 hover:text-black hover:bg-gray-100 border-gray-200'
            }`}
          >
            <span className="text-2xl">👤</span>
            <span className="font-semibold">Profile</span>
          </Link>

          <button
            onClick={() => {
              handleLogout();
              setIsMobileMenuOpen(false);
            }}
            className={`flex items-center gap-4 px-4 py-4 transition-all duration-200 ${
              isDark
                ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                : 'text-red-600 hover:text-red-700 hover:bg-red-50'
            }`}
          >
            <span className="text-2xl">🚪</span>
            <span className="font-semibold">Logout</span>
          </button>
        </div>
      )}
    </>
  );
}
