'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Lock, Loader2 } from 'lucide-react';
import { login } from './actions';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await login(password);

        if (result.success) {
            router.push('/admin');
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0B0E14]">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-[#0B0E14] to-[#0B0E14]" />

            <Card className="w-full max-w-md relative z-10 glass-card rounded-2xl shadow-2xl shadow-primary/10">
                <CardHeader className="space-y-4 text-center pb-8 pt-10">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-primary-400 flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-white">
                        Access Control
                    </CardTitle>
                    <CardDescription className="text-base text-primary-200/60">
                        Enter your credentials to unlock the vault.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Master Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-14 text-lg px-4 bg-primary/5 border border-primary/20 focus:border-primary/50 focus:bg-primary/10 transition-all text-center tracking-widest placeholder:tracking-normal placeholder:text-white/20 text-white"
                            />
                        </div>
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-medium bg-primary text-white shadow-lg shadow-primary/20 hover:brightness-110 transition-all duration-300"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Unlock Dashboard"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
