'use client';

import { useSession, signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function UserMenu() {
    const { data: session } = useSession();

    if (!session?.user) return null;

    const initials = (session.user.name || session.user.email || '?')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                {session.user.image ? (
                    <img src={session.user.image} alt="" className="w-full h-full rounded-lg object-cover" />
                ) : (
                    initials
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                    {session.user.name || session.user.email}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                    {session.user.email}
                </p>
            </div>
            <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition-colors"
                title="Sign out"
            >
                <LogOut className="w-4 h-4" />
            </button>
        </div>
    );
}
