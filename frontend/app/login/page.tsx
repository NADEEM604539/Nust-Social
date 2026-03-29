'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = () => {
        const errs: typeof errors = {};
        if (!email) errs.email = 'Email is required';
        else if (!email.includes('@')) errs.email = 'Invalid email address';
        if (!password) errs.password = 'Password is required';
        else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            // No actual auth — just form state
            alert('Login form submitted (no backend connected)');
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 py-12">
            <div className="w-full max-w-md animate-fade-in">
                {/* Branding */}
                <div className="text-center mb-8">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-nust-green shadow-lg">
                        <span className="text-xl font-bold text-white">N</span>
                    </div>
                    <h1 className="mt-4 text-2xl font-bold">Welcome back</h1>
                    <p className="mt-1 text-sm text-muted">
                        Sign in to your NUSTConnect account
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@nust.edu.pk"
                                className={`w-full rounded-lg border ${errors.email ? 'border-red-500' : 'border-border'} bg-input-bg py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-nust-green focus:outline-none focus:ring-1 focus:ring-nust-green transition-colors`}
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className={`w-full rounded-lg border ${errors.password ? 'border-red-500' : 'border-border'} bg-input-bg py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted focus:border-nust-green focus:outline-none focus:ring-1 focus:ring-nust-green transition-colors`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-border accent-nust-green"
                            />
                            <span className="text-muted">Remember me</span>
                        </label>
                        <button type="button" className="text-nust-green hover:underline">
                            Forgot password?
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-full bg-nust-green py-3 text-sm font-semibold text-white hover:bg-nust-green-light transition-colors"
                    >
                        Sign In
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-muted">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="font-medium text-nust-gold hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
