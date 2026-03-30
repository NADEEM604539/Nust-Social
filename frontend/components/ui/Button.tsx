// components/ui/Button.tsx
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';
type GradientColor = 'purple-pink' | 'blue-cyan' | 'green-emerald' | 'orange-red' | 'indigo-purple' | 'teal-cyan';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  gradient?: GradientColor;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const gradientClasses: Record<GradientColor, string> = {
  'purple-pink': 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:shadow-purple-500/30',
  'blue-cyan': 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 hover:shadow-blue-500/30',
  'green-emerald': 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:shadow-green-500/30',
  'orange-red': 'from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:shadow-orange-500/30',
  'indigo-purple': 'from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30',
  'teal-cyan': 'from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 hover:shadow-teal-500/30',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-4 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  gradient = 'purple-pink',
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled = false,
  children,
  ...props
}: ButtonProps) {
  const baseClasses =
    'font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed';

  let variantClasses = '';

  if (variant === 'primary') {
    variantClasses = `bg-gradient-to-r ${gradientClasses[gradient]} text-white shadow-lg hover:shadow-xl ${disabled || isLoading ? 'from-gray-500 to-gray-600 shadow-none' : ''}`;
  } else if (variant === 'secondary') {
    variantClasses =
      'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-300 hover:text-white';
  } else if (variant === 'danger') {
    variantClasses =
      'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-300';
  } else if (variant === 'success') {
    variantClasses =
      'bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 hover:border-green-500/50 hover:text-green-300';
  }

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
      )}
      {children}
    </button>
  );
}
