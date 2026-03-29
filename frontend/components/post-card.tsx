'use client';

import Link from 'next/link';
import { MessageSquare, Bookmark, Share2, MoreHorizontal } from 'lucide-react';
import { Post } from '@/types';
import { VoteButtons } from './vote-buttons';
import { FlairBadge } from './flair-badge';
import { UserAvatar } from './user-avatar';
import { timeAgo, formatNumber } from '@/lib/utils';

interface PostCardProps {
    post: Post;
}

export function PostCard({ post }: PostCardProps) {
    return (
        <article className="rounded-xl border border-border bg-card hover:border-nust-green/30 transition-all duration-200 animate-fade-in">
            <div className="flex gap-3 p-4">
                {/* Vote Column */}
                <div className="hidden sm:block">
                    <VoteButtons score={post.score} userVote={post.userVote} orientation="vertical" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                        <Link
                            href={`/r/${post.community.slug}`}
                            className="font-semibold text-foreground hover:text-nust-green transition-colors"
                        >
                            r/{post.community.slug}
                        </Link>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                            <UserAvatar
                                username={post.author.username}
                                displayName={post.author.displayName}
                                size="sm"
                                avatarColor={post.author.avatarColor}
                            />
                            <Link
                                href={`/profile/${post.author.username}`}
                                className="hover:text-foreground transition-colors"
                            >
                                u/{post.author.username}
                            </Link>
                        </div>
                        <span>•</span>
                        <time>{timeAgo(post.createdAt)}</time>
                        {post.flair && (
                            <>
                                <span>•</span>
                                <FlairBadge flair={post.flair} />
                            </>
                        )}
                    </div>

                    {/* Title */}
                    <Link href={`/post/${post.id}`}>
                        <h2 className="mt-2 text-base sm:text-lg font-semibold leading-snug hover:text-nust-green transition-colors cursor-pointer">
                            {post.title}
                        </h2>
                    </Link>

                    {/* Body Preview */}
                    {post.body && (
                        <p className="mt-1.5 text-sm text-muted line-clamp-3">
                            {post.body}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-1">
                        {/* Mobile votes */}
                        <div className="sm:hidden">
                            <VoteButtons
                                score={post.score}
                                userVote={post.userVote}
                                orientation="horizontal"
                                size="sm"
                            />
                        </div>

                        <Link
                            href={`/post/${post.id}`}
                            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted hover:bg-card-hover hover:text-foreground transition-colors"
                        >
                            <MessageSquare className="h-4 w-4" />
                            {formatNumber(post.commentCount)} Comments
                        </Link>

                        <button className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted hover:bg-card-hover hover:text-foreground transition-colors">
                            <Share2 className="h-4 w-4" />
                            Share
                        </button>

                        <button className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted hover:bg-card-hover hover:text-foreground transition-colors">
                            <Bookmark className={`h-4 w-4 ${post.saved ? 'fill-nust-gold text-nust-gold' : ''}`} />
                            {post.saved ? 'Saved' : 'Save'}
                        </button>

                        <button className="ml-auto flex items-center justify-center rounded-full p-1.5 text-muted hover:bg-card-hover hover:text-foreground transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}
