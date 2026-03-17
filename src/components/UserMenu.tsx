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
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 overflow-hidden">
                {session.user.image ? (
                    <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                ) : (
                    initials
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                    {session.user.name || session.user.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                    {session.user.email}
                </p>
            </div>
            <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-slate-500 transition-colors flex-shrink-0"
                title="Sign out"
            >
                <LogOut className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
