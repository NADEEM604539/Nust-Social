import Link from 'next/link';
import { Users } from 'lucide-react';
import { Community } from '@/types';

interface CommunityCardProps {
    community: Community;
}

export function CommunityCard({ community }: CommunityCardProps) {
    return (
        <Link
            href={`/r/${community.slug}`}
            className="group block rounded-xl border border-border bg-card overflow-hidden hover:border-nust-green/40 hover:shadow-md transition-all duration-200"
        >
            {/* Banner */}
            <div
                className="h-20 relative"
                style={{ backgroundColor: community.bannerColor }}
            >
                <div
                    className="absolute -bottom-5 left-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-card text-sm font-bold text-white shadow-sm"
                    style={{ backgroundColor: community.iconColor }}
                >
                    {community.name.split(' ').pop()?.[0]}
                </div>
            </div>

            {/* Content */}
            <div className="pt-8 pb-4 px-4">
                <h3 className="text-sm font-bold group-hover:text-nust-green transition-colors">
                    r/{community.slug}
                </h3>
                <p className="mt-1 text-xs text-muted line-clamp-2">
                    {community.description}
                </p>
                <div className="mt-3 flex items-center gap-1 text-xs text-muted">
                    <Users className="h-3.5 w-3.5" />
                    <span>{community.memberCount.toLocaleString()} members</span>
                </div>
                <span
                    className="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                        backgroundColor: community.bannerColor + '20',
                        color: community.bannerColor,
                    }}
                >
                    {community.category}
                </span>
            </div>
        </Link>
    );
}
