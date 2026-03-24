import {
    LayoutDashboard, Users, BookOpen, FileText, MessageSquare, ClipboardList,
    Award, Settings, GraduationCap, Shield, UserCheck, FolderOpen,
    BarChart3, ChevronLeft, ChevronRight, X, Wallet, Activity, Bell, CircleHelp
} from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/cn';

const navByRole = {
    super_admin: [
        { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
        { title: 'Kelola Admin', url: '/manage-admins', icon: Shield },
        { title: 'Kelola Dosen', url: '/manage-lecturers', icon: UserCheck },
        { title: 'Kelola Mahasiswa', url: '/manage-students', icon: Users },
        { title: 'Statistik Global', url: '/statistics', icon: BarChart3 },
        { title: 'Log Aktivitas', url: '/activity-logs', icon: FileText },
        { title: 'Performance Logs', url: '/perf-logs', icon: Activity },
        { title: 'Notifikasi', url: '/notifications', icon: Bell },
        { title: 'Pengaturan', url: '/settings', icon: Settings },
    ],
    admin: [
        { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
        { title: 'Kelola User', url: '/manage-users', icon: Users },
        { title: 'Kelola Kursus', url: '/manage-courses', icon: BookOpen },
        { title: 'Persetujuan Akun', url: '/approvals', icon: UserCheck },
        { title: 'Kategori', url: '/categories', icon: FolderOpen },
        { title: 'Notifikasi', url: '/notifications', icon: Bell },
        { title: 'Pengaturan', url: '/settings', icon: Settings },
    ],
    finance: [
        { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
        { title: 'Tagihan', url: '/finance-invoices', icon: FileText },
        { title: 'Pembayaran', url: '/finance-payments', icon: Wallet },
        { title: 'Laporan', url: '/finance-reports', icon: BarChart3 },
        { title: 'Notifikasi', url: '/notifications', icon: Bell },
        { title: 'Pengaturan', url: '/settings', icon: Settings },
    ],
    dosen: [
        { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
        { title: 'Kursus Saya', url: '/my-courses', icon: BookOpen },
        { title: 'Materi', url: '/materials', icon: FileText },
        { title: 'Tugas', url: '/assignments', icon: ClipboardList },
        { title: 'Kuis', url: '/quizzes', icon: Award },
        { title: 'Diskusi', url: '/discussions', icon: MessageSquare },
        { title: 'Mahasiswa', url: '/students', icon: Users },
        { title: 'Notifikasi', url: '/notifications', icon: Bell },
    ],
    mahasiswa: [
        { title: 'Beranda', url: '/dashboard', icon: LayoutDashboard },
        { title: 'Kursus Saya', url: '/my-courses', icon: BookOpen },
        { title: 'Materi', url: '/materials', icon: FileText },
        { title: 'Tugas', url: '/assignments', icon: ClipboardList },
        { title: 'Kuis', url: '/quizzes', icon: Award },
        { title: 'Nilai', url: '/grades', icon: BarChart3 },
        { title: 'Diskusi', url: '/discussions', icon: MessageSquare },
        { title: 'Notifikasi', url: '/notifications', icon: Bell },
    ],
};

export function AppSidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
    const { user } = useAuth();
    const page = usePage();

    if (!user) return null;

    const navItems = navByRole[user.role] || [];
    const currentPath = page.url.split('?')[0];
    const showLabel = !collapsed;

    return (
        <>
            {mobileOpen && <button type="button" onClick={onCloseMobile} className="fixed inset-0 bg-black/40 z-30 lg:hidden" aria-label="Close sidebar overlay" />}

            <aside
                className={cn(
                    'flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 min-h-screen lg:h-screen lg:sticky lg:top-0 lg:translate-x-0 lg:z-auto',
                    collapsed ? 'lg:w-16' : 'lg:w-64',
                    'fixed inset-y-0 left-0 z-40 w-72',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
                    <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-5 h-5 text-primary-foreground" />
                    </div>
                    {showLabel && <span className="font-bold text-lg text-sidebar-primary-foreground tracking-tight">Smart Learning</span>}
                    <button type="button" onClick={onCloseMobile} className="ml-auto p-1.5 rounded-md hover:bg-sidebar-accent lg:hidden" aria-label="Close sidebar">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-hidden">
                    {navItems.map((item) => {
                        const isActive = currentPath === item.url;
                        return (
                            <Link
                                key={item.url}
                                href={item.url}
                                onClick={onCloseMobile}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                                    isActive ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                )}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {showLabel && <span>{item.title}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mx-2 mt-2 mb-2 pt-2 border-t border-sidebar-border/80">
                    {showLabel ? (
                        <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/85 p-2.5">
                            <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 text-sidebar-primary grid place-items-center mb-2">
                                <CircleHelp className="w-4 h-4" />
                            </div>
                            <p className="font-semibold text-sm text-sidebar-primary-foreground">Pusat Bantuan</p>
                            <p className="text-xs text-sidebar-foreground/80 mt-0.5">Butuh bantuan? Hubungi kami.</p>
                            <Link
                                href="/help-center"
                                onClick={onCloseMobile}
                                className="mt-2 w-full inline-flex items-center justify-center rounded-lg bg-sidebar-primary/20 hover:bg-sidebar-primary/30 text-sidebar-primary-foreground px-2.5 py-1.5 text-xs font-semibold transition-colors"
                            >
                                Buka Bantuan
                            </Link>
                        </div>
                    ) : (
                        <Link
                            href="/help-center"
                            onClick={onCloseMobile}
                            className="hidden lg:flex h-10 w-10 mx-auto rounded-xl bg-sidebar-accent border border-sidebar-border items-center justify-center text-sidebar-primary hover:text-sidebar-primary-foreground transition-colors"
                            title="Pusat Bantuan"
                            aria-label="Pusat Bantuan"
                        >
                            <CircleHelp className="w-5 h-5" />
                        </Link>
                    )}
                </div>

                <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="hidden lg:flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground transition-colors mt-auto"
                    aria-label="Toggle sidebar width"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </aside>
        </>
    );
}
