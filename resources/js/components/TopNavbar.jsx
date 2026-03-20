import { Bell, Sun, Moon, Search, Menu, UserCog, LogOut, ChevronDown } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
        { title: 'Performance Logs', url: '/perf-logs' },
        { title: 'Pengaturan', url: '/settings' },
        { title: 'Profil Saya', url: '/profile' },
    ],
    admin: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Kelola User', url: '/manage-users' },
        { title: 'Kelola Kursus', url: '/manage-courses' },
        { title: 'Persetujuan Akun', url: '/approvals' },
        { title: 'Kategori', url: '/categories' },
        { title: 'Pengaturan', url: '/settings' },
        { title: 'Profil Saya', url: '/profile' },
    ],
    finance: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Tagihan', url: '/finance-invoices' },
        { title: 'Pembayaran', url: '/finance-payments' },
        { title: 'Laporan', url: '/finance-reports' },
        { title: 'Pengaturan', url: '/settings' },
        { title: 'Profil Saya', url: '/profile' },
    ],
    dosen: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Kursus Saya', url: '/my-courses' },
        { title: 'Materi', url: '/materials' },
        { title: 'Tugas', url: '/assignments' },
        { title: 'Kuis', url: '/quizzes' },
        { title: 'Diskusi', url: '/discussions' },
        { title: 'Mahasiswa', url: '/students' },
        { title: 'Profil Saya', url: '/profile' },
    ],
    mahasiswa: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Kursus Saya', url: '/my-courses' },
        { title: 'Materi', url: '/materials' },
        { title: 'Tugas', url: '/assignments' },
        { title: 'Kuis', url: '/quizzes' },
        { title: 'Nilai', url: '/grades' },
        { title: 'Diskusi', url: '/discussions' },
        { title: 'Profil Saya', url: '/profile' },
    ],
};

const roleLabels = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    finance: 'Finance',
    dosen: 'Dosen',
    mahasiswa: 'Mahasiswa',
};

function createNotificationsByRole(role) {
    const common = [
        { id: 1, title: 'Selamat datang di dashboard', description: 'Lihat update terbaru dari sistem.', url: '/dashboard', unread: true },
    ];

    const byRole = {
        super_admin: [
            { id: 2, title: 'Cek statistik global', description: 'Pantau ringkasan data lintas role.', url: '/statistics', unread: true },
            { id: 3, title: 'Lihat log aktivitas', description: 'Audit aktivitas user terbaru.', url: '/activity-logs', unread: false },
        ],
        admin: [
            { id: 2, title: 'Persetujuan akun menunggu', description: 'Buka halaman approvals untuk meninjau.', url: '/approvals', unread: true },
            { id: 3, title: 'Kelola kursus', description: 'Pastikan data mata kuliah terbarui.', url: '/manage-courses', unread: false },
        ],
        finance: [
            { id: 2, title: 'Pembayaran baru masuk', description: 'Verifikasi pembayaran terbaru.', url: '/finance-payments', unread: true },
            { id: 3, title: 'Tagihan perlu ditinjau', description: 'Periksa invoice yang belum lunas.', url: '/finance-invoices', unread: false },
        ],
        dosen: [
            { id: 2, title: 'Kuis perlu dipublikasikan', description: 'Cek kembali kuis yang sudah dibuat.', url: '/quizzes', unread: true },
            { id: 3, title: 'Diskusi kelas aktif', description: 'Balas diskusi mahasiswa terbaru.', url: '/discussions', unread: false },
        ],
        mahasiswa: [
            { id: 2, title: 'Tugas mendekati deadline', description: 'Segera buka halaman tugas.', url: '/assignments', unread: true },
            { id: 3, title: 'Kuis baru tersedia', description: 'Kerjakan kuis terbaru di kelasmu.', url: '/quizzes', unread: false },
        ],
    };

    return [...common, ...(byRole[role] ?? [])];
}

