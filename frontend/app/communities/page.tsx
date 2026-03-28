'use client';

import { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { communities } from '@/lib/mock-data';
import { CommunityCard } from '@/components/community-card';
import { cn } from '@/lib/utils';

const categories = ['All', 'CS', 'EE', 'ME', 'Civil', 'BBA', 'General', 'Career'];

export default function CommunitiesPage() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const filtered = useMemo(() => {
        return communities.filter((c) => {
            const matchesSearch =
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.slug.toLowerCase().includes(search.toLowerCase()) ||
                c.description.toLowerCase().includes(search.toLowerCase());
            const matchesCategory =
                activeCategory === 'All' || c.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [search, activeCategory]);

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Browse Communities</h1>
                <p className="mt-1 text-sm text-muted">
                    Find your department, interest group, or start something new.
                </p>
            </div>

            {/* Search + Filter */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search communities..."
                        className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-nust-green focus:outline-none focus:ring-1 focus:ring-nust-green transition-colors"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <Filter className="h-4 w-4 text-muted shrink-0" />
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                                activeCategory === cat
                                    ? 'bg-nust-green text-white'
                                    : 'border border-border text-muted hover:text-foreground hover:bg-card-hover'
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((community) => (
                        <CommunityCard key={community.id} community={community} />
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-card p-12 text-center">
                    <p className="text-lg font-medium text-muted">
                        No communities found
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Try adjusting your search or filter.
                    </p>
                </div>
            )}
        </div>
    );
}
