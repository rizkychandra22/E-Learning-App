import { Head, router } from '@inertiajs/react';
import { Activity, Download, Filter } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { DataCardList, DataCard, CardField, CardBadge } from '@/components/DataCardList';
import { cn } from '@/lib/cn';

const metricStyles = {
    LCP: 'bg-primary/15 text-primary',
    CLS: 'bg-accent/15 text-accent-foreground',
    TBT: 'bg-warning/15 text-warning-foreground',
    FCP: 'bg-success/15 text-success-foreground',
};

const formatValue = (value, unit) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
    if (unit === 'score') return Number(value).toFixed(3);
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(Number(value));
};

export default function PerformanceLogs({ files = [], selected_file, entries = [], summary, mocked }) {
    const handleFileChange = (event) => {
        const file = event.target.value;
        router.visit(`/perf-logs?file=${encodeURIComponent(file)}`, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const metricLabels = Object.entries(summary?.by_metric || {}).map(([metric, count]) => `${metric}: ${count}`);

    return (
        <ProtectedLayout>
            <Head title="Performance Logs" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner
                    title="Performance Logs"
                    description="Monitoring metrik LCP, CLS, dan TBT dari sisi pengguna secara real-time."
                />

                {mocked && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-info/30 bg-info/10 text-info">
                        <Activity className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Mode data mock aktif.</p>
                            <p>Data hanya contoh untuk review tampilan.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-4">
                    <div className="panel-card p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <Filter className="w-4 h-4 text-primary" />
                            Pilih File Log
                        </div>
                        <div className="mt-3">
                            <select
                                value={selected_file || ''}
                                onChange={handleFileChange}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                {files.map((file) => (
                                    <option key={file.file} value={file.file}>
                                        {file.date}
                                    </option>
                                ))}
                                {!files.length && <option value="">Belum ada file log</option>}
                            </select>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <CardBadge className="bg-secondary/70 text-secondary-foreground">
                                Total Entry: {summary?.total ?? 0}
                            </CardBadge>
                            {metricLabels.map((label) => (
                                <CardBadge key={label} className="bg-secondary/40 text-secondary-foreground">
                                    {label}
                                </CardBadge>
                            ))}
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                            <Activity className="w-4 h-4" />
                            {summary?.latest ? `Terakhir: ${summary.latest}` : 'Belum ada data'}
                        </div>

                        {selected_file && !mocked && (
                            <a
                                href={`/perf-logs/download?file=${encodeURIComponent(selected_file)}`}
                                className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-95 transition"
                            >
                                <Download className="w-4 h-4" />
                                Unduh Log
                            </a>
                        )}
                        {selected_file && mocked && (
                            <button
                                type="button"
                                disabled
                                className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/60 text-primary-foreground text-sm font-medium opacity-60 cursor-not-allowed"
                            >
                                <Download className="w-4 h-4" />
                                Unduh Log
                            </button>
                        )}
                    </div>

                    <div className="panel-card p-4">
                        <h3 className="font-semibold mb-3">Detail Entry</h3>
                        <DataCardList
                            items={entries}
                            emptyText="Belum ada log performa untuk file ini."
                            className="max-h-[520px] overflow-y-auto pr-1"
                            renderCard={(entry, index) => (
                                <DataCard key={`${entry.timestamp}-${index}`} className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <CardBadge className={cn('text-xs', metricStyles[entry.metric] || 'bg-secondary/60 text-secondary-foreground')}>
                                            {entry.metric || 'Unknown'}
                                        </CardBadge>
                                        <span className="text-xs text-muted-foreground">{entry.timestamp || '-'}</span>
                                        {entry.path && <span className="text-xs text-muted-foreground">Path: {entry.path}</span>}
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <CardField label="Nilai" value={`${formatValue(entry.value, entry.unit)} ${entry.unit || ''}`.trim()} />
                                        <CardField label="User ID" value={entry.user_id ?? '-'} />
                                        <CardField label="IP" value={entry.ip ?? '-'} />
                                        <CardField label="User Agent" value={entry.ua ?? '-'} />
                                    </div>
                                </DataCard>
                            )}
                        />
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}

