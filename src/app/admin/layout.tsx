import Link from "next/link";
import { LayoutDashboard, Settings, PlusCircle, Users, ShieldCheck } from "lucide-react";
import AuthProvider from "@/components/AuthProvider";
import UserMenu from "@/components/UserMenu";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <div className="flex min-h-screen bg-background text-foreground font-display selection:bg-primary/30">
                {/* Side Navigation Bar */}
                <aside className="w-64 border-r border-border flex flex-col h-screen sticky top-0 bg-background z-50 hidden md:flex">
                    <div className="p-6 flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight text-white tracking-tight">LockForms</h1>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Zero Trust</p>
                        </div>
                    </div>

                    <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                        <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors bg-primary/10 text-primary border-r-2 border-primary">
                            <LayoutDashboard className="w-5 h-5" />
                            Dashboard
                        </Link>

                        <Link href="/admin/builder" className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors hover:bg-white/5 text-muted-foreground hover:text-white">
                            <PlusCircle className="w-5 h-5" />
                            Form Builder
                        </Link>

                        <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors hover:bg-white/5 text-muted-foreground hover:text-white">
                            <Users className="w-5 h-5" />
                            Audience / Users
                        </Link>

                        <div className="pt-4 pb-2">
                            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Account</p>
                        </div>

                        <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors hover:bg-white/5 text-muted-foreground hover:text-white">
                            <Settings className="w-5 h-5" />
                            Settings
                        </Link>
                    </nav>

                    <div className="p-4 border-t border-border mt-auto">
                        <UserMenu />
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
                    {/* Top Bar Mobile */}
                    <div className="md:hidden h-16 border-b border-border flex items-center px-4 bg-background/80 backdrop-blur-md sticky top-0 z-40">
                        <ShieldCheck className="w-5 h-5 text-primary mr-2" />
                        <span className="font-display font-bold text-lg text-white">LockForms</span>
                    </div>

                    <div className="flex-1">
                        {children}
                    </div>
                </main>
            </div>
        </AuthProvider>
    );
}
