'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { departments } from '@/lib/mock-data';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [department, setDepartment] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!username) errs.username = 'Username is required';
        else if (username.length < 3) errs.username = 'At least 3 characters';
        if (!email) errs.email = 'Email is required';
        else if (!email.endsWith('@nust.edu.pk'))
            errs.email = 'Must use a @nust.edu.pk email';
        if (!password) errs.password = 'Password is required';
        else if (password.length < 8) errs.password = 'At least 8 characters';
        if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
        if (!department) errs.department = 'Select your department';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            alert('Registration form submitted (no backend connected)');
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
                    <h1 className="mt-4 text-2xl font-bold">Join NUSTConnect</h1>
                    <p className="mt-1 text-sm text-muted">
                        Create your account with your NUST email
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-4">
                    {/* Username */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Choose a username"
                                className={`w-full rounded-lg border ${errors.username ? 'border-red-500' : 'border-border'} bg-input-bg py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-nust-green focus:outline-none focus:ring-1 focus:ring-nust-green transition-colors`}
                            />
                        </div>
                        {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">NUST Email</label>
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
                        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>

                    {/* Department */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Department</label>
                        <div className="relative">
                            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                            <select
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                className={`w-full appearance-none rounded-lg border ${errors.department ? 'border-red-500' : 'border-border'} bg-input-bg py-2.5 pl-10 pr-4 text-sm text-foreground focus:border-nust-green focus:outline-none focus:ring-1 focus:ring-nust-green transition-colors ${!department ? 'text-muted' : ''}`}
                            >
                                <option value="">Select your department</option>
                                {departments.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 8 characters"
                                className={`w-full rounded-lg border ${errors.password ? 'border-red-500' : 'border-border'} bg-input-bg py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted focus:border-nust-green focus:outline-none focus:ring-1 focus:ring-nust-green transition-colors`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter your password"
                                className={`w-full rounded-lg border ${errors.confirmPassword ? 'border-red-500' : 'border-border'} bg-input-bg py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-nust-green focus:outline-none focus:ring-1 focus:ring-nust-green transition-colors`}
                            />
                        </div>
                        {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-full bg-nust-gold py-3 text-sm font-semibold text-gray-900 hover:bg-nust-gold-dark transition-colors"
                    >
                        Create Account
                    </button>

                    <p className="text-center text-xs text-muted">
                        By signing up, you agree to NUSTConnect&apos;s Terms of Service and Privacy Policy.
                    </p>
                </form>

                <p className="mt-6 text-center text-sm text-muted">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-nust-green hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
