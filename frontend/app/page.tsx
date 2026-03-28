'use client';

import { useState, useEffect } from 'react';
import { Flame, Clock, TrendingUp } from 'lucide-react';
import { Post, SortOption } from '@/types';
import { fetchPosts } from '@/lib/api';
import { PostCard } from '@/components/post-card';
import { Sidebar } from '@/components/sidebar';
import { cn } from '@/lib/utils';

const sortTabs: { key: SortOption; label: string; icon: React.ReactNode }[] = [
  { key: 'hot', label: 'Hot', icon: <Flame className="h-4 w-4" /> },
  { key: 'new', label: 'New', icon: <Clock className="h-4 w-4" /> },
  { key: 'top', label: 'Top', icon: <TrendingUp className="h-4 w-4" /> },
];

export default function HomePage() {
  const [sort, setSort] = useState<SortOption>('hot');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchPosts(sort).then((res) => {
      setPosts(res.data);
      setHasMore(res.hasMore);
      setLoading(false);
    });
  }, [sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <div className="flex gap-6">
        {/* Main Feed */}
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

          {/* Posts */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex gap-4">
                    <div className="hidden sm:block w-10 space-y-2">
                      <div className="h-6 w-6 mx-auto rounded bg-border" />
                      <div className="h-4 w-8 mx-auto rounded bg-border" />
                      <div className="h-6 w-6 mx-auto rounded bg-border" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="h-3 w-48 rounded bg-border" />
                      <div className="h-5 w-3/4 rounded bg-border" />
                      <div className="h-3 w-full rounded bg-border" />
                      <div className="h-3 w-2/3 rounded bg-border" />
                      <div className="h-4 w-40 rounded bg-border mt-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="mt-6 text-center">
              <button className="rounded-full border border-nust-green px-8 py-2.5 text-sm font-medium text-nust-green hover:bg-nust-green/10 transition-colors">
                Load More Posts
              </button>
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <p className="text-lg font-medium text-muted">No posts yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Be the first to share something!
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <Sidebar />
      </div>
    </div>
  );
}
