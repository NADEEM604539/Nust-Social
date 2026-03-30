// components/ui/Alert.tsx
import React from 'react';

type AlertType = 'error' | 'success' | 'info' | 'warning';

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
}

const alertConfig: Record<AlertType, { bg: string; border: string; text: string; icon: string }> = {
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-200',
    icon: '⚠',
  },
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-200',
    icon: '✓',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-200',
    icon: '💡',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-200',
    icon: '⚠',
  },
};

export function Alert({ type, message, onClose }: AlertProps) {
  const config = alertConfig[type];

  return (
    <div
      className={`p-4 rounded-xl ${config.bg} border ${config.border} flex items-start gap-3`}
      role="alert"
    >
      <span className="text-lg mt-0.5">{config.icon}</span>
      <div className="flex-1">
        <p className={`text-sm ${config.text}`}>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Close alert"
        >
          ✕
        </button>
      )}
    </div>
  );
}
