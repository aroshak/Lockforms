import Link from "next/link";
import { LayoutDashboard, Settings, PlusCircle, Users } from "lucide-react";
import AuthProvider from "@/components/AuthProvider";
import UserMenu from "@/components/UserMenu";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <div className="flex min-h-screen bg-[#0B0E14] text-foreground selection:bg-primary/30">

                {/* Side Navigation Bar */}
                <aside className="w-64 border-r border-primary/10 sidebar-glass hidden md:flex flex-col h-screen sticky top-0 z-50">
                    {/* Logo */}
                    <div className="p-6 border-b border-primary/10 flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-300 tracking-tight">LockForms</h1>
                            <p className="text-xs text-primary-200/50 uppercase tracking-wider font-semibold">Enterprise Console</p>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        <Link href="/admin" className="sidebar-active flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all group">
                            <LayoutDashboard className="w-5 h-5 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
                            <span>Dashboard</span>
                        </Link>
                        <Link href="/admin/builder" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-primary/5 transition-all group">
                            <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
                            <span>Form Builder</span>
                        </Link>
                        <Link href="/admin/users" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-primary/5 transition-all group">
                            <Users className="w-5 h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
                            <span>Users</span>
                        </Link>
                        <div className="pt-4 pb-2">
                            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Account</p>
                        </div>
                        <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-primary/5 transition-all group">
                            <Settings className="w-5 h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
                            <span>Settings</span>
                        </Link>
                    </nav>

                    {/* User footer — shows logged-in user + sign out */}
                    <div className="p-4 border-t border-primary/10 mt-auto">
                        <UserMenu />
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
                    <div className="md:hidden h-16 border-b border-primary/10 flex items-center px-4 bg-[#0B0E14]/80 backdrop-blur-md sticky top-0 z-40">
                        <span className="font-bold text-lg text-white">LockForms</span>
                    </div>
                    <div className="flex-1">
                        {children}
                    </div>
                </main>

            </div>
        </AuthProvider>
    );
}
