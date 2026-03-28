'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    Users,
    Shield,
    Flame,
    Clock,
    TrendingUp,
    Calendar,
    Crown,
} from 'lucide-react';
import { Community, Post, SortOption } from '@/types';
import { fetchCommunity, fetchPosts } from '@/lib/api';
import { PostCard } from '@/components/post-card';
import { UserAvatar } from '@/components/user-avatar';
import { cn, formatNumber } from '@/lib/utils';

const sortTabs: { key: SortOption; label: string; icon: React.ReactNode }[] = [
    { key: 'hot', label: 'Hot', icon: <Flame className="h-4 w-4" /> },
    { key: 'new', label: 'New', icon: <Clock className="h-4 w-4" /> },
    { key: 'top', label: 'Top', icon: <TrendingUp className="h-4 w-4" /> },
];

export default function CommunityPage() {
    const params = useParams();
    const slug = params.community as string;

    const [community, setCommunity] = useState<Community | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [sort, setSort] = useState<SortOption>('hot');
    const [joined, setJoined] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([fetchCommunity(slug), fetchPosts(sort, undefined, slug)]).then(
            ([com, postRes]) => {
                setCommunity(com);
                setPosts(postRes.data);
                setJoined(com?.isJoined ?? false);
                setLoading(false);
            }
        );
    }, [slug, sort]);

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-40 bg-border" />
                <div className="mx-auto max-w-7xl px-4 py-6">
                    <div className="h-8 w-64 rounded bg-border mb-2" />
                    <div className="h-4 w-96 rounded bg-border" />
                </div>
            </div>
        );
    }

    if (!community) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-20 text-center">
                <h1 className="text-2xl font-bold">Community not found</h1>
                <p className="mt-2 text-muted">
                    r/{slug} doesn&apos;t exist.{' '}
                    <Link href="/communities" className="text-nust-green hover:underline">
                        Browse communities
                    </Link>
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Banner */}
            <div
                className="h-32 sm:h-40 relative"
                style={{ backgroundColor: community.bannerColor }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>

            {/* Community Header */}
            <div className="border-b border-border bg-card">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-6 pb-4">
                        <div
                            className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border-4 border-card text-2xl font-bold text-white shadow-lg shrink-0"
                            style={{ backgroundColor: community.iconColor }}
                        >
                            {community.name.split(' ').pop()?.[0]}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl sm:text-2xl font-bold">
                                r/{community.slug}
                            </h1>
                            <p className="text-sm text-muted">{community.name}</p>
                        </div>
                        <button
                            onClick={() => setJoined(!joined)}
                            className={cn(
                                'rounded-full px-6 py-2 text-sm font-semibold transition-colors shrink-0',
                                joined
                                    ? 'border border-border text-foreground hover:bg-card-hover'
                                    : 'bg-nust-gold text-gray-900 hover:bg-nust-gold-dark'
                            )}
                        >
                            {joined ? 'Joined' : 'Join Community'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
                <div className="flex gap-6">
                    {/* Feed */}
                    <div className="flex-1 min-w-0">
                        {/* Sort Tabs */}
                        <div className="mb-4 flex items-center gap-1 rounded-xl border border-border bg-card p-1.5">
                            {sortTabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setSort(tab.key)}
                                    className={cn(
                                        'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                                        sort === tab.key
                                            ? 'bg-nust-green text-white shadow-sm'
                                            : 'text-muted hover:bg-card-hover hover:text-foreground'
                                    )}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {posts.length > 0 ? (
                            <div className="space-y-3">
                                {posts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-border bg-card p-12 text-center">
                                <p className="text-lg font-medium text-muted">
                                    No posts in this community yet
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Community Sidebar */}
                    <aside className="hidden lg:block w-80 shrink-0 space-y-4">
                        {/* About */}
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <div
                                className="px-4 py-3 text-sm font-semibold text-white"
                                style={{ backgroundColor: community.bannerColor }}
                            >
                                About Community
                            </div>
                            <div className="p-4">
                                <p className="text-sm text-muted leading-relaxed">
                                    {community.description}
                                </p>
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-lg font-bold">
                                            {formatNumber(community.memberCount)}
                                        </p>
                                        <p className="text-xs text-muted">Members</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold flex items-center gap-1">
                                            <span className="h-2 w-2 rounded-full bg-green-500" />
                                            {Math.floor(community.memberCount * 0.05)}
                                        </p>
                                        <p className="text-xs text-muted">Online</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Created {new Date(community.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </div>
                                <Link
                                    href="/submit"
                                    className="mt-4 flex w-full items-center justify-center rounded-full bg-nust-gold py-2.5 text-sm font-semibold text-gray-900 hover:bg-nust-gold-dark transition-colors"
                                >
                                    Create Post
                                </Link>
                            </div>
                        </div>

                        {/* Rules */}
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                                <Shield className="h-4 w-4 text-nust-green" />
                                <h3 className="text-sm font-semibold">Community Rules</h3>
                            </div>
                            <div className="divide-y divide-border">
                                {community.rules.map((rule, i) => (
                                    <div key={rule.id} className="px-4 py-3">
                                        <p className="text-sm font-medium">
                                            {i + 1}. {rule.title}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted">
                                            {rule.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Contributors */}
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                                <Crown className="h-4 w-4 text-nust-gold" />
                                <h3 className="text-sm font-semibold">Top Contributors</h3>
                            </div>
                            <div className="divide-y divide-border">
                                {community.topContributors.map((user) => (
                                    <Link
                                        key={user.id}
                                        href={`/profile/${user.username}`}
                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-card-hover transition-colors"
                                    >
                                        <UserAvatar
                                            username={user.username}
                                            displayName={user.displayName}
                                            size="sm"
                                            avatarColor={user.avatarColor}
                                        />
                                        <div>
                                            <p className="text-sm font-medium">u/{user.username}</p>
                                            <p className="text-xs text-muted">
                                                {formatNumber(user.karma)} karma
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
