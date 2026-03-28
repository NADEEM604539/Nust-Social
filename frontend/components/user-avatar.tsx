import { getAvatarColor, getInitials } from '@/lib/utils';

interface UserAvatarProps {
    username: string;
    displayName: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    avatarColor?: string;
}

const sizeMap = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-20 w-20 text-2xl',
};

export function UserAvatar({
    username,
    displayName,
    size = 'md',
    avatarColor,
}: UserAvatarProps) {
    const color = avatarColor || getAvatarColor(username);
    const initials = getInitials(displayName);

    return (
        <div
            className={`flex items-center justify-center rounded-full font-bold text-white shrink-0 ${sizeMap[size]}`}
            style={{ backgroundColor: color }}
        >
            {initials}
        </div>
    );
}
