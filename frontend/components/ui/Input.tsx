// components/ui/Input.tsx
import React from 'react';

type InputSize = 'sm' | 'md' | 'lg';
type InputIcon = 'email' | 'password' | 'user' | 'search' | 'none';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: InputIcon;
  size?: InputSize;
  showPasswordToggle?: boolean;
  isError?: boolean;
  helperText?: string;
}

const iconMap: Record<InputIcon, string> = {
  email: '✉',
  password: '👁‍🗨',
  user: '👤',
  search: '🔍',
  none: '',
};

const sizeClasses: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-4 py-3 text-lg',
};

export function Input({
  icon = 'none',
  size = 'md',
  showPasswordToggle = false,
  isError = false,
  helperText = '',
  type = 'text',
  className = '',
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  const baseClasses =
    'w-full rounded-xl bg-white/5 border text-white placeholder-gray-500 focus:outline-none transition-all duration-200';
  const borderClass = isError
    ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
    : 'border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20';

  const displayType = showPassword && type === 'password' ? 'text' : type;

  return (
    <div>
      <div className="relative">
        <input
          type={displayType}
          className={`${baseClasses} ${borderClass} ${sizeClasses[size]} ${className}`}
          {...props}
        />
        {icon !== 'none' && (
          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            {iconMap[icon]}
          </span>
        )}
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
          >
            {showPassword ? '👁' : '👁‍🗨'}
          </button>
        )}
      </div>
      {helperText && (
        <p className={`text-xs mt-1 ${isError ? 'text-red-400' : 'text-gray-400'}`}>{helperText}</p>
      )}
    </div>
  );
}
