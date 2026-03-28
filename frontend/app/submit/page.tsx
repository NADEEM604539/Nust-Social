'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Image, LinkIcon, ChevronDown, Eye, Edit3 } from 'lucide-react';
import { communities, flairs } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

type PostType = 'text' | 'image' | 'link';

const postTypes: { key: PostType; label: string; icon: React.ReactNode }[] = [
    { key: 'text', label: 'Text Post', icon: <FileText className="h-4 w-4" /> },
    { key: 'image', label: 'Image Post', icon: <Image className="h-4 w-4" /> },
    { key: 'link', label: 'Link Post', icon: <LinkIcon className="h-4 w-4" /> },
];

export default function SubmitPage() {
    const [postType, setPostType] = useState<PostType>('text');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [selectedCommunity, setSelectedCommunity] = useState('');
    const [selectedFlair, setSelectedFlair] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [communityDropdownOpen, setCommunityDropdownOpen] = useState(false);

    return (
        <div className="mx-auto max-w-3xl px-4 py-6">
            <h1 className="mb-6 text-2xl font-bold">Create a Post</h1>

            {/* Community Selector */}
            <div className="relative mb-4">
                <button
                    onClick={() => setCommunityDropdownOpen(!communityDropdownOpen)}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm hover:border-nust-green/50 transition-colors"
                >
                    <span className={selectedCommunity ? 'text-foreground font-medium' : 'text-muted'}>
                        {selectedCommunity
                            ? `r/${communities.find((c) => c.id === selectedCommunity)?.slug}`
                            : 'Choose a community'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted" />
                </button>
                {communityDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg animate-fade-in max-h-60 overflow-y-auto">
                        {communities.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => {
                                    setSelectedCommunity(c.id);
                                    setCommunityDropdownOpen(false);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-card-hover transition-colors"
                            >
                                <div
                                    className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                                    style={{ backgroundColor: c.iconColor }}
                                >
                                    {c.name.split(' ').pop()?.[0]}
                                </div>
                                <div className="text-left">
                                    <p className="font-medium">r/{c.slug}</p>
                                    <p className="text-xs text-muted">{c.memberCount.toLocaleString()} members</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Post Type Tabs */}
            <div className="mb-4 flex rounded-xl border border-border bg-card overflow-hidden">
                {postTypes.map((pt) => (
                    <button
                        key={pt.key}
                        onClick={() => setPostType(pt.key)}
                        className={cn(
                            'flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-medium transition-all',
                            postType === pt.key
                                ? 'border-nust-green text-nust-green bg-nust-green/5'
                                : 'border-transparent text-muted hover:text-foreground hover:bg-card-hover'
                        )}
                    >
                        {pt.icon}
                        {pt.label}
                    </button>
                ))}
            </div>

            {/* Form */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                {/* Title */}
                <div>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title *"
                        maxLength={300}
                        className="w-full rounded-lg border border-border bg-input-bg px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted focus:border-nust-green focus:outline-none focus:ring-1 focus:ring-nust-green transition-colors"
                    />
                    <p className="mt-1 text-right text-xs text-muted">
                        {title.length}/300
                    </p>
                </div>

                {/* Body / Link */}
                {postType === 'text' && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className={cn(
                                        'flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                        !showPreview ? 'bg-nust-green/10 text-nust-green' : 'text-muted hover:text-foreground'
                                    )}
                                >
                                    <Edit3 className="h-3.5 w-3.5" /> Edit
                                </button>
                                <button
                                    onClick={() => setShowPreview(true)}
                                    className={cn(
                                        'flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                        showPreview ? 'bg-nust-green/10 text-nust-green' : 'text-muted hover:text-foreground'
                                    )}
                                >
                                    <Eye className="h-3.5 w-3.5" /> Preview
                                </button>
                            </div>
                        </div>
                        {showPreview ? (
                            <div className="min-h-[200px] rounded-lg border border-border bg-input-bg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                                {body || <span className="text-muted italic">Nothing to preview</span>}
                            </div>
                        ) : (
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Text (optional). Supports basic markdown."
                                className="w-full min-h-[200px] rounded-lg border border-border bg-input-bg px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-nust-green focus:outline-none focus:ring-1 focus:ring-nust-green resize-y transition-colors"
                            />
                        )}
                    </div>
                )}

                {postType === 'image' && (
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-input-bg p-12">
                        <Image className="h-10 w-10 text-muted" />
                        <p className="mt-3 text-sm font-medium">Drag and drop or click to upload</p>
                        <p className="mt-1 text-xs text-muted">PNG, JPG, GIF up to 10MB</p>
                        <button className="mt-4 rounded-full border border-nust-green px-6 py-2 text-sm font-medium text-nust-green hover:bg-nust-green/10 transition-colors">
                            Choose File
                        </button>
                    </div>
                )}

                {postType === 'link' && (
                    <input
                        type="url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="URL *"
                        className="w-full rounded-lg border border-border bg-input-bg px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-nust-green focus:outline-none focus:ring-1 focus:ring-nust-green transition-colors"
                    />
                )}

                {/* Flair Selector */}
                <div>
                    <p className="mb-2 text-sm font-medium">Select Flair</p>
                    <div className="flex flex-wrap gap-2">
                        {flairs.map((f) => (
                            <button
                                key={f.id}
                                onClick={() =>
                                    setSelectedFlair(selectedFlair === f.id ? '' : f.id)
                                }
                                className={cn(
                                    'rounded-full px-3 py-1 text-xs font-medium transition-all',
                                    selectedFlair === f.id
                                        ? 'ring-2 ring-offset-1 ring-nust-green'
                                        : 'hover:opacity-80'
                                )}
                                style={{
                                    color: f.color,
                                    backgroundColor: f.bgColor,
                                }}
                            >
                                {f.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link
                        href="/"
                        className="rounded-full px-6 py-2.5 text-sm font-medium text-muted hover:bg-card-hover transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        className="rounded-full bg-nust-green px-8 py-2.5 text-sm font-semibold text-white hover:bg-nust-green-light transition-colors disabled:opacity-50"
                        disabled={!title.trim() || !selectedCommunity}
                    >
                        Post
                    </button>
                </div>
            </div>
        </div>
    );
}
