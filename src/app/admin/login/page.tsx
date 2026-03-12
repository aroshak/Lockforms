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
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0B0E14]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-[#0B0E14] to-[#0B0E14]" />

            <Card className="w-full max-w-md relative z-10 glass-card rounded-2xl shadow-2xl shadow-primary/10 border-0">
                <CardHeader className="space-y-4 text-center pb-6 pt-10">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-primary-400 flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-white">
                        Access Control
                    </CardTitle>
                    <CardDescription className="text-base text-primary-200/60">
                        Sign in to unlock the vault.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12 px-4 bg-primary/5 border border-primary/20 focus:border-primary/50 focus:bg-primary/10 transition-all placeholder:text-white/20 text-white"
                            required
                            autoComplete="email"
                            autoFocus
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 px-4 bg-primary/5 border border-primary/20 focus:border-primary/50 focus:bg-primary/10 transition-all placeholder:text-white/20 text-white"
                            required
                            autoComplete="current-password"
                        />

                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold bg-primary text-white shadow-lg shadow-primary/20 hover:brightness-110 transition-all duration-300"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                            {loading ? 'Signing in...' : 'Unlock Dashboard'}
                        </Button>
                    </form>
                    <div className="mt-6 text-center">
                        <p className="text-xs text-slate-600">Native Authentication — Air-Gapped Secure</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
