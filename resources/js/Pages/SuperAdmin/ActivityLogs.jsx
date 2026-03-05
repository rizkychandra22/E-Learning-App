import { Head, router } from '@inertiajs/react';
import { Search, Filter, Clock3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';

const typeStyles = {
    create: 'bg-success/15 text-success',
    update: 'bg-info/15 text-info',
    delete: 'bg-destructive/15 text-destructive',
};

export default function ActivityLogs({ logs, filters }) {
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
            <div className="space-y-6 max-w-7xl">
                <div className="animate-fade-in">
                    <h1 className="text-2xl font-bold tracking-tight">Log Aktivitas</h1>
                    <p className="text-muted-foreground mt-1">Pantau aktivitas perubahan data terbaru pada sistem</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Metric label="Total Log" value={totals.all} />
                    <Metric label="Create" value={totals.create} />
                    <Metric label="Update" value={totals.update} />
                    <Metric label="Delete" value={totals.delete} />
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

                <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px]">
                            <thead className="bg-secondary/50 text-left">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Waktu</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Modul</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Aksi</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Aktor</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Deskripsi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((item) => (
                                    <tr key={item.id} className="border-t border-border">
                                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                                            <div className="inline-flex items-center gap-2">
                                                <Clock3 className="w-3.5 h-3.5" />
                                                {new Date(item.time).toLocaleString('id-ID')}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{item.module}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${typeStyles[item.type] ?? 'bg-secondary text-secondary-foreground'}`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{item.actor}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.message}</td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                            Tidak ada aktivitas yang sesuai filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}

function Metric({ label, value }) {
    return (
        <div className="bg-card border border-border rounded-xl shadow-card p-4">
            <p className="text-xs uppercase font-semibold text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
    );
}
