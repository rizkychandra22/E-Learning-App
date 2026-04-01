import { Head, router } from '@inertiajs/react';
import { Bell, CheckCheck, Megaphone, Search, Trash2, Info, TriangleAlert, CircleCheckBig, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { useAuth } from '@/contexts/AuthContext';

const FILTERS_FULL = [
    { key: 'all', label: 'Semua' },
    { key: 'unread', label: 'Belum Dibaca' },
    { key: 'warning', label: 'Warning' },
    { key: 'error', label: 'Error' },
    { key: 'info', label: 'Info' },
    { key: 'success', label: 'Success' },
    { key: 'broadcast', label: 'Broadcast' },
];

const FILTERS_SIMPLE = [
    { key: 'all', label: 'Semua' },
    { key: 'unread', label: 'Belum Dibaca' },
    { key: 'read', label: 'Sudah Dibaca' },
];

const typeClass = {
    warning: 'bg-warning/10 border-warning/35',
    error: 'bg-destructive/10 border-destructive/35',
    success: 'bg-success/10 border-success/35',
    broadcast: 'bg-primary/10 border-primary/35',
    info: 'bg-info/10 border-info/35',
};

function normalizeType(type = '') {
    const raw = String(type).toLowerCase();
    if (raw.includes('warn')) return 'warning';
    if (raw.includes('error')) return 'error';
    if (raw.includes('success')) return 'success';
    if (raw.includes('broadcast')) return 'broadcast';
    if (raw.includes('info')) return 'info';
    return 'info';
}

function iconByType(type) {
    if (type === 'warning') return TriangleAlert;
    if (type === 'success') return CircleCheckBig;
    if (type === 'broadcast') return Send;
    return Info;
}

function relativeTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
}

function resolveStatus(notification) {
    if (notification?.status) {
        return notification.status;
    }
    return notification?.read_at ? 'read' : 'unread';
}

function statusBadgeClass(status) {
    return status === 'read'
        ? 'bg-secondary text-secondary-foreground'
        : 'bg-primary/15 text-primary';
}

export default function NotificationIndex({ notifications = [], summary = { total: 0, unread: 0 } }) {
    const { user } = useAuth();
    const [activeFilter, setActiveFilter] = useState('all');
    const [search, setSearch] = useState('');

    const markAllRead = () => {
        router.put('/notifications/read-all', {}, { preserveScroll: true });
    };

    const markRead = (notification) => {
        if (notification.read_at) return;
        router.put(`/notifications/${notification.id}/read`, {}, { preserveScroll: true });
    };

    const mapped = useMemo(
        () => notifications.map((item) => ({ ...item, kind: normalizeType(item.type) })),
        [notifications]
    );

    const isAdminAcademic = user?.role === 'admin';
    const isTeacher = user?.role === 'teacher';
    const useSimpleFilter = user?.role === 'student' || isTeacher;
    const filters = useSimpleFilter ? FILTERS_SIMPLE : FILTERS_FULL;
    const showSearch = !useSimpleFilter;

    const filteredNotifications = useMemo(() => {
        return mapped.filter((item) => {
            const byFilter =
                activeFilter === 'all'
                    ? true
                    : activeFilter === 'unread'
                      ? !item.read_at
                      : activeFilter === 'read'
                        ? Boolean(item.read_at)
                        : item.kind === activeFilter;

            if (!byFilter) return false;

            const keyword = search.trim().toLowerCase();
            if (!keyword) return true;
            return [item.title, item.message, item.type]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(keyword));
        });
    }, [mapped, activeFilter, search]);

    return (
        <ProtectedLayout>
            <Head title="Notifikasi" />
            <div className="space-y-5 w-full max-w-none">
                <section className="dashboard-hero-panel animate-fade-in">
                    <div className="absolute inset-x-0 top-0 h-1.5 gradient-primary opacity-90" />
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <Bell className="w-6 h-6 text-primary" />
                                <h1 className="text-3xl leading-none font-bold">Notifikasi</h1>
                                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground">
                                    {summary.unread} baru
                                </span>
                            </div>
                            <p className="mt-2 text-muted-foreground">
                                {isAdminAcademic ? 'Kelola notifikasi dan kirim pengumuman' : isTeacher ? 'Aktivitas terbaru di kelas Anda' : 'Notifikasi terbaru untuk aktivitas belajar Anda'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button type="button" onClick={markAllRead} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-background hover:bg-secondary text-sm font-medium">
                                <CheckCheck className="w-4 h-4" />
                                Tandai Semua Dibaca
                            </button>
                            {isAdminAcademic && (
                                <button type="button" onClick={() => window.alert('Fitur broadcast akan disambungkan ke modul pengumuman.')} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold">
                                    <Megaphone className="w-4 h-4" />
                                    Kirim Broadcast
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        {filters.map((filter) => (
                            <button
                                key={filter.key}
                                type="button"
                                onClick={() => setActiveFilter(filter.key)}
                                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                    activeFilter === filter.key
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background text-muted-foreground border-border hover:text-foreground hover:bg-secondary'
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {showSearch && (
                        <div className="mt-4 relative w-full sm:w-[360px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Cari notifikasi..."
                                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm"
                            />
                        </div>
                    )}
                </section>

                <div className="space-y-3">
                    {filteredNotifications.length === 0 && (
                        <div className="panel-card p-4 text-sm text-muted-foreground">Tidak ada notifikasi untuk filter ini.</div>
                    )}

                    {filteredNotifications.map((notification) => {
                        const Icon = iconByType(notification.kind);
                        return (
                            <article
                                key={notification.id}
                                className={`panel-card p-4 border ${typeClass[notification.kind] ?? typeClass.info} ${!notification.read_at ? 'ring-1 ring-primary/20' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <button type="button" onClick={() => markRead(notification)} className="text-left flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <span className="h-9 w-9 rounded-xl bg-background/70 border border-border grid place-items-center">
                                                <Icon className="w-4 h-4 text-primary" />
                                            </span>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-lg truncate">{notification.title}</h3>
                                                    {!notification.read_at && <span className="w-2 h-2 rounded-full bg-primary" />}
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${statusBadgeClass(resolveStatus(notification))}`}>
                                                        {resolveStatus(notification)}
                                                    </span>
                                                </div>
                                                <p className="text-muted-foreground">{notification.message}</p>
                                                <p className="text-sm text-muted-foreground mt-1">{relativeTime(notification.created_at)}</p>
                                            </div>
                                        </div>
                                    </button>
                                    <button type="button" onClick={() => markRead(notification)} className="mt-1 p-2 rounded-lg border border-border hover:bg-secondary" title="Tandai dibaca">
                                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </ProtectedLayout>
    );
}
