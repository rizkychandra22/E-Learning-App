import {
    LayoutDashboard, Users, BookOpen, FileText, MessageSquare, ClipboardList,
    Award, Settings, GraduationCap, Shield, UserCheck, FolderOpen,
    BarChart3, ChevronLeft, ChevronRight, X, Wallet, Activity, Bell, CircleHelp, CalendarDays
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
        { title: 'Laporan Akademik', url: '/academic-reports', icon: BarChart3 },
        { title: 'Notifikasi', url: '/notifications', icon: Bell },
        { title: 'Pengaturan', url: '/settings', icon: Settings },
    ],
    finance: [
        { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
        { title: 'Tagihan', url: '/finance-invoices', icon: FileText },
        { title: 'Pembayaran', url: '/finance-payments', icon: Wallet },
        { title: 'Verifikasi Bayar', url: '/finance-verifications', icon: UserCheck },
        { title: 'Laporan Keuangan', url: '/finance-reports', icon: BarChart3 },
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
        { title: 'Absensi', url: '/attendance', icon: CalendarDays },
        { title: 'Penilaian', url: '/grades', icon: BarChart3 },
        { title: 'Notifikasi', url: '/notifications', icon: Bell },
    ],
    mahasiswa: [
        { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
        { title: 'Kursus Saya', url: '/my-courses', icon: BookOpen },
        { title: 'Materi', url: '/materials', icon: FileText },
        { title: 'Tugas', url: '/assignments', icon: ClipboardList },
        { title: 'Kuis', url: '/quizzes', icon: Award },
        { title: 'Nilai', url: '/grades', icon: BarChart3 },
        { title: 'Diskusi', url: '/discussions', icon: MessageSquare },
        { title: 'Notifikasi', url: '/notifications', icon: Bell },
        { title: 'Jadwal', url: '/schedule', icon: CalendarDays },
        { title: 'Sertifikat', url: '/certificates', icon: Award },
    ],
};

export function AppSidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
    const { user } = useAuth();
    const page = usePage();
    const system = page.props?.system ?? {};
    const platformName = String(system.platform_name ?? 'Smart Learning')
        .replace(/\s*campus\s*$/i, '')
        .trim() || 'Smart Learning';

    if (!user) return null;

    const navItems = navByRole[user.role] || [];
    const currentPath = page.url.split('?')[0];
    const showLabel = !collapsed;

    return (
        <>
            {mobileOpen && <button type="button" onClick={onCloseMobile} className="fixed inset-0 bg-black/40 z-30 lg:hidden" aria-label="Close sidebar overlay" />}

            <aside
                className={cn(
                    'flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 min-h-screen lg:h-screen lg:sticky lg:top-0 lg:translate-x-0 lg:z-auto shadow-card overflow-y-auto',
                    collapsed ? 'lg:w-20' : 'lg:w-72',
                    'fixed inset-y-0 left-0 z-40 w-72',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className={cn('flex items-center gap-3 border-b border-sidebar-border', collapsed ? 'h-16 px-3 justify-center' : 'h-16 px-4')}>
                    <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-card-lg">
                        <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    {showLabel && <span className="font-bold text-lg text-foreground tracking-tight truncate">{platformName}</span>}
                    <button type="button" onClick={onCloseMobile} className="ml-auto p-1.5 rounded-md hover:bg-sidebar-accent lg:hidden" aria-label="Close sidebar">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <nav className={cn('flex-1 min-h-0 overflow-y-auto', collapsed ? 'py-3 px-2 space-y-1' : 'py-3 px-3 space-y-1')}>
                    {navItems.map((item) => {
                        const isActive = currentPath === item.url;
                        return (
                            <Link
                                key={item.url}
                                href={item.url}
                                onClick={onCloseMobile}
                                className={cn(
                                    'group relative flex items-center rounded-2xl border border-transparent transition-all duration-200',
                                    collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2 text-sm font-semibold',
                                    isActive
                                        ? 'bg-sidebar-accent text-sidebar-primary border-sidebar-border'
                                        : 'text-sidebar-foreground hover:bg-sidebar-accent/75 hover:text-sidebar-accent-foreground'
                                )}
                            >
                                <span
                                    className={cn(
                                        'inline-flex items-center justify-center rounded-xl transition-colors',
                                        collapsed ? 'h-9 w-9' : 'h-8 w-8',
                                        isActive
                                            ? 'bg-primary/15 text-primary'
                                            : 'text-sidebar-foreground group-hover:text-primary'
                                    )}
                                >
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                </span>
                                {showLabel && <span>{item.title}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className={cn('mt-2 mb-2 pt-3 border-t border-sidebar-border/80', collapsed ? 'mx-2' : 'mx-3')}>
                    {showLabel ? (
                        <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/70 p-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/15 text-primary grid place-items-center mb-2">
                                <CircleHelp className="w-4 h-4" />
                            </div>
                            <p className="font-semibold text-sm text-sidebar-accent-foreground">Pusat Bantuan</p>
                            <p className="text-xs text-sidebar-foreground/85 mt-0.5">Butuh bantuan? Hubungi kami.</p>
                            <Link
                                href="/help-center"
                                onClick={onCloseMobile}
                                className="mt-2.5 w-full inline-flex items-center justify-center rounded-xl bg-primary/20 hover:bg-primary/30 text-sidebar-accent-foreground px-3 py-1.5 text-xs font-semibold transition-colors"
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
