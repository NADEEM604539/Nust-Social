'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, CornerDownRight } from 'lucide-react';
import { Comment } from '@/types';
import { VoteButtons } from './vote-buttons';
import { UserAvatar } from './user-avatar';
import { timeAgo } from '@/lib/utils';

interface CommentItemProps {
    comment: Comment;
    depth?: number;
}

export function CommentItem({ comment, depth = 0 }: CommentItemProps) {
    const [collapsed, setCollapsed] = useState(comment.isCollapsed);
    const [showReply, setShowReply] = useState(false);
    const [replyText, setReplyText] = useState('');

    const maxDepth = 4;
    const indentClass = depth > 0 ? 'ml-4 sm:ml-6 pl-3 sm:pl-4 border-l-2 border-border' : '';

    return (
        <div className={`${indentClass} ${depth > 0 ? 'mt-3' : ''}`}>
            <div className="animate-fade-in">
                {/* Header */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="text-muted hover:text-foreground transition-colors"
                    >
                        {collapsed ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronUp className="h-4 w-4" />
                        )}
                    </button>
                    <UserAvatar
                        username={comment.author.username}
                        displayName={comment.author.displayName}
                        size="sm"
                        avatarColor={comment.author.avatarColor}
                    />
                    <span className="text-sm font-medium">
                        u/{comment.author.username}
                    </span>
                    <span className="text-xs text-muted">•</span>
                    <time className="text-xs text-muted">{timeAgo(comment.createdAt)}</time>
                </div>

                {/* Body */}
                {!collapsed && (
                    <div className="mt-2 ml-6">
                        <p className="text-sm leading-relaxed text-foreground/90">
                            {comment.body}
                        </p>

                        {/* Actions */}
                        <div className="mt-2 flex items-center gap-1">
                            <VoteButtons
                                score={comment.score}
                                userVote={comment.userVote}
                                orientation="horizontal"
                                size="sm"
                            />
                            <button
                                onClick={() => setShowReply(!showReply)}
                                className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-muted hover:bg-card-hover hover:text-foreground transition-colors"
                            >
                                <MessageSquare className="h-3.5 w-3.5" />
                                Reply
                            </button>
                        </div>

                        {/* Reply Box */}
                        {showReply && (
                            <div className="mt-3 animate-fade-in">
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Write a reply..."
                                    className="w-full rounded-lg border border-border bg-input-bg p-3 text-sm text-foreground placeholder:text-muted focus:border-nust-green focus:outline-none focus:ring-1 focus:ring-nust-green resize-none"
                                    rows={3}
                                />
                                <div className="mt-2 flex justify-end gap-2">
                                    <button
                                        onClick={() => { setShowReply(false); setReplyText(''); }}
                                        className="rounded-full px-4 py-1.5 text-xs font-medium text-muted hover:bg-card-hover transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="rounded-full bg-nust-green px-4 py-1.5 text-xs font-medium text-white hover:bg-nust-green-light transition-colors disabled:opacity-50"
                                        disabled={!replyText.trim()}
                                    >
                                        Reply
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Nested Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3">
                                {depth < maxDepth ? (
                                    comment.replies.map((reply) => (
                                        <CommentItem
                                            key={reply.id}
                                            comment={reply}
                                            depth={depth + 1}
                                        />
                                    ))
                                ) : (
                                    <button className="flex items-center gap-1 text-xs font-medium text-nust-green hover:underline">
                                        <CornerDownRight className="h-3 w-3" />
                                        Continue this thread →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Collapsed indicator */}
                {collapsed && (
                    <p className="ml-6 mt-1 text-xs text-muted italic">
                        [collapsed — {comment.replies?.length || 0} replies]
                    </p>
                )}
            </div>
        </div>
    );
}
