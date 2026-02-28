import {
    LayoutDashboard, Users, BookOpen, FileText, MessageSquare, ClipboardList,
    Award, Settings, LogOut, GraduationCap, Shield, UserCheck, FolderOpen,
    BarChart3, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';
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
        { title: 'Pengaturan', url: '/settings', icon: Settings },
    ],
    admin: [
        { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
        { title: 'Kelola User', url: '/manage-users', icon: Users },
        { title: 'Kelola Kursus', url: '/manage-courses', icon: BookOpen },
        { title: 'Persetujuan Akun', url: '/approvals', icon: UserCheck },
        { title: 'Kategori', url: '/categories', icon: FolderOpen },
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
    ],
    mahasiswa: [
        { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
        { title: 'Kursus Saya', url: '/my-courses', icon: BookOpen },
        { title: 'Materi', url: '/materials', icon: FileText },
        { title: 'Tugas', url: '/assignments', icon: ClipboardList },
        { title: 'Kuis', url: '/quizzes', icon: Award },
        { title: 'Nilai', url: '/grades', icon: BarChart3 },
        { title: 'Diskusi', url: '/discussions', icon: MessageSquare },
    ],
};

const roleLabels = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    dosen: 'Dosen',
    mahasiswa: 'Mahasiswa',
};

export function AppSidebar() {
    const { user, logout } = useAuth();
    const page = usePage();
    const [collapsed, setCollapsed] = useState(false);

    if (!user) return null;

    const navItems = navByRole[user.role] || [];
    const currentPath = page.url.split('?')[0];

    return (
        <aside className={cn('flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 min-h-screen', collapsed ? 'w-16' : 'w-64')}>
            <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5 text-primary-foreground" />
                </div>
                {!collapsed && <span className="font-bold text-lg text-sidebar-primary-foreground tracking-tight">Smart Learning</span>}
            </div>

            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = currentPath === item.url;
                    return (
                        <Link key={item.url} href={item.url} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200', isActive ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')}>
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && <span>{item.title}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-sidebar-border p-3 space-y-2">
                {!collapsed && (
                    <div className="px-2 mb-2">
                        <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{user.name}</p>
                        <p className="text-xs text-sidebar-muted truncate">{roleLabels[user.role]}</p>
                    </div>
                )}
                <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors w-full">
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>Keluar</span>}
                </button>
            </div>

            <button onClick={() => setCollapsed(!collapsed)} className="flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground transition-colors">
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
        </aside>
    );
}
