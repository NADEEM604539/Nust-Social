'use client';

import { useState } from 'react';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { VoteDirection } from '@/types';
import { cn } from '@/lib/utils';

interface VoteButtonsProps {
    score: number;
    userVote: VoteDirection;
    orientation?: 'vertical' | 'horizontal';
    size?: 'sm' | 'md';
}

export function VoteButtons({
    score,
    userVote: initialVote,
    orientation = 'vertical',
    size = 'md',
}: VoteButtonsProps) {
    const [vote, setVote] = useState<VoteDirection>(initialVote);
    const [currentScore, setCurrentScore] = useState(score);

    const handleVote = (direction: 'up' | 'down') => {
        if (vote === direction) {
            // Un-vote
            setVote(null);
            setCurrentScore(score);
        } else {
            setVote(direction);
            if (direction === 'up') {
                setCurrentScore(vote === 'down' ? score + 2 : score + 1);
            } else {
                setCurrentScore(vote === 'up' ? score - 2 : score - 1);
            }
        }
    };

    const iconSize = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';
    const isVertical = orientation === 'vertical';

    return (
        <div
            className={cn(
                'flex items-center gap-0.5',
                isVertical ? 'flex-col' : 'flex-row'
            )}
        >
            <button
                onClick={() => handleVote('up')}
                className={cn(
                    'rounded-md p-1 transition-colors hover:bg-nust-green/10',
                    vote === 'up'
                        ? 'text-nust-green'
                        : 'text-muted hover:text-nust-green'
                )}
                aria-label="Upvote"
            >
                <ArrowBigUp
                    className={cn(iconSize, vote === 'up' && 'fill-current')}
                />
            </button>

            <span
                className={cn(
                    'text-sm font-semibold min-w-[24px] text-center',
                    vote === 'up' && 'text-nust-green',
                    vote === 'down' && 'text-red-500',
                    !vote && 'text-foreground'
                )}
            >
                {currentScore}
            </span>

            <button
                onClick={() => handleVote('down')}
                className={cn(
                    'rounded-md p-1 transition-colors hover:bg-red-500/10',
                    vote === 'down'
                        ? 'text-red-500'
                        : 'text-muted hover:text-red-500'
                )}
                aria-label="Downvote"
            >
                <ArrowBigDown
                    className={cn(iconSize, vote === 'down' && 'fill-current')}
                />
            </button>
        </div>
    );
}
