import { Head, router } from '@inertiajs/react';
import { Bell, CheckCheck, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';

const FILTERS = [
    { key: 'all', label: 'Semua' },
    { key: 'unread', label: 'Belum Dibaca' },
    { key: 'warning', label: 'Warning' },
    { key: 'error', label: 'Error' },
    { key: 'info', label: 'Info' },
    { key: 'success', label: 'Success' },
    { key: 'broadcast', label: 'Broadcast' },
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

export default function NotificationIndex({ notifications = [], summary = { total: 0, unread: 0 } }) {
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
        () =>
            notifications.map((item) => ({
                ...item,
                kind: normalizeType(item.type),
            })),
        [notifications]
    );

    const filteredNotifications = useMemo(() => {
        return mapped.filter((item) => {
            const byFilter =
                activeFilter === 'all'
                    ? true
                    : activeFilter === 'unread'
                      ? !item.read_at
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
                <section className="panel-card p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <Bell className="w-6 h-6 text-primary" />
                                <h1 className="text-[34px] leading-none font-bold">Notifikasi</h1>
                                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground">
                                    {summary.unread} baru
                                </span>
                            </div>
                            <p className="mt-2 text-muted-foreground">Pusat notifikasi dan peringatan sistem</p>
                        </div>
                        <button
                            type="button"
                            onClick={markAllRead}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-background hover:bg-secondary transition-colors text-sm font-medium"
                        >
                            <CheckCheck className="w-4 h-4" />
                            Tandai Semua Dibaca
                        </button>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                        {FILTERS.map((filter) => (
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

                    <div className="mt-4 relative w-full sm:w-[360px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari notifikasi..."
                            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                </section>

                <div className="space-y-3">
                    {filteredNotifications.length === 0 && (
                        <div className="panel-card p-4 text-sm text-muted-foreground">Tidak ada notifikasi untuk filter ini.</div>
                    )}

                    {filteredNotifications.map((notification) => (
                        <article
                            key={notification.id}
                            className={`panel-card p-4 border ${typeClass[notification.kind] ?? typeClass.info} ${!notification.read_at ? 'ring-1 ring-primary/20' : ''}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() => markRead(notification)}
                                    className="text-left flex-1 min-w-0"
                                >
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg truncate">{notification.title}</h3>
                                        {!notification.read_at && <span className="w-2 h-2 rounded-full bg-primary" />}
                                    </div>
                                    <p className="mt-1 text-muted-foreground">{notification.message}</p>
                                    <p className="mt-2 text-sm text-muted-foreground">{relativeTime(notification.created_at)}</p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => markRead(notification)}
                                    className="mt-1 p-2 rounded-lg border border-border hover:bg-secondary transition-colors"
                                    title="Tandai dibaca"
                                >
                                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </ProtectedLayout>
    );
}
