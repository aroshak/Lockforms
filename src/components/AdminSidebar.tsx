'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "@/components/UserMenu";

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: 'grid_view', exact: true },
    { href: '/admin/builder', label: 'Form Builder', icon: 'edit_note' },
    { href: '/admin/users', label: 'Users', icon: 'group' },
];

const accountItems = [
    { href: '/admin/settings', label: 'Settings', icon: 'settings' },
];

function NavLink({ href, icon, label, exact }: { href: string; icon: string; label: string; exact?: boolean }) {
    const pathname = usePathname();
    const isActive = exact ? pathname === href : pathname.startsWith(href);

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                isActive
                    ? 'bg-primary/10 text-primary border-r-2 border-primary'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
            }`}
        >
            <span
                className="material-symbols-outlined text-[20px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
                {icon}
            </span>
            {label}
        </Link>
    );
}

export function AdminSidebar() {
    return (
        <aside className="w-64 border-r border-slate-800 flex flex-col h-screen sticky top-0 bg-[#0B0E14] z-50 flex-shrink-0">

            {/* Logo */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white flex-shrink-0">
                    <span className="material-symbols-outlined text-[22px]">lock</span>
                </div>
                <div>
                    <h1 className="font-bold text-base leading-tight text-white">LockForms</h1>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Enterprise Console</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {navItems.map(item => (
                    <NavLink key={item.href} {...item} />
                ))}

                <div className="pt-4 pb-2">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Account</p>
                </div>

                {accountItems.map(item => (
                    <NavLink key={item.href} {...item} />
                ))}
            </nav>

            {/* User footer */}
            <div className="p-4 border-t border-slate-800">
                <UserMenu />
            </div>
        </aside>
    );
}
