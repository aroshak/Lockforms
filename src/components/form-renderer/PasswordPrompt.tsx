'use client';

import { useState } from 'react';
import { Lock, Loader2, AlertCircle } from 'lucide-react';

interface PasswordPromptProps {
    formSlug: string;
    onSuccess: (token: string) => void;
}

export function PasswordPrompt({ formSlug, onSuccess }: PasswordPromptProps) {
    const [password, setPassword] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!password.trim()) {
            setError('Please enter a password');
            return;
        }

        setIsVerifying(true);

        try {
            const response = await fetch(`/api/forms/${formSlug}/verify-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (data.success && data.token) {
                onSuccess(data.token);
            } else {
                setError(data.error || 'Incorrect password');
                setPassword('');
            }
        } catch (err) {
            setError('Failed to verify password. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4"
            style={{
                backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(130,87,229,0.08), transparent 60%)'
            }}
        >
            <div className="w-full max-w-md">
                <div className="glass-card rounded-2xl shadow-2xl shadow-primary/10 p-8 space-y-6">
                    {/* Icon */}
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                            <Lock className="w-8 h-8 text-primary-400" />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white">
                            Password Required
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            This form is password-protected. Please enter the password to continue.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                placeholder="Enter password"
                                className="w-full px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                                autoFocus
                                disabled={isVerifying}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-300">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isVerifying || !password.trim()}
                            className="w-full px-4 py-3 bg-primary text-white font-medium rounded-lg hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                            {isVerifying ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Access Form'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-xs text-center text-muted-foreground/60">
                        Don&apos;t have the password? Contact the form owner.
                    </p>
                </div>
            </div>
        </div>
    );
}
