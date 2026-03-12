'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Lock, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const callbackUrl = searchParams.get('callbackUrl') || '/admin';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await signIn('credentials', {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            setError(result.error === 'CredentialsSignin'
                ? 'Invalid email or password'
                : result.error
            );
            setLoading(false);
        } else {
            router.push(callbackUrl);
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/20 via-background to-background" />
            <div className="absolute top-0 left-0 w-full h-full bg-noise opacity-50" />

            <Card className="w-full max-w-md relative z-10 glass border-white/5 shadow-2xl">
                <CardHeader className="space-y-4 text-center pb-6 pt-10">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-500/20 mb-2">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-display font-bold tracking-tight text-white">
                        Access Control
                    </CardTitle>
                    <CardDescription className="text-lg text-primary-200/60">
                        Sign in to unlock the vault.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 px-4 bg-black/20 border-white/10 focus:border-primary-500/50 focus:bg-black/40 transition-all placeholder:text-white/20"
                                required
                                autoComplete="email"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12 px-4 bg-black/20 border-white/10 focus:border-primary-500/50 focus:bg-black/40 transition-all placeholder:text-white/20"
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-medium bg-primary-600 hover:bg-primary-500 transition-all duration-300 shadow-[0_0_20px_rgba(130,87,229,0.3)] hover:shadow-[0_0_30px_rgba(130,87,229,0.6)]"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : null}
                            {loading ? 'Signing in...' : 'Unlock Dashboard'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-muted-foreground/40">
                            Native Authentication — Air-Gapped Secure
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