export function TopNavbar({ onOpenMobileSidebar }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [query, setQuery] = useState('');
    const [openProfileMenu, setOpenProfileMenu] = useState(false);
    const [openNotificationMenu, setOpenNotificationMenu] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const profileMenuRef = useRef(null);
    const notificationMenuRef = useRef(null);
    const userRole = user?.role ?? 'mahasiswa';
    const roleMenus = useMemo(() => navByRole[userRole] || [], [userRole]);
    const unreadCount = notifications.filter((item) => item.unread).length;

    useEffect(() => {
        if (!user) {
            return;
        }

        setNotifications(createNotificationsByRole(user.role));
    }, [user]);

    if (!user) return null;

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

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setOpenProfileMenu(false);
            }
            if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
                setOpenNotificationMenu(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const handleLogout = () => {
        setIsLoggingOut(true);
        setOpenProfileMenu(false);
        logout();
    };

    const markAllNotificationsRead = () => {
        setNotifications((previous) => previous.map((item) => ({ ...item, unread: false })));
    };

    const openNotification = (item) => {
        setNotifications((previous) => previous.map((entry) => (entry.id === item.id ? { ...entry, unread: false } : entry)));
        setOpenNotificationMenu(false);
        if (item.url) {
            router.visit(item.url);
        }
    };

    return (
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <button type="button" onClick={onOpenMobileSidebar} className="p-2 rounded-lg hover:bg-secondary transition-colors lg:hidden" aria-label="Open sidebar">
                    <Menu className="w-5 h-5 text-muted-foreground" />
                </button>

                <form onSubmit={handleSearch} className="relative w-full max-w-md hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Cari menu, contoh: kursus, tugas, nilai..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                    />
                </form>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-secondary transition-colors" aria-label="Toggle theme">
                    {theme === 'light' ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
                </button>
                <div className="relative" ref={notificationMenuRef}>
                    <button
                        type="button"
                        onClick={() => {
                            setOpenNotificationMenu((prev) => !prev);
                            setOpenProfileMenu(false);
                        }}
                        className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
                        aria-haspopup="menu"
                        aria-expanded={openNotificationMenu}
                    >
                        <Bell className="w-5 h-5 text-muted-foreground" />
                        {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 min-w-2 h-2 px-1 rounded-full bg-destructive text-[9px] text-white leading-[8px]" />}
                    </button>

                    {openNotificationMenu && (
                        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl border border-border bg-card shadow-card z-30 overflow-hidden">
                            <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
                                <div>
                                    <p className="text-sm font-semibold">Notifikasi</p>
                                    <p className="text-xs text-muted-foreground">{unreadCount} belum dibaca</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={markAllNotificationsRead}
                                    className="text-xs px-2 py-1 rounded-md border border-border hover:bg-secondary transition-colors"
                                >
                                    Tandai semua dibaca
                                </button>
                            </div>

                            <div className="max-h-80 overflow-auto p-2 space-y-1">
                                {notifications.length === 0 && <p className="text-sm text-muted-foreground px-2 py-3">Belum ada notifikasi.</p>}
                                {notifications.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => openNotification(item)}
                                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className={`mt-1.5 w-2 h-2 rounded-full ${item.unread ? 'bg-destructive' : 'bg-muted-foreground/40'}`} />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{item.title}</p>
                                                <p className="text-xs text-muted-foreground">{item.description}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="relative" ref={profileMenuRef}>
                    <button
                        type="button"
                        onClick={() => {
                            setOpenProfileMenu((prev) => !prev);
                            setOpenNotificationMenu(false);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-secondary transition-colors"
                        aria-haspopup="menu"
                        aria-expanded={openProfileMenu}
                    >
                        {user.profile_photo_url ? (
                            <img src={user.profile_photo_url} alt="Foto profil" className="w-9 h-9 rounded-full object-cover border border-border" />
                        ) : (
                            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                                {user.name.charAt(0)}
                            </div>
                        )}
                        <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
                    </button>

                    {openProfileMenu && (
                        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-card z-30 overflow-hidden">
                            <div className="px-4 py-3 border-b border-border">
                                <p className="text-sm font-semibold truncate">{user.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{roleLabels[user.role] ?? user.role}</p>
                            </div>
                            <div className="p-2 space-y-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpenProfileMenu(false);
                                        router.visit('/profile');
                                    }}
                                    className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-secondary transition-colors"
                                >
                                    <UserCog className="w-4 h-4" />
                                    Edit Profil
                                </button>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-60"
                                >
                                    {isLoggingOut ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : <LogOut className="w-4 h-4" />}
                                    {isLoggingOut ? 'Keluar...' : 'Keluar'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
