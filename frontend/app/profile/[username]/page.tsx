'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Award, GraduationCap } from 'lucide-react';
import { User, Post } from '@/types';
import { fetchUser, fetchUserPosts } from '@/lib/api';
import { UserAvatar } from '@/components/user-avatar';
import { PostCard } from '@/components/post-card';
import { formatNumber, timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { comments as allComments } from '@/lib/mock-data';

type ProfileTab = 'posts' | 'comments' | 'saved';

const tabs: { key: ProfileTab; label: string }[] = [
    { key: 'posts', label: 'Posts' },
    { key: 'comments', label: 'Comments' },
    { key: 'saved', label: 'Saved' },
];

export default function ProfilePage() {
    const params = useParams();
    const username = params.username as string;

    const [user, setUser] = useState<User | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([fetchUser(username), fetchUserPosts(username)]).then(
            ([u, p]) => {
                setUser(u);
                setPosts(p);
                setLoading(false);
            }
        );
    }, [username]);

    const userComments = allComments.filter(
        (c) => c.author.username === username
    );

    if (loading) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-6 animate-pulse space-y-4">
                <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-border" />
                    <div className="space-y-2">
                        <div className="h-6 w-48 rounded bg-border" />
                        <div className="h-4 w-32 rounded bg-border" />
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-20 text-center">
                <h1 className="text-2xl font-bold">User not found</h1>
                <Link href="/" className="mt-4 inline-block text-nust-green hover:underline">
                    ← Back to feed
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-6">
            {/* Profile Header */}
            <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-in">
                {/* Cover */}
                <div className="h-28 bg-gradient-to-r from-nust-green to-nust-green-light" />
                <div className="px-5 pb-5">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
                        <UserAvatar
                            username={user.username}
                            displayName={user.displayName}
                            size="xl"
                            avatarColor={user.avatarColor}
                        />
                        <div className="flex-1">
                            <h1 className="text-xl font-bold">{user.displayName}</h1>
                            <p className="text-sm text-muted">u/{user.username}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-4 flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 rounded-lg bg-nust-gold/10 px-3 py-2">
                            <Award className="h-4 w-4 text-nust-gold-dark" />
                            <div>
                                <p className="text-sm font-bold">{formatNumber(user.karma)}</p>
                                <p className="text-xs text-muted">Karma</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-nust-green/10 px-3 py-2">
                            <GraduationCap className="h-4 w-4 text-nust-green" />
                            <div>
                                <p className="text-sm font-bold">{user.department}</p>
                                <p className="text-xs text-muted">Batch {user.batch}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-input-bg px-3 py-2">
                            <Calendar className="h-4 w-4 text-muted" />
                            <div>
                                <p className="text-sm font-medium">
                                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                    })}
                                </p>
                                <p className="text-xs text-muted">Joined</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex rounded-xl border border-border bg-card overflow-hidden">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            'flex-1 py-3 text-sm font-medium border-b-2 transition-all',
                            activeTab === tab.key
                                ? 'border-nust-green text-nust-green bg-nust-green/5'
                                : 'border-transparent text-muted hover:text-foreground hover:bg-card-hover'
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="mt-4 space-y-3">
                {activeTab === 'posts' &&
                    (posts.length > 0 ? (
                        posts.map((post) => <PostCard key={post.id} post={post} />)
                    ) : (
                        <div className="rounded-xl border border-border bg-card p-8 text-center">
                            <p className="text-muted">No posts yet</p>
                        </div>
                    ))}

                {activeTab === 'comments' &&
                    (userComments.length > 0 ? (
                        userComments.map((comment) => (
                            <div
                                key={comment.id}
                                className="rounded-xl border border-border bg-card p-4 animate-fade-in"
                            >
                                <div className="flex items-center gap-2 text-xs text-muted mb-2">
                                    <UserAvatar
                                        username={comment.author.username}
                                        displayName={comment.author.displayName}
                                        size="sm"
                                        avatarColor={comment.author.avatarColor}
                                    />
                                    <span className="font-medium text-foreground">
                                        u/{comment.author.username}
                                    </span>
                                    <span>•</span>
                                    <time>{timeAgo(comment.createdAt)}</time>
                                </div>
                                <p className="text-sm">{comment.body}</p>
                                <p className="mt-2 text-xs text-muted">
                                    ↳ on post •{' '}
                                    <span className="font-medium">
                                        {comment.score} points
                                    </span>
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="rounded-xl border border-border bg-card p-8 text-center">
                            <p className="text-muted">No comments yet</p>
                        </div>
                    ))}

                {activeTab === 'saved' && (
                    <div className="rounded-xl border border-border bg-card p-8 text-center">
                        <p className="text-muted">Nothing saved yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
