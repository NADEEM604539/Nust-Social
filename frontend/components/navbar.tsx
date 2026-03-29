'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import {
    Search,
    Sun,
    Moon,
    Menu,
    X,
    Plus,
    User,
    LogIn,
    ChevronDown,
} from 'lucide-react';

export function Navbar() {
    const { theme, setTheme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    // Mock logged-in state
    const isLoggedIn = false;

    return (
        <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="flex h-14 items-center justify-between gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-nust-green">
                            <span className="text-sm font-bold text-white">N</span>
                        </div>
                        <span className="hidden sm:block text-lg font-bold">
                            <span className="text-nust-green dark:text-nust-gold">NUST</span>
                            <span className="text-foreground">Connect</span>
                        </span>
                    </Link>

                    {/* Search */}
                    <div className="flex-1 max-w-xl">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                            <input
                                type="text"
                                placeholder="Search NUSTConnect..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-full border border-border bg-input-bg py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-nust-green focus:outline-none focus:ring-1 focus:ring-nust-green transition-colors"
                            />
                        </div>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-2">
                        <Link
                            href="/submit"
                            className="flex items-center gap-1.5 rounded-full bg-nust-green px-4 py-2 text-sm font-medium text-white hover:bg-nust-green-light transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Create Post
                        </Link>

                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-card-hover transition-colors"
                            aria-label="Toggle theme"
                        >
                            <Sun className="h-4 w-4 hidden dark:block text-nust-gold" />
                            <Moon className="h-4 w-4 block dark:hidden text-muted" />
                        </button>

                        {isLoggedIn ? (
                            <div className="relative">
                                <button
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 hover:bg-card-hover transition-colors"
                                >
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-nust-green text-xs font-bold text-white">
                                        AK
                                    </div>
                                    <ChevronDown className="h-3 w-3 text-muted" />
                                </button>
                                {profileOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-card shadow-lg animate-fade-in">
                                        <Link href="/profile/ahmedkhan" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-card-hover transition-colors rounded-t-lg">
                                            <User className="h-4 w-4" /> Profile
                                        </Link>
                                        <button className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-card-hover transition-colors rounded-b-lg text-red-500">
                                            <LogIn className="h-4 w-4" /> Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className="rounded-full border border-nust-green px-4 py-2 text-sm font-medium text-nust-green hover:bg-nust-green/10 transition-colors"
                                >
                                    Log In
                                </Link>
                                <Link
                                    href="/register"
                                    className="rounded-full bg-nust-gold px-4 py-2 text-sm font-medium text-gray-900 hover:bg-nust-gold-dark transition-colors"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-card-hover transition-colors"
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-border bg-card animate-fade-in">
                    <div className="space-y-1 px-4 py-3">
                        <Link
                            href="/submit"
                            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-card-hover transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Plus className="h-4 w-4 text-nust-green" /> Create Post
                        </Link>
                        <Link
                            href="/communities"
                            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-card-hover transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Communities
                        </Link>
                        <button
                            onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-card-hover transition-colors"
                        >
                            <Sun className="h-4 w-4 hidden dark:block text-nust-gold" />
                            <Moon className="h-4 w-4 block dark:hidden" />
                            Toggle Theme
                        </button>
                        <hr className="border-border" />
                        {!isLoggedIn && (
                            <>
                                <Link
                                    href="/login"
                                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-card-hover transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <LogIn className="h-4 w-4" /> Log In
                                </Link>
                                <Link
                                    href="/register"
                                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-nust-gold hover:bg-card-hover transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
