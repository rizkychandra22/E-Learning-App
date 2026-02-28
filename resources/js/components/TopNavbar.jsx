import { Bell, Sun, Moon, Search } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const navByRole = {
    super_admin: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Kelola Admin', url: '/manage-admins' },
        { title: 'Kelola Dosen', url: '/manage-lecturers' },
        { title: 'Kelola Mahasiswa', url: '/manage-students' },
        { title: 'Statistik Global', url: '/statistics' },
        { title: 'Log Aktivitas', url: '/activity-logs' },
        { title: 'Pengaturan', url: '/settings' },
    ],
    admin: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Kelola User', url: '/manage-users' },
        { title: 'Kelola Kursus', url: '/manage-courses' },
        { title: 'Persetujuan Akun', url: '/approvals' },
        { title: 'Kategori', url: '/categories' },
        { title: 'Pengaturan', url: '/settings' },
    ],
    dosen: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Kursus Saya', url: '/my-courses' },
        { title: 'Materi', url: '/materials' },
        { title: 'Tugas', url: '/assignments' },
        { title: 'Kuis', url: '/quizzes' },
        { title: 'Diskusi', url: '/discussions' },
        { title: 'Mahasiswa', url: '/students' },
    ],
    mahasiswa: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Kursus Saya', url: '/my-courses' },
        { title: 'Materi', url: '/materials' },
        { title: 'Tugas', url: '/assignments' },
        { title: 'Kuis', url: '/quizzes' },
        { title: 'Nilai', url: '/grades' },
        { title: 'Diskusi', url: '/discussions' },
    ],
};

export function TopNavbar() {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [query, setQuery] = useState('');

    if (!user) return null;

    const roleMenus = useMemo(() => navByRole[user.role] || [], [user.role]);

    const handleSearch = (event) => {
        event.preventDefault();
        const keyword = query.trim().toLowerCase();

        if (!keyword) {
            return;
        }

        const match = roleMenus.find((menu) => menu.title.toLowerCase().includes(keyword) || menu.url.toLowerCase().includes(keyword));
        if (match) {
            router.visit(match.url);
            setQuery('');
        }
    };

    return (
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4 flex-1">
                <form onSubmit={handleSearch} className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Cari menu, contoh: kursus, tugas, nilai..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                    />
                </form>
            </div>

            <div className="flex items-center gap-4">
                <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-secondary transition-colors" aria-label="Toggle theme">
                    {theme === 'light' ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
                </button>
                <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                        {user.name.charAt(0)}
                    </div>
                    <div className="hidden md:block">
                        <p className="text-sm font-medium leading-tight">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
