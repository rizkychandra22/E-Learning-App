import { Head, router, usePage } from '@inertiajs/react';
import { Search, Filter, Clock3, Activity, PlusCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { KPI_CARD_BASE_CLASS, KPI_CARD_HEIGHT_CLASS } from '@/lib/card';
import { DataCardList, DataCard, CardBadge, CardField } from '@/components/DataCardList';

const typeStyles = {
    create: 'bg-success/15 text-success',
    update: 'bg-info/15 text-info',
    delete: 'bg-destructive/15 text-destructive',
};

export default function ActivityLogs({ logs, filters }) {
    const { props } = usePage();
    const intlLocale = toIntlLocale(props?.system?.default_language);
    const [query, setQuery] = useState(filters?.q ?? '');
    const [type, setType] = useState(filters?.type ?? 'all');

    const totals = useMemo(() => {
        return {
            all: logs.length,
            create: logs.filter((item) => item.type === 'create').length,
            update: logs.filter((item) => item.type === 'update').length,
            delete: logs.filter((item) => item.type === 'delete').length,
        };
    }, [logs]);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/activity-logs', { q: query, type }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const resetFilter = () => {
        setQuery('');
        setType('all');
        router.get('/activity-logs', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Log Aktivitas" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Log Aktivitas" description="Pantau aktivitas perubahan data terbaru pada sistem" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Metric label="Total Log" value={totals.all} icon={Activity} variant="primary" />
                    <Metric label="Create" value={totals.create} icon={PlusCircle} variant="success" />
                    <Metric label="Update" value={totals.update} icon={RefreshCw} variant="accent" />
                    <Metric label="Delete" value={totals.delete} icon={Trash2} variant="warm" />
                </div>

                <div className="bg-card border border-border rounded-xl shadow-card p-4">
                    <form onSubmit={submitFilter} className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Cari log..."
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <div className="relative md:w-56">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <select
                                value={type}
                                onChange={(event) => setType(event.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                <option value="all">Semua Tipe</option>
                                <option value="create">Create</option>
                                <option value="update">Update</option>
                                <option value="delete">Delete</option>
                            </select>
                        </div>
                        <button type="submit" className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">Filter</button>
                        <button type="button" onClick={resetFilter} className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-secondary/60 transition-colors">Reset</button>
                    </form>
                </div>

                <DataCardList
                    items={logs}
                    emptyText="Tidak ada aktivitas yang sesuai filter."
                    renderCard={(item) => {
                        const accentColors = { create: 'hsl(var(--success))', update: 'hsl(var(--info))', delete: 'hsl(var(--destructive))' };
                        return (
                            <DataCard key={item.id} accentColor={accentColors[item.type] ?? 'hsl(var(--muted-foreground))'}>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 sm:w-44">
                                        <Clock3 className="w-3.5 h-3.5" />
                                        {new Date(item.time).toLocaleString(intlLocale)}
                                    </div>
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 min-w-0">
                                        <CardField label="Modul" value={item.module} />
                                        <CardField label="Aktor" value={item.actor} />
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Aksi</p>
                                            <CardBadge className={typeStyles[item.type] ?? 'bg-secondary text-secondary-foreground'}>{item.type}</CardBadge>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">{item.message}</p>
                            </DataCard>
                        );
                    }}
                />
            </div>
        </ProtectedLayout>
    );
}

function Metric({ label, value, icon: Icon, variant = 'primary' }) {
    const variantClass = {
        primary: 'gradient-primary text-primary-foreground',
        accent: 'gradient-accent text-accent-foreground',
        warm: 'gradient-warm text-foreground',
        success: 'gradient-success text-success-foreground',
    };

    return (
        <div className={`${KPI_CARD_BASE_CLASS} ${KPI_CARD_HEIGHT_CLASS}`}>
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground truncate">{label}</p>
                {Icon && (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-card ${variantClass[variant] ?? variantClass.primary}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                )}
            </div>
            <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
    );
}
