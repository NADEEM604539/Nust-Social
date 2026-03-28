import { Flair } from '@/types';

interface FlairBadgeProps {
    flair: Flair;
    size?: 'sm' | 'md';
}

export function FlairBadge({ flair, size = 'sm' }: FlairBadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-full font-medium ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
                }`}
            style={{
                color: flair.color,
                backgroundColor: flair.bgColor,
            }}
        >
            {flair.name}
        </span>
    );
}
