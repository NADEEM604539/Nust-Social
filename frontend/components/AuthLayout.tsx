// components/AuthLayout.tsx
import React from 'react';

interface AuthLayoutProps {
  gradient: 'purple-pink' | 'blue-cyan' | 'green-emerald';
  icon: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const gradientBgs: Record<string, string> = {
  'purple-pink': 'from-slate-900 via-purple-900 to-slate-900',
  'blue-cyan': 'from-slate-900 via-blue-900 to-slate-900',
  'green-emerald': 'from-green-900 via-emerald-900 to-slate-900',
};

const gradientAccents: Record<string, string> = {
  'purple-pink': 'from-purple-500 to-pink-500',
  'blue-cyan': 'from-blue-500 to-cyan-500',
  'green-emerald': 'from-green-500 to-emerald-500',
};

const blobColors: Record<string, string> = {
  'purple-pink': 'bg-purple-500 bg-blue-500 bg-pink-500',
  'blue-cyan': 'bg-blue-500 bg-cyan-500 bg-purple-500',
  'green-emerald': 'bg-green-500 bg-emerald-500 bg-teal-500',
};

export function AuthLayout({
  gradient,
  icon,
  title,
  subtitle,
  children,
}: AuthLayoutProps) {
  return (
    <div className={`min-h-screen w-full bg-gradient-to-br ${gradientBgs[gradient]} flex items-center justify-center p-4 relative overflow-hidden`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientAccents[gradient]} mb-4 shadow-lg`}>
              <span className="text-2xl font-bold text-white">{icon}</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
            <p className="text-gray-300 text-sm">{subtitle}</p>
          </div>

          {/* Content */}
          {children}
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
