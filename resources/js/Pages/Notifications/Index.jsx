import { Head, router } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { cn } from '@/lib/cn';

const UI = {
    panel: 'panel-card p-4',
    chip: 'inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium',
};

export default function NotificationIndex({ notifications = [], summary = { total: 0, unread: 0 } }) {
    const markAllRead = () => {
        router.put('/notifications/read-all', {}, { preserveScroll: true });
    };

    const markRead = (notification) => {
        router.put(`/notifications/${notification.id}/read`, {}, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Notifikasi" />
            <div className="space-y-6">
                <PageHeroBanner
                    title="Notification Center"
                    description="Lihat event terbaru sistem, enrollment, dan update aktivitas penting."
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                        <span className={UI.chip}>Total: {summary.total}</span>
                        <span className={UI.chip}>Belum dibaca: {summary.unread}</span>
                    </div>
                    <button
                        type="button"
                        onClick={markAllRead}
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-secondary transition-colors"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Tandai semua dibaca
                    </button>
                </div>

                <div className="space-y-3">
                    {notifications.length === 0 && (
                        <div className={cn(UI.panel, 'text-sm text-muted-foreground')}>
                            Belum ada notifikasi.
                        </div>
                    )}

                    {notifications.map((notification) => (
                        <button
                            type="button"
                            key={notification.id}
                            onClick={() => markRead(notification)}
                            className={cn(
                                UI.panel,
                                'w-full text-left hover:bg-secondary/40 transition-colors',
                                !notification.read_at && 'border-primary/30 bg-primary/5'
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-primary" />
                                        <p className="font-semibold truncate">{notification.title}</p>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {notification.created_at ? new Date(notification.created_at).toLocaleString('id-ID') : '-'}
                                    </p>
                                </div>
                                <span className={cn(UI.chip, notification.read_at ? 'text-muted-foreground' : 'text-primary')}>
                                    {notification.read_at ? 'Read' : 'Unread'}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </ProtectedLayout>
    );
}

