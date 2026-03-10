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
                // Password is correct — pass the verification token to parent
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                    {/* Icon */}
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <Lock className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Password Required
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
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
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                autoFocus
                                disabled={isVerifying}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isVerifying || !password.trim()}
                            className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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
                    <p className="text-xs text-center text-gray-500">
                        Don't have the password? Contact the form owner.
                    </p>
                </div>
            </div>
        </div>
    );
}
