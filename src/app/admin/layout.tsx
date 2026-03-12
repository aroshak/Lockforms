import Link from "next/link";
import { LayoutDashboard, PlusCircle, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-[#0B0E14]">
            {/* Sidebar */}
            <aside className="w-64 border-r border-primary/10 sidebar-glass hidden md:flex flex-col fixed inset-y-0 z-50">
                {/* Logo */}
                <div className="p-6 pl-8 border-b border-primary/10">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-300 tracking-tight">
                        LockForms
                    </h1>
                    <p className="text-xs text-primary-200/50 mt-1 uppercase tracking-wider font-semibold">Enterprise Console</p>
                </div>

                <nav className="flex-1 px-3 space-y-1 mt-4">
                    <Link
                        href="/admin"
                        className="sidebar-active flex items-center gap-3 px-4 py-3 rounded-l-lg text-primary-200 font-medium transition-all group"
                    >
                        <LayoutDashboard className="w-5 h-5 text-primary-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                        <span>Dashboard</span>
                    </Link>

                    <Link
                        href="/admin/builder"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-white hover:bg-primary/5 transition-all group"
                    >
                        <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
                        <span className="font-medium">New Form</span>
                    </Link>
                </nav>

                <div className="p-6 border-t border-primary/10">
                    <Link
                        href="/api/auth/signout"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-red-400 cursor-pointer transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 md:ml-64 relative min-h-screen">
                {/* Sticky top bar */}
                <div className="h-20 border-b border-primary/10 backdrop-blur-md bg-[#0B0E14]/80 sticky top-0 z-40 flex items-center px-8 md:hidden">
                    <span className="font-bold text-lg text-white">LockForms</span>
                </div>

                <div className="p-8 max-w-7xl mx-auto animate-fade-in-up">
                    {children}
                </div>
            </main>
        </div>
    );
}
