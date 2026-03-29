'use client';

import Link from 'next/link';
import { TrendingUp, Plus, Calendar, Users } from 'lucide-react';
import { communities } from '@/lib/mock-data';

export function Sidebar() {
    const trending = communities.slice(0, 5);

    return (
        <aside className="hidden lg:block w-80 shrink-0 space-y-4">
            {/* Create Post CTA */}
            <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 rounded-lg bg-gradient-to-r from-nust-green to-nust-green-light p-4">
                    <h3 className="text-sm font-bold text-white">Welcome to NUSTConnect</h3>
                    <p className="mt-1 text-xs text-white/80">Your campus. Your voice.</p>
                </div>
                <Link
                    href="/submit"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-nust-gold py-2.5 text-sm font-semibold text-gray-900 hover:bg-nust-gold-dark transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Create Post
                </Link>
            </div>

            {/* Trending Communities */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-2 border-b border-border bg-nust-green/5 dark:bg-nust-green/10 px-4 py-3">
                    <TrendingUp className="h-4 w-4 text-nust-green" />
                    <h3 className="text-sm font-semibold">Trending Communities</h3>
                </div>
                <div className="divide-y divide-border">
                    {trending.map((c, i) => (
                        <Link
                            key={c.id}
                            href={`/r/${c.slug}`}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-card-hover transition-colors"
                        >
                            <span className="text-xs font-medium text-muted w-4">{i + 1}</span>
                            <div
                                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shrink-0"
                                style={{ backgroundColor: c.iconColor }}
                            >
                                {c.name.split(' ').pop()?.[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">r/{c.slug}</p>
                                <p className="text-xs text-muted">{c.memberCount.toLocaleString()} members</p>
                            </div>
                        </Link>
                    ))}
                </div>
                <Link
                    href="/communities"
                    className="block border-t border-border px-4 py-2.5 text-center text-sm font-medium text-nust-green hover:bg-card-hover transition-colors"
                >
                    View All Communities
                </Link>
            </div>

            {/* Events Widget */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-2 border-b border-border bg-nust-gold/5 dark:bg-nust-gold/10 px-4 py-3">
                    <Calendar className="h-4 w-4 text-nust-gold-dark" />
                    <h3 className="text-sm font-semibold">Campus Events</h3>
                </div>
                <div className="p-4 space-y-3">
                    <div className="flex gap-3">
                        <div className="flex flex-col items-center rounded-lg bg-nust-green/10 px-2.5 py-1.5 text-nust-green shrink-0">
                            <span className="text-xs font-medium">APR</span>
                            <span className="text-lg font-bold leading-tight">15</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Spring Festival 2026</p>
                            <p className="text-xs text-muted">3-day campus celebration</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex flex-col items-center rounded-lg bg-nust-green/10 px-2.5 py-1.5 text-nust-green shrink-0">
                            <span className="text-xs font-medium">APR</span>
                            <span className="text-lg font-bold leading-tight">22</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Career Fair — SEECS</p>
                            <p className="text-xs text-muted">50+ companies attending</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex flex-col items-center rounded-lg bg-nust-green/10 px-2.5 py-1.5 text-nust-green shrink-0">
                            <span className="text-xs font-medium">MAY</span>
                            <span className="text-lg font-bold leading-tight">03</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Hackathon NUST '26</p>
                            <p className="text-xs text-muted">48-hour coding sprint</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs text-muted">
                    <Users className="h-3 w-3" />
                    <span>NUSTConnect © 2026</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                    Built for NUST students, by NUST students.
                </p>
            </div>
        </aside>
    );
}
