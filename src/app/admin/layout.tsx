import Link from "next/link";
import { LayoutDashboard, Settings, LogOut, PlusCircle } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 bg-black/20 backdrop-blur-xl hidden md:flex flex-col fixed inset-y-0 z-50">
                <div className="p-6 pl-8">
                    <h1 className="text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-indigo-400 tracking-tight">
                        LockForms
                    </h1>
                    <p className="text-xs text-primary-200/50 mt-1 uppercase tracking-wider font-semibold">Enterprise Console</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-500/10 text-primary-100 shadow-[0_0_15px_rgba(130,87,229,0.1)] border border-primary-500/20 transition-all hover:bg-primary-500/20 hover:shadow-[0_0_20px_rgba(130,87,229,0.3)] group">
                        <LayoutDashboard className="w-5 h-5 text-primary-400 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Dashboard</span>
                    </Link>

                    <Link href="/admin/builder" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-all group">
                        <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">New Form</span>
                    </Link>
                </nav>

                <div className="p-6 border-t border-white/5">
                    <Link href="/api/auth/signout" className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-red-400 cursor-pointer transition-colors">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 md:ml-64 relative min-h-screen">
                {/* Top Bar Mobile (visible only on small screens) */}
                <div className="md:hidden h-16 border-b border-white/10 flex items-center px-4 bg-black/20 backdrop-blur-md sticky top-0 z-40">
                    <span className="font-display font-bold text-lg">LockForms</span>
                </div>

                <div className="p-8 max-w-7xl mx-auto animate-fade-in-up">
                    {children}
                </div>
            </main>
        </div>
    )
}
