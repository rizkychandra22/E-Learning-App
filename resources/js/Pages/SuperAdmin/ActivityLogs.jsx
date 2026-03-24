import { Head, router, usePage } from '@inertiajs/react';
import {
    Search,
    Clock3,
    Activity,
    PlusCircle,
    RefreshCw,
    Trash2,
    LogIn,
    BookOpen,
    Shield,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const typeStyles = {
    create: { badge: 'bg-success/15 text-success', icon: PlusCircle },
    update: { badge: 'bg-info/15 text-info', icon: RefreshCw },
    delete: { badge: 'bg-destructive/15 text-destructive', icon: Trash2 },
};

function relativeTime(value, locale) {
    if (!value) return '-';
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'Baru saja';
    if (min < 60) return `${min} menit lalu`;
    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour} jam lalu`;
    const day = Math.floor(hour / 24);
    return `${day} hari lalu`;
}

function MiniStat({ title, value, icon: Icon, tone = 'primary' }) {
    const toneClass = {
        primary: 'text-primary bg-primary/12',
        success: 'text-success bg-success/12',
        warning: 'text-warning bg-warning/12',
        info: 'text-info bg-info/12',
        accent: 'text-accent-foreground bg-accent/25',
    };

    return (
        <div className="panel-card p-3 min-h-[92px]">
            <div className="flex items-center gap-2">
                <span className={`h-7 w-7 rounded-lg grid place-items-center ${toneClass[tone] ?? toneClass.primary}`}>
                    <Icon className="w-4 h-4" />
                </span>
                <p className="text-xs text-muted-foreground">{title}</p>
            </div>
            <p className="mt-2 text-2xl font-bold leading-none">{value}</p>
        </div>
    );
}

export default function ActivityLogs({ logs, filters, mocked }) {
    const { props } = usePage();
    const intlLocale = toIntlLocale(props?.system?.default_language);
    const [query, setQuery] = useState(filters?.q ?? '');

    const totals = useMemo(() => {
        const loginCount = logs.filter((item) => String(item.message ?? '').toLowerCase().includes('login')).length;
        const createCount = logs.filter((item) => item.type === 'create').length;
        const updateCount = logs.filter((item) => item.type === 'update').length;
        const deleteCount = logs.filter((item) => item.type === 'delete').length;
        const enrollCount = logs.filter((item) => String(item.message ?? '').toLowerCase().includes('kursus')).length;
        const adminCount = logs.filter((item) => String(item.module ?? '').toLowerCase().includes('users')).length;

        return { loginCount, createCount, updateCount, deleteCount, enrollCount, adminCount };
    }, [logs]);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/activity-logs', { q: query, type: 'all' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Log Aktivitas" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Log Aktivitas" description="Rekam jejak seluruh aktivitas pengguna di platform" />

                {mocked && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-info/30 bg-info/10 text-info">
                        <Activity className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Mode data mock aktif.</p>
                            <p>Data hanya contoh untuk review tampilan.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    <MiniStat title="Login" value={totals.loginCount} icon={LogIn} tone="info" />
                    <MiniStat title="Buat" value={totals.createCount} icon={PlusCircle} tone="success" />
                    <MiniStat title="Edit" value={totals.updateCount} icon={RefreshCw} tone="primary" />
                    <MiniStat title="Hapus" value={totals.deleteCount} icon={Trash2} tone="warning" />
                    <MiniStat title="Enroll" value={totals.enrollCount} icon={BookOpen} tone="accent" />
                    <MiniStat title="Admin" value={totals.adminCount} icon={Shield} tone="primary" />
                </div>

                <div className="panel-card p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                        <h3 className="font-semibold text-xl">Riwayat Aktivitas</h3>
                        <form onSubmit={submitFilter} className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Cari aktivitas..."
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </form>
                    </div>

                    <div className="space-y-2">
                        {logs.length === 0 && (
                            <div className="panel-subcard p-3 text-sm text-muted-foreground">Tidak ada aktivitas yang sesuai filter.</div>
                        )}

                        {logs.map((item) => {
                            const style = typeStyles[item.type] ?? { badge: 'bg-secondary text-secondary-foreground', icon: Activity };
                            const Icon = style.icon;
                            return (
                                <div key={item.id} className="panel-subcard p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`h-8 w-8 rounded-xl grid place-items-center ${style.badge}`}>
                                                    <Icon className="w-4 h-4" />
                                                </span>
                                                <p className="font-semibold truncate">{item.actor}</p>
                                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">{item.module}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{item.message}</p>
                                        </div>
                                        <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                                            <p>{relativeTime(item.time, intlLocale)}</p>
                                            <p>{new Date(item.time).toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}
