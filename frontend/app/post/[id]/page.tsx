'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Bookmark, Share2, ArrowLeft } from 'lucide-react';
import { Post, Comment } from '@/types';
import { fetchPost, fetchComments } from '@/lib/api';
import { VoteButtons } from '@/components/vote-buttons';
import { FlairBadge } from '@/components/flair-badge';
import { UserAvatar } from '@/components/user-avatar';
import { CommentItem } from '@/components/comment-item';
import { timeAgo, formatNumber } from '@/lib/utils';

export default function PostDetailPage() {
    const params = useParams();
    const postId = params.id as string;

    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');

    useEffect(() => {
        Promise.all([fetchPost(postId), fetchComments(postId)]).then(
            ([p, c]) => {
                setPost(p);
                setComments(c);
                setLoading(false);
            }
        );
    }, [postId]);

    if (loading) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-6 animate-pulse space-y-4">
                <div className="h-4 w-40 rounded bg-border" />
                <div className="h-8 w-3/4 rounded bg-border" />
                <div className="h-32 rounded bg-border" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-20 text-center">
                <h1 className="text-2xl font-bold">Post not found</h1>
                <Link href="/" className="mt-4 inline-block text-nust-green hover:underline">
                    ← Back to feed
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-6">
            {/* Back */}
            <Link
                href="/"
                className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Feed
            </Link>

            {/* Post */}
            <article className="rounded-xl border border-border bg-card animate-fade-in">
                <div className="flex gap-4 p-5">
                    {/* Votes */}
                    <div className="hidden sm:block">
                        <VoteButtons score={post.score} userVote={post.userVote} />
                    </div>

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
                        <h1 className="mt-3 text-xl sm:text-2xl font-bold leading-snug">
                            {post.title}
                        </h1>

                        {/* Body */}
                        <div className="mt-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                            {post.body}
                        </div>

                        {/* Actions */}
                        <div className="mt-5 flex items-center gap-1 border-t border-border pt-3">
                            <div className="sm:hidden">
                                <VoteButtons
                                    score={post.score}
                                    userVote={post.userVote}
                                    orientation="horizontal"
                                    size="sm"
                                />
                            </div>
                            <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted">
                                <MessageSquare className="h-4 w-4" />
                                {formatNumber(post.commentCount)} Comments
                            </div>
                            <button className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted hover:bg-card-hover hover:text-foreground transition-colors">
                                <Share2 className="h-4 w-4" />
                                Share
                            </button>
                            <button className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted hover:bg-card-hover hover:text-foreground transition-colors">
                                <Bookmark className={`h-4 w-4 ${post.saved ? 'fill-nust-gold text-nust-gold' : ''}`} />
                                {post.saved ? 'Saved' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            </article>

            {/* Comment Box */}
            <div className="mt-6 rounded-xl border border-border bg-card p-4">
                <p className="mb-3 text-sm font-medium">
                    Comment as{' '}
                    <span className="text-nust-green">u/guest</span>
                </p>
                <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="What are your thoughts?"
                    className="w-full rounded-lg border border-border bg-input-bg p-3 text-sm text-foreground placeholder:text-muted focus:border-nust-green focus:outline-none focus:ring-1 focus:ring-nust-green resize-none transition-colors"
                    rows={4}
                />
                <div className="mt-3 flex justify-end">
                    <button
                        className="rounded-full bg-nust-green px-6 py-2 text-sm font-medium text-white hover:bg-nust-green-light transition-colors disabled:opacity-50"
                        disabled={!commentText.trim()}
                    >
                        Comment
                    </button>
                </div>
            </div>

            {/* Comments Thread */}
            <div className="mt-6 space-y-4">
                <h2 className="text-lg font-semibold">
                    Comments ({post.commentCount})
                </h2>
                {comments.length > 0 ? (
                    <div className="space-y-4">
                        {comments.map((comment) => (
                            <div
                                key={comment.id}
                                className="rounded-xl border border-border bg-card p-4"
                            >
                                <CommentItem comment={comment} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-border bg-card p-8 text-center">
                        <MessageSquare className="mx-auto h-8 w-8 text-muted" />
                        <p className="mt-2 text-sm text-muted">No comments yet. Be the first!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
