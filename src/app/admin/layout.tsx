import AuthProvider from "@/components/AuthProvider";
import { AdminSidebar } from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <div className="flex min-h-screen bg-[#0B0E14] text-foreground selection:bg-primary/30">

                {/* ── Sidebar (client component — needs usePathname) ── */}
                <AdminSidebar />

                {/* ── Main Content ── */}
                <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                    {/* Mobile top bar */}
                    <div className="md:hidden h-16 border-b border-slate-800 flex items-center px-4 bg-[#0B0E14]/80 backdrop-blur-md sticky top-0 z-40">
                        <span className="font-bold text-lg text-white">LockForms</span>
                    </div>
                    {children}
                </main>

            </div>
        </AuthProvider>
    );
}
